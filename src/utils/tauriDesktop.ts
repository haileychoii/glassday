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

import { getCurrentWindow } from "@tauri-apps/api/window";

import { isTauriApp } from "./runtime";

export const DESKTOP_PIN_STORAGE_KEY = "glassday.desktop.pin.v1";

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

