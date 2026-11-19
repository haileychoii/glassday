
/**
 * ============================================================
 * GLASSDAY — TAURI NATIVE APPLICATION
 * 파일: src-tauri/src/lib.rs
 * ============================================================
 *
 * [역할]
 * - Tauri 애플리케이션 실행
 * - Google OAuth / Deep Link 연결
 * - 중복 애플리케이션 실행 방지
 * - Windows Native Window 외곽선 관리
 * - Window Resize / DPI 변경 대응
 *
 * [연결 파일]
 * - src-tauri/Cargo.toml
 * - src-tauri/tauri.conf.json
 * - src/lib/nativeGlassEffect.ts
 * - src/styles/desktop-window.css
 * - src/components/layout/AppShell.tsx
 *
 * [담당 영역]
 * Rust:
 *   실제 운영체제 Window의 외곽선
 *
 * TypeScript:
 *   Native Acrylic 및 테마 변경
 *
 * CSS:
 *   WebView 내부의 앱 디자인
 *
 * ============================================================
 */

use tauri::Manager;


/* ============================================================
   01. WINDOWS NATIVE API

   Windows에서만 운영체제 창 관련 API를 사용한다.
   다른 운영체제의 빌드에는 포함하지 않는다.
============================================================ */

#[cfg(target_os = "windows")]
use std::sync::atomic::{AtomicBool, Ordering};

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;

#[cfg(target_os = "windows")]
use windows::Win32::Graphics::Gdi::{
    CreateRoundRectRgn,
    DeleteObject,
    SetWindowRgn,
};


/* ============================================================
   02. NATIVE WINDOW CONSTANTS

   desktop-window.css와 동일한 모서리 값을 사용한다.

   일반 테마: 10px
   Pixel Desk: 0px
============================================================ */

#[cfg(target_os = "windows")]
const WINDOW_RADIUS: f64 = 10.0;

// 현재 Windows 창의 테마별 외곽선 상태
#[cfg(target_os = "windows")]
static SQUARE_WINDOW: AtomicBool = AtomicBool::new(false);


/* ============================================================
   03. APPLY NATIVE WINDOW REGION

   실제 Windows 창의 표시 영역을 지정한다.

   CSS에서만 모서리를 둥글게 처리할 경우
   Windows Acrylic 배경이 바깥쪽에 남을 수 있다.

   이 함수에서는 운영체제의 Window Region 자체를
   앱의 외곽 디자인과 맞춘다.
============================================================ */

#[cfg(target_os = "windows")]
fn apply_native_window_region(
    hwnd: HWND,
    size: tauri::PhysicalSize<u32>,
    scale_factor: f64,
) -> Result<(), String> {

    // 최소화 등으로 유효한 창 크기가 없는 경우 무시
    if size.width == 0 || size.height == 0 {
        return Ok(());
    }

    /* --------------------------------------------------------
       A. PIXEL DESK

       기존 둥근 Region을 제거하여 직각 창으로 복원한다.
    -------------------------------------------------------- */

    if SQUARE_WINDOW.load(Ordering::Relaxed) {

        let result = unsafe {
            SetWindowRgn(hwnd, None, true)
        };

        if result == 0 {
            return Err(
                "Failed to restore square window".into()
            );
        }

        return Ok(());
    }


    /* --------------------------------------------------------
       B. ROUNDED WINDOW

       CSS px을 Windows 실제 물리 픽셀로 변환한다.

       CreateRoundRectRgn은 반지름이 아니라
       모서리 타원의 폭과 높이를 사용한다.
    -------------------------------------------------------- */

    let diameter = (
        WINDOW_RADIUS * 2.0 * scale_factor
    )
    .round()
    .max(2.0) as i32;


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


    // 유효한 Region이 생성되었는지 확인
    if region.is_invalid() {

        return Err(
            "Failed to create native window region".into()
        );
    }


    /* --------------------------------------------------------
       C. APPLY REGION

       적용에 성공하면 Windows가 Region의 소유권을 가진다.

       실패한 경우에만 직접 메모리를 해제한다.
    -------------------------------------------------------- */

    let result = unsafe {

        SetWindowRgn(
            hwnd,
            Some(region),
            true,
        )
    };


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
   04. UPDATE NATIVE WINDOW SHAPE

   현재 실제 창의 크기 및 DPI 정보를 읽어
   Window Region을 다시 계산한다.

   연결:
   - 앱 최초 실행
   - 테마 변경
   - Native Window Resize
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

   TypeScript에서 현재 선택한 테마에 따라
   square 값을 전달한다.

   true  → Pixel Desk
   false → 일반 둥근 창
============================================================ */

#[tauri::command]
fn set_native_window_shape(
    window: tauri::WebviewWindow,
    square: bool,
) -> Result<(), String> {

    #[cfg(target_os = "windows")]
    {
        // 메인 Dashboard 창만 변경한다.
        if window.label() != "main" {
            return Ok(());
        }

        SQUARE_WINDOW.store(
            square,
            Ordering::Relaxed,
        );

        return update_native_window_region(
            &window
        );
    }

    // 다른 운영체제에서는 Windows 전용 작업을 수행하지 않는다.
    #[cfg(not(target_os = "windows"))]
    {
        let _ = (window, square);

        Ok(())
    }
}


/* ============================================================
   06. APPLICATION ENTRY POINT

   앱 시작 및 기존 플러그인 등록.
============================================================ */

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    let builder = tauri::Builder::default();


    /* --------------------------------------------------------
       A. SINGLE INSTANCE

       Google 인증 후 새 창을 만들지 않고
       이미 실행 중인 Glassday 창에 연결한다.
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
           B. EXTERNAL LINKS / GOOGLE LOGIN

           기존 인증 및 외부 브라우저 연결 유지.
        ---------------------------------------------------- */

        .plugin(
            tauri_plugin_opener::init()
        )

        .plugin(
            tauri_plugin_deep_link::init()
        )


        /* ----------------------------------------------------
           C. INITIAL APPLICATION SETUP
        ---------------------------------------------------- */

        .setup(|app| {

            // 개발 환경의 Windows Deep Link 등록
            #[cfg(all(debug_assertions, windows))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;

                app.deep_link().register_all()?;
            }


            // 개발 로그 활성화
            if cfg!(debug_assertions) {

                app.handle().plugin(

                    tauri_plugin_log::Builder::default()

                        .level(
                            log::LevelFilter::Info
                        )

                        .build(),

                )?;
            }


            // 앱 최초 실행 시 창 외곽선을 적용한다.
            #[cfg(target_os = "windows")]
            {
                if let Some(window) =
                    app.get_webview_window("main")
                {
                    if let Err(error) =
                        update_native_window_region(
                            &window
                        )
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

           창의 크기 또는 모니터 화면 배율이 변경되면
           기존 Window Region을 다시 계산한다.

           이 부분이 없으면 창을 확대했을 때
           새로운 영역이 제대로 표시되지 않을 수 있다.
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

           TypeScript의 invoke()와 Rust 함수를 연결한다.
        ---------------------------------------------------- */

        .invoke_handler(
            tauri::generate_handler![
                set_native_window_shape
            ]
        )


        /* ----------------------------------------------------
           F. RUN APPLICATION
        ---------------------------------------------------- */

        .run(
            tauri::generate_context!()
        )

        .expect(
            "error while running tauri application"
        );
}
