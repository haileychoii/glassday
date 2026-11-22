/**
 * Runtime boundary used by native-only helpers.
 *
 * Connection / 연결:
 * - AppShell and nativeGlassEffect use this signal to choose Tauri behavior.
 * - Browser Web and mobile Web return false and stay on browser APIs.
 * - This is intentionally a synchronous capability check; it does not open
 *   windows or persist settings by itself.
 */
export const isTauriApp =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/**
 * KO: WinUI WebView2도 Tauri처럼 네이티브 데스크톱 셸로 취급한다.
 *     단, 실제 Tauri API 사용 여부는 isTauriApp로 별도 판단한다.
 * EN: WinUI WebView2 shares the native desktop shell layout with Tauri,
 *     while actual Tauri API calls still use isTauriApp separately.
 */
export const isNativeDesktopShell =
  isTauriApp ||
  (typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("shell") === "winui");
