/**
 * Apply the operating-system blur used by the two glass themes.
 *
 * English: CSS `backdrop-filter` can blur content rendered inside WebView2,
 * but it cannot sample the Windows desktop behind a transparent Tauri window.
 * On Windows 11 build 22621+, legacy blur-behind can be transparent without
 * actually blurring. Desktop Acrylic is the native material for that case;
 * the rounded Win32 region below prevents a rectangular backdrop.
 *
 * Korean: 웹뷰 내부 배경은 CSS가 흐리지만 실제 바탕화면 픽셀은 읽을 수 없다.
 * 최신 Windows 11에서는 blur-behind만으로 흐림이 보이지 않을 수 있으므로
 * Desktop Acrylic을 쓰고 네이티브 둥근 영역으로 바깥 사각형을 잘라낸다.
 */
#[cfg(target_os = "windows")]
use std::sync::atomic::{AtomicBool, Ordering};

#[cfg(target_os = "windows")]
use windows::Win32::Graphics::Dwm::{DwmSetWindowAttribute, DWMWA_USE_IMMERSIVE_DARK_MODE};

#[cfg(target_os = "windows")]
use windows::Win32::Graphics::Gdi::{CreateRoundRectRgn, DeleteObject, SetWindowRgn};

// AppShell.tsx sends "square" only for Pixel Desk. The single main window keeps
// this flag so resizing can reapply the same native outline without a JS roundtrip.
// Pixel Desk만 각진 외곽을 쓰고, 크기 조절 중에도 마지막 테마 모양을 유지한다.
#[cfg(target_os = "windows")]
static ROUNDED_NATIVE_WINDOW: AtomicBool = AtomicBool::new(true);

#[cfg(target_os = "windows")]
fn apply_native_window_region(
    hwnd: windows::Win32::Foundation::HWND,
    size: tauri::PhysicalSize<u32>,
    scale_factor: f64,
) -> Result<(), String> {
    if !ROUNDED_NATIVE_WINDOW.load(Ordering::Relaxed) {
        // Releasing the region restores the exact square outline for Pixel Desk.
        // 기존 둥근 region을 해제해야 픽셀 테마 네 귀퉁이가 다시 각져 보인다.
        return if unsafe { SetWindowRgn(hwnd, None, true) } != 0 {
            Ok(())
        } else {
            Err("Could not clear the native window region".into())
        };
    }

    // CSS uses 22px corners in overrides.css. WebView zoom is 80% in
    // tauriDesktop.ts; Windows regions need physical pixels at the current DPI.
    // CSS 반지름 22px과 WebView 80% 배율을 실제 모니터 픽셀로 환산한다.
    let diameter = (44.0 * 0.8 * scale_factor).round().max(2.0) as i32;
    let region = unsafe {
        CreateRoundRectRgn(
            0,
            0,
            size.width as i32 + 1,
            size.height as i32 + 1,
            diameter,
            diameter,
        )
    };

    if region.is_invalid() {
        return Err("Could not create the rounded window region".into());
    }

    // On success Windows owns the region. On failure we must free it ourselves.
    // 성공하면 Windows가 소유하고, 실패한 경우에만 직접 해제해야 누수가 없다.
    if unsafe { SetWindowRgn(hwnd, Some(region), true) } == 0 {
        let _ = unsafe { DeleteObject(region.into()) };
        return Err("Could not apply the rounded window region".into());
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn update_native_window_region(window: &tauri::WebviewWindow) -> Result<(), String> {
    let hwnd = window.hwnd().map_err(|error| error.to_string())?;
    let size = window.inner_size().map_err(|error| error.to_string())?;
    let scale_factor = window.scale_factor().map_err(|error| error.to_string())?;
    apply_native_window_region(hwnd, size, scale_factor)
}

#[cfg(target_os = "windows")]
#[tauri::command]
fn set_native_glass_effect(window: tauri::WebviewWindow, mode: String) -> Result<(), String> {
    use window_vibrancy::{apply_acrylic, apply_blur, clear_acrylic, clear_blur};

    // Clear both supported backdrops before changing modes. The previous
    // release used Acrylic, so clearing it also handles live upgrades safely.
    // 이전 버전의 Acrylic과 현재 blur를 모두 지워 테마 전환 잔상을 막는다.
    clear_blur(&window).map_err(|error| error.to_string())?;
    clear_acrylic(&window).map_err(|error| error.to_string())?;

    if matches!(mode.as_str(), "light" | "dark") {
        // Desktop Acrylic samples the actual windows/wallpaper behind WebView2.
        // `apply_blur` is a fallback for older Windows versions only: on this
        // machine's newer Windows 11 it can return Ok without visible blur.
        // Acrylic은 실제 바탕화면을 흐린다. 구형 Windows만 blur-behind로 대체한다.
        let dark_mode: i32 = i32::from(mode == "dark");
        let hwnd = window.hwnd().map_err(|error| error.to_string())?;
        if let Err(error) = unsafe {
            DwmSetWindowAttribute(
                hwnd,
                DWMWA_USE_IMMERSIVE_DARK_MODE,
                &dark_mode as *const _ as _,
                std::mem::size_of_val(&dark_mode) as u32,
            )
        } {
            log::warn!("Could not set native glass color mode: {error}");
        }

        let tint = if mode == "light" {
            (242, 248, 255, 72)
        } else {
            (22, 24, 30, 92)
        };
        apply_acrylic(&window, Some(tint))
            .or_else(|_| apply_blur(&window, Some(tint)))
            .map_err(|error| error.to_string())?;
    }

    ROUNDED_NATIVE_WINDOW.store(mode != "square", Ordering::Relaxed);
    update_native_window_region(&window)
}

/**
 * Keep the frontend command portable on non-Windows builds.
 * macOS/Linux에서는 같은 invoke가 실패하지 않도록 안전한 no-op으로 둔다.
 */
#[cfg(not(target_os = "windows"))]
#[tauri::command]
fn set_native_glass_effect(_window: tauri::WebviewWindow, _mode: String) -> Result<(), String> {
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    // Source: tauri-apps/plugins-workspace, plugins/window-state (MIT/Apache-2.0).
    // Keep only placement: src/utils/tauriDesktop.ts owns the desktop-pin
    // preference, and src-tauri/tauri.conf.json owns window chrome defaults.
    // 공식 플러그인에서 위치·크기만 복원한다. 바탕화면 고정과 창 장식 설정은
    // 각 파일이 계속 관리해 재시작할 때 설정이 서로 덮어쓰이지 않게 한다.
    #[cfg(desktop)]
    let builder = builder.plugin(
        tauri_plugin_window_state::Builder::default()
            .with_state_flags(
                tauri_plugin_window_state::StateFlags::POSITION
                    | tauri_plugin_window_state::StateFlags::SIZE,
            )
            .build(),
    );

    builder
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            // TauriResizeHandles.tsx resizes the borderless host. Rebuild the
            // Win32 region at the new physical size so lower corners stay round.
            // 창 크기를 바꾸거나 DPI가 달라져도 네이티브 blur 경계를 다시 맞춘다.
            #[cfg(target_os = "windows")]
            if window.label() == "main" {
                let size = match event {
                    tauri::WindowEvent::Resized(size) => Some(*size),
                    tauri::WindowEvent::ScaleFactorChanged { new_inner_size, .. } => {
                        Some(*new_inner_size)
                    }
                    _ => None,
                };

                if let Some(size) = size {
                    if let (Ok(hwnd), Ok(scale_factor)) = (window.hwnd(), window.scale_factor()) {
                        if let Err(error) = apply_native_window_region(hwnd, size, scale_factor) {
                            log::warn!("Could not update native window corners: {error}");
                        }
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![set_native_glass_effect])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
