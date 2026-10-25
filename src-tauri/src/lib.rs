/**
 * Apply the operating-system blur used by the two glass themes.
 *
 * English: CSS `backdrop-filter` can blur content rendered inside WebView2,
 * but it cannot sample the Windows desktop behind a transparent Tauri window.
 * Acrylic provides that missing native blur layer.
 *
 * Korean: 웹뷰 내부 배경은 CSS가 흐리지만 실제 바탕화면 픽셀은 읽을 수 없다.
 * Light와 Dark 모두 Windows Acrylic을 켜 바탕화면까지 흐리게 만든다.
 */
#[cfg(target_os = "windows")]
#[tauri::command]
fn set_native_glass_effect(window: tauri::WebviewWindow, mode: String) -> Result<(), String> {
    use window_vibrancy::{apply_acrylic, clear_acrylic};

    // Clear the previous material before changing modes. This prevents the
    // light tint from leaking into dark glass after a live theme switch.
    // 테마 전환 시 이전 틴트가 남지 않도록 기존 효과를 먼저 해제한다.
    clear_acrylic(&window).map_err(|error| error.to_string())?;

    match mode.as_str() {
        // Light uses a low-alpha cool white tint. CSS adds the visible highlights,
        // so the native layer can focus on blur without becoming a gray sheet.
        // Light는 흐림만 담당하도록 흰 틴트를 얇게 두어 회색 판처럼 보이지 않는다.
        "light" => {
            apply_acrylic(&window, Some((229, 241, 255, 44))).map_err(|error| error.to_string())
        }
        // Dark needs a denser neutral tint because CSS backdrop-filter cannot hide
        // desktop text outside WebView2. This keeps color motion but removes detail.
        // Dark는 바탕화면 글자는 지우고 색의 움직임만 남도록 중성 틴트를 더 진하게 둔다.
        "dark" => {
            apply_acrylic(&window, Some((12, 14, 20, 142))).map_err(|error| error.to_string())
        }
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
