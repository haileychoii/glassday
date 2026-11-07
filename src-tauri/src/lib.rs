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
        "light" => apply_blur(&window, Some((218, 238, 255, 8))).map_err(|error| error.to_string()),
        // Dark keeps a low-alpha neutral smoke tint. Blur removes readable
        // desktop detail while preserving more background color than Acrylic.
        // Dark도 회색 판 대신 얇은 smoke tint와 blur로 배경 형태만 흐린다.
        "dark" => apply_blur(&window, Some((12, 14, 20, 64))).map_err(|error| error.to_string()),
        _ => Ok(()),
    }
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
        .invoke_handler(tauri::generate_handler![set_native_glass_effect])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
