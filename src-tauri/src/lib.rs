/**
 * Toggle the operating-system blur used only by the Glass Light theme.
 *
 * English: CSS `backdrop-filter` can blur content rendered inside WebView2,
 * but it cannot sample the Windows desktop behind a transparent Tauri window.
 * Acrylic provides that missing native blur layer.
 *
 * Korean: 웹뷰 내부 배경은 CSS가 흐리지만 실제 바탕화면 픽셀은 읽을 수 없다.
 * Glass Light에서만 Windows Acrylic을 켜 그 바탕화면까지 흐리게 만든다.
 */
#[cfg(target_os = "windows")]
#[tauri::command]
fn set_native_glass_effect(
  window: tauri::WebviewWindow,
  enabled: bool,
) -> Result<(), String> {
  use window_vibrancy::{apply_acrylic, clear_acrylic};

  if enabled {
    // A low-alpha cool white tint keeps the desktop visible while matching
    // the CSS milk-glass layer. / 흰색 막은 CSS와 겹쳐도 탁해지지 않게 얇게 둔다.
    apply_acrylic(&window, Some((244, 248, 255, 92)))
      .map_err(|error| error.to_string())
  } else {
    clear_acrylic(&window).map_err(|error| error.to_string())
  }
}

/**
 * Keep the frontend command portable on non-Windows builds.
 * macOS/Linux에서는 같은 invoke가 실패하지 않도록 안전한 no-op으로 둔다.
 */
#[cfg(not(target_os = "windows"))]
#[tauri::command]
fn set_native_glass_effect(
  _window: tauri::WebviewWindow,
  _enabled: bool,
) -> Result<(), String> {
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
