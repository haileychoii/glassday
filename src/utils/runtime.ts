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
