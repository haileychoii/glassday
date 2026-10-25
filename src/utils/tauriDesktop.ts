/**
 * ============================================================
 * Tauri desktop pin preference and native window bridge
 * ============================================================
 *
 * Role:
 * - Stores the user's desktop-widget preference separately from dashboard data.
 * - Applies the preference to the native Tauri window when the API is available.
 *
 * Korean:
 * - 웹에서는 native window API를 호출하지 않고 저장값만 안전하게 읽는다.
 * - Tauri에서는 창을 다른 일반 창 뒤에 둬 바탕화면 위젯처럼 유지한다.
 * ============================================================
 */

import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

import { isTauriApp } from "./runtime";

export const DESKTOP_PIN_STORAGE_KEY = "glassday.desktop.pin.v1";

/**
 * Keep this value aligned with `src-tauri/tauri.conf.json`.
 * English: Logical pixels make the restored size consistent across Windows
 * display scaling levels. Only the size is restored; the user's window
 * position stays untouched.
 * Korean: Windows 배율과 무관하게 같은 체감 크기로 돌아오도록 논리 픽셀을
 * 사용한다. 창 위치는 사용자가 배치한 그대로 두고 크기만 초기값으로 복원한다.
 */
export const LAPTOP_REFERENCE_SIZE = {
  width: 1080,
  height: 720,
} as const;

export const DEFAULT_TAURI_ZOOM = 0.8;

/* Vercel Laptop at 80% / Vercel Laptop 80%와 같은 실제 점유 크기
   1080 x 720 multiplied by 0.8 becomes an 864 x 576 native window. Keeping
   the formula here prevents tauri.conf.json, Settings, and reset logic from
   drifting into different defaults. */
export const DEFAULT_TAURI_WINDOW_SIZE = {
  width: Math.round(LAPTOP_REFERENCE_SIZE.width * DEFAULT_TAURI_ZOOM),
  height: Math.round(LAPTOP_REFERENCE_SIZE.height * DEFAULT_TAURI_ZOOM),
} as const;

/**
 * Match the native WebView to the browser's 80% page zoom.
 * English: Native size alone only reduces the viewport; WebView zoom also
 * scales type, controls, spacing, and media-query coordinates like Vercel.
 * Korean: 창 크기뿐 아니라 글자·간격·컨트롤까지 웹 80%와 같게 축소한다.
 */
export const applyDefaultTauriZoom = async () => {
  if (!isTauriApp) return;

  await getCurrentWebview().setZoom(DEFAULT_TAURI_ZOOM);
};

/**
 * Missing values default to true because the Tauri window configuration has
 * historically behaved as an always-on-bottom desktop surface.
 * 저장값이 없을 때도 기존 Tauri 동작과 일치하도록 바탕화면 고정을 기본값으로 둔다.
 */
export const getSavedDesktopPin = () => {
  if (typeof window === "undefined") return true;

  return window.localStorage.getItem(DESKTOP_PIN_STORAGE_KEY) !== "false";
};

/**
 * Persist first, then update the native window only inside Tauri.
 * Saving locally before the native call keeps the next launch deterministic
 * even when a platform window manager temporarily rejects the update.
 * 로컬 저장을 먼저 수행해 native API 실패가 다음 실행의 선택까지 잃게 하지 않는다.
 */
export const setDesktopPin = async (pinned: boolean) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DESKTOP_PIN_STORAGE_KEY, String(pinned));
  }

  if (!isTauriApp) return;

  await getCurrentWindow().setAlwaysOnBottom(pinned);
};

/**
 * Restore the native shell to the initial size declared in tauri.conf.json.
 * English: SettingsModal calls this bridge instead of importing Tauri APIs
 * directly, so browser builds never attempt to control a native window.
 * Korean: SettingsModal이 Tauri API를 직접 호출하지 않고 이 함수를 거치므로
 * 웹 빌드에서는 native window 제어가 실행되지 않는다.
 */
export const resetTauriWindowSize = async () => {
  if (!isTauriApp) return;

  await Promise.all([
    getCurrentWindow().setSize(
      new LogicalSize(
        DEFAULT_TAURI_WINDOW_SIZE.width,
        DEFAULT_TAURI_WINDOW_SIZE.height
      )
    ),
    applyDefaultTauriZoom(),
  ]);
};

/**
 * Synchronize Glass Light with the Rust Acrylic command in
 * `src-tauri/src/lib.rs`.
 *
 * English: Browser previews keep using CSS backdrop-filter. Only the native
 * shell invokes Windows Acrylic, and disabling the theme clears the effect so
 * Pixel, Retro, Aurora, and the other themes keep their own material.
 *
 * Korean: 웹 미리보기는 CSS만 사용한다. Tauri에서만 Acrylic을 호출하고,
 * 다른 테마로 바꾸면 즉시 해제해 각 테마의 표면이 서로 섞이지 않게 한다.
 */
export const setNativeGlassLightEffect = async (enabled: boolean) => {
  if (!isTauriApp) return;

  await invoke("set_native_glass_effect", { enabled });
};
