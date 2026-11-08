/**
 * Apply the operating-system blur used by the two glass themes.
 *
 * English: CSS `backdrop-filter` can blur content rendered inside WebView2,
 * but it cannot sample the Windows desktop behind a transparent Tauri window.
 * Windows blur-behind provides that missing native layer without adding the
 * opaque system Acrylic rectangle seen on Windows 11.
 *
 * Korean: 웹뷰 내부 배경은 CSS가 흐리지만 실제 바탕화면 픽셀은 읽을 수 없다.
 * Windows 11 기본 Acrylic의 회색 판을 피하고 blur-behind로 바탕화면만 흐린다.
 */
#[cfg(target_os = "windows")]
use std::sync::atomic::{AtomicBool, Ordering};

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
    use window_vibrancy::{apply_blur, clear_acrylic, clear_blur};

    // Clear both supported backdrops before changing modes. The previous
    // release used Acrylic, so clearing it also handles live upgrades safely.
    // 이전 버전의 Acrylic과 현재 blur를 모두 지워 테마 전환 잔상을 막는다.
    clear_blur(&window).map_err(|error| error.to_string())?;
    clear_acrylic(&window).map_err(|error| error.to_string())?;

    match mode.as_str() {
        // `apply_blur` honors this tiny alpha on Windows 11, unlike Acrylic's
        // system-controlled gray tint. CSS cards provide the visible edges.
        // Light는 거의 무색의 blur만 쓰고 카드의 얇은 테두리로 형태를 만든다.
        "light" => {
            apply_blur(&window, Some((218, 238, 255, 8))).map_err(|error| error.to_string())?
        }
        // Dark keeps a low-alpha neutral smoke tint. Blur removes readable
        // desktop detail while preserving more background color than Acrylic.
        // Dark도 회색 판 대신 얇은 smoke tint와 blur로 배경 형태만 흐린다.
        "dark" => apply_blur(&window, Some((12, 14, 20, 64))).map_err(|error| error.to_string())?,
        _ => (),
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
    tauri::Builder::default()
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
