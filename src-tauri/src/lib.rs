
/**
 * ============================================================
 * GLASSDAY — TAURI NATIVE APPLICATION
 * 파일: src-tauri/src/lib.rs
 * ============================================================
 *
 * [역할]
 * 1. Tauri 애플리케이션 실행
 * 2. Google OAuth / Deep Link 연결
 * 3. 애플리케이션 중복 실행 방지
 * 4. Windows 창 외곽선 및 모서리 관리
 * 5. 창 크기 및 DPI 변경 대응
 *
 * [연결 파일]
 * - src-tauri/Cargo.toml
 * - src-tauri/tauri.conf.json
 * - src-tauri/capabilities/default.json
 * - src/lib/nativeGlassEffect.ts
 * - src/styles/desktop-window.css
 * - src/components/layout/AppShell.tsx
 *
 * ============================================================
 */

use tauri::Manager;


/* ============================================================
   01. WINDOWS NATIVE API

   Windows에서만 창의 실제 표시 영역을 제어한다.
   다른 운영체제에서는 Windows API를 사용하지 않는다.
   ============================================================ */

#[cfg(target_os = "windows")]
use std::sync::atomic::{AtomicBool, Ordering};

#[cfg(target_os = "windows")]
use std::ffi::c_void;

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;

#[cfg(target_os = "windows")]
use windows::Win32::System::LibraryLoader::{
    GetModuleHandleW,
    GetProcAddress,
};

#[cfg(target_os = "windows")]
use windows::core::{s, w};

#[cfg(target_os = "windows")]
use windows::Win32::Graphics::Gdi::{
    CreateRoundRectRgn,
    DeleteObject,
    SetWindowRgn,
};


/* ============================================================
   02. WINDOW GEOMETRY CONSTANTS

   desktop-window.css의 외곽 Radius와 동일하게 유지한다.

   일반 테마: 10px
   Pixel Desk: 0px
   ============================================================ */

#[cfg(target_os = "windows")]
const WINDOW_RADIUS: f64 = 10.0;

#[cfg(target_os = "windows")]
static SQUARE_WINDOW: AtomicBool = AtomicBool::new(false);


/* ============================================================
   02-B. WINDOWS ACCENT BLUR

   Tauri의 일반 WindowEffect는 비활성 창에서 tint가 불투명해질 수 있어
   Windows 창 자체의 composition layer에 blur를 직접 적용한다.

   / EN: This keeps the WebView transparent while the Windows compositor
   owns the blurred desktop backdrop. The CSS layer remains responsible for
   theme colors and cards.
   ============================================================ */

#[cfg(target_os = "windows")]
const ACCENT_DISABLED: u32 = 0;

#[cfg(target_os = "windows")]
const ACCENT_ENABLE_ACRYLICBLURBEHIND: u32 = 4;

#[cfg(target_os = "windows")]
const WCA_ACCENT_POLICY: u32 = 19;

#[cfg(target_os = "windows")]
#[repr(C)]
struct AccentPolicy {
    accent_state: u32,
    accent_flags: u32,
    gradient_color: u32,
    animation_id: u32,
}

#[cfg(target_os = "windows")]
#[repr(C)]
struct WindowCompositionAttributeData {
    attribute: u32,
    data: *mut c_void,
    size: usize,
}

#[cfg(target_os = "windows")]
fn apply_native_blur(
    hwnd: HWND,
    enabled: bool,
    dark: bool,
) -> Result<(), String> {
    // ARGB: 낮은 alpha를 사용해 바탕화면 blur가 검정 판으로 굳지 않게 한다.
    let gradient_color = if dark {
        0x88202736
    } else {
        0x88F4F7FF
    };

    let mut policy = AccentPolicy {
        accent_state: if enabled {
            ACCENT_ENABLE_ACRYLICBLURBEHIND
        } else {
            ACCENT_DISABLED
        },
        accent_flags: 2,
        gradient_color,
        animation_id: 0,
    };

    let mut data = WindowCompositionAttributeData {
        attribute: WCA_ACCENT_POLICY,
        data: (&mut policy as *mut AccentPolicy).cast(),
        size: std::mem::size_of::<AccentPolicy>(),
    };

    // The API is exported by user32.dll but is not part of the public
    // windows-rs import surface, so resolve it at runtime instead of asking
    // the linker for a static symbol that may not exist in the import lib.
    let user32 = unsafe {
        GetModuleHandleW(w!("user32.dll"))
            .map_err(|error| error.to_string())?
    };
    let procedure = unsafe {
        GetProcAddress(user32, s!("SetWindowCompositionAttribute"))
            .ok_or_else(|| "SetWindowCompositionAttribute is unavailable".to_string())?
    };
    let set_window_composition_attribute: unsafe extern "system" fn(
        HWND,
        *mut WindowCompositionAttributeData,
    ) -> i32 = unsafe { std::mem::transmute(procedure) };
    let result = unsafe {
        set_window_composition_attribute(hwnd, &mut data)
    };

    if result != 0 {
        Ok(())
    } else {
        Err("Windows composition blur could not be applied".into())
    }
}


/* ============================================================
   03. APPLY NATIVE WINDOW REGION

   CSS에서 앱의 모서리만 둥글게 처리하면
   Windows의 실제 창 배경이 바깥에 남을 수 있다.

   운영체제의 창 경계를 CSS와 동일하게 맞춰준다.
   ============================================================ */

#[cfg(target_os = "windows")]
fn apply_native_window_region(
    hwnd: HWND,
    size: tauri::PhysicalSize<u32>,
    scale_factor: f64,
) -> Result<(), String> {

    // 유효하지 않은 창 크기는 무시한다.
    if size.width == 0 || size.height == 0 {
        return Ok(());
    }

    // Pixel Desk에서는 둥근 창 영역을 제거한다.
    if SQUARE_WINDOW.load(Ordering::Relaxed) {
        let result = unsafe {
            SetWindowRgn(hwnd, None, true)
        };

        return if result != 0 {
            Ok(())
        } else {
            Err("Failed to restore square window".into())
        };
    }

    // CSS 반지름을 Windows 물리 픽셀 단위의 지름으로 변환한다.
    // Windows의 디스플레이 배율도 함께 반영한다.
    let diameter = (WINDOW_RADIUS * 2.0 * scale_factor)
        .round()
        .max(2.0) as i32;

    // 둥근 사각형 형태의 실제 창 영역을 생성한다.
    let region = unsafe {
        CreateRoundRectRgn(
            0,
            0,
            size.width as i32,
            size.height as i32,
            diameter,
            diameter,
        )
    };

    if region.is_invalid() {
        return Err(
            "Failed to create native window region".into()
        );
    }

    // 생성한 영역을 Windows 창에 적용한다.
    let result = unsafe {
        SetWindowRgn(hwnd, Some(region), true)
    };

    // 성공하면 Windows가 Region을 관리한다.
    // 실패한 경우에만 직접 메모리를 해제한다.
    if result == 0 {
        let _ = unsafe {
            DeleteObject(region.into())
        };

        return Err(
            "Failed to apply native window region".into()
        );
    }

    Ok(())
}


/* ============================================================
   04. UPDATE WINDOW REGION

   실제 창의 크기와 디스플레이 배율을 읽어
   현재 창의 외곽선을 다시 계산한다.
   ============================================================ */

#[cfg(target_os = "windows")]
fn update_native_window_region(
    window: &tauri::WebviewWindow,
) -> Result<(), String> {

    let hwnd = window
        .hwnd()
        .map_err(|error| error.to_string())?;

    let size = window
        .outer_size()
        .map_err(|error| error.to_string())?;

    let scale_factor = window
        .scale_factor()
        .map_err(|error| error.to_string())?;

    apply_native_window_region(
        hwnd,
        size,
        scale_factor,
    )
}


/* ============================================================
   05. TAURI COMMAND — WINDOW SHAPE

   연결: src/lib/nativeGlassEffect.ts

   테마 변경 시 TypeScript에서 호출한다.

   square = true  → Pixel Desk
   square = false → 일반 테마

   Money 및 Journal 독립 창에는 적용하지 않는다.
   ============================================================ */

#[tauri::command]
fn set_native_window_shape(
    window: tauri::WebviewWindow,
    square: bool,
) -> Result<(), String> {

    #[cfg(target_os = "windows")]
    {
        // 기본 Dashboard 창만 제어한다.
        if window.label() != "main" {
            return Ok(());
        }

        SQUARE_WINDOW.store(
            square,
            Ordering::Relaxed,
        );

        update_native_window_region(&window)
    }

    // Windows 이외의 운영체제에서는 실행하지 않는다.
    #[cfg(not(target_os = "windows"))]
    {
        let _ = (window, square);

        Ok(())
    }
}


/* ============================================================
   05-B. TAURI COMMAND — DESKTOP BLUR

   연결: src/lib/nativeGlassEffect.ts
   - glass 테마: enabled=true
   - Pixel Desk / Mac Core / Pink Diary: enabled=false
   ============================================================ */

#[tauri::command]
fn set_native_window_blur(
    window: tauri::WebviewWindow,
    enabled: bool,
    dark: bool,
) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        if window.label() != "main" {
            return Ok(());
        }

        let hwnd = window
            .hwnd()
            .map_err(|error| error.to_string())?;

        return apply_native_blur(hwnd, enabled, dark);
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = (window, enabled, dark);
        Ok(())
    }
}


/* ============================================================
   06. APPLICATION ENTRY POINT

   Glassday 앱 실행 및 플러그인 등록
   ============================================================ */

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    let builder = tauri::Builder::default();


    /* --------------------------------------------------------
       A. SINGLE INSTANCE

       Google OAuth 인증이 끝나면 새로운 창을 만들지 않고
       이미 실행 중인 Glassday 창으로 돌아온다.
       -------------------------------------------------------- */

    #[cfg(desktop)]
    let builder = builder.plugin(
        tauri_plugin_single_instance::init(
            |app, _args, _cwd| {

                if let Some(window) =
                    app.get_webview_window("main")
                {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            },
        ),
    );


    builder

        /* ----------------------------------------------------
           B. PLUGINS

           외부 링크 및 Google 로그인 연동
           ---------------------------------------------------- */

        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())


        /* ----------------------------------------------------
           C. INITIAL SETUP

           앱 시작 시 실행되는 초기 설정
           ---------------------------------------------------- */

        .setup(|app| {

            // Windows 개발 환경의 Deep Link 등록
            #[cfg(all(debug_assertions, windows))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;

                app.deep_link().register_all()?;
            }

            // 개발 환경 로그 활성화
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Windows 기본 창 외곽선 적용
            #[cfg(target_os = "windows")]
            {
                if let Some(window) =
                    app.get_webview_window("main")
                {
                    if let Err(error) =
                        update_native_window_region(&window)
                    {
                        log::warn!(
                            "Native window setup failed: {error}"
                        );
                    }
                }
            }

            Ok(())
        })


        /* ----------------------------------------------------
           D. WINDOW RESIZE / DPI CHANGE

           실제 창의 크기 또는 디스플레이 배율이 변경되면
           둥근 창 영역을 다시 계산한다.

           독립 Money / Journal 창에는 적용하지 않는다.
           ---------------------------------------------------- */

        .on_window_event(|window, event| {

            #[cfg(target_os = "windows")]
            {
                if window.label() != "main" {
                    return;
                }

                match event {

                    tauri::WindowEvent::Resized(_)
                    | tauri::WindowEvent::ScaleFactorChanged {
                        ..
                    } => {

                        if let (
                            Ok(hwnd),
                            Ok(size),
                            Ok(scale_factor),
                        ) = (
                            window.hwnd(),
                            window.outer_size(),
                            window.scale_factor(),
                        ) {

                            if let Err(error) =
                                apply_native_window_region(
                                    hwnd,
                                    size,
                                    scale_factor,
                                )
                            {
                                log::warn!(
                                    "Window region update failed: {error}"
                                );
                            }
                        }
                    }

                    _ => {}
                }
            }

            #[cfg(not(target_os = "windows"))]
            let _ = (window, event);
        })


        /* ----------------------------------------------------
           E. FRONTEND COMMAND REGISTRATION

           TypeScript와 Rust의 기능을 연결한다.
           ---------------------------------------------------- */

        .invoke_handler(
            tauri::generate_handler![
                set_native_window_shape,
                set_native_window_blur
            ]
        )


        /* ----------------------------------------------------
           F. RUN APPLICATION
           ---------------------------------------------------- */

        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
