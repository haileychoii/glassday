/**
 * Open a user-provided external URL in the correct host.
 *
 * English: Tauri does not reliably support `window.open` for external pages,
 * so desktop builds use the native opener plugin while the web build keeps the
 * normal browser-tab behavior.
 * Korean: Tauri에서는 `window.open`만으로 외부 페이지를 안정적으로 열 수
 * 없으므로 데스크톱은 native opener를 사용하고, 웹에서는 새 탭을 사용한다.
 */
import { isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";

export async function openExternalUrl(url: string): Promise<void> {
  const value = url.trim();
  if (!value) return;

  try {
    if (isTauri()) {
      await openUrl(value);
      return;
    }
  } catch (error) {
    // Keep the browser fallback available when the native opener is unavailable.
    console.warn("[Glassday] native external URL opener failed", error);
  }

  if (typeof window === "undefined") return;

  const popup = window.open(value, "_blank", "noopener,noreferrer");
  if (popup) return;

  // Browser popup blockers may return null. An explicit anchor still gives the
  // user a normal navigation path instead of silently doing nothing.
  const anchor = document.createElement("a");
  anchor.href = value;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.click();
}
