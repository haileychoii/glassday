/**
 * ============================================================
 * [UI Preference] Global Scrollbar Visibility
 * ============================================================
 *
 * 화면 연결:
 * - Toggle UI: src/components/settings/SettingsModal.tsx
 * - CSS selector: .glassday-scrollbars-hidden가 선언된 공통 style 파일
 *
 * 역할:
 * - Widget의 실제 scroll 기능/overflow는 유지하고 시각적인 scrollbar만 숨긴다.
 * - 한 Widget의 설정이 아니라 document 전체에 적용되는 browser display preference다.
 *
 * Figma에서는 Scroll Container 구조와 별개인 Presentation Variant로 다룬다.
 * ============================================================
 */

export const SCROLLBAR_VISIBILITY_STORAGE_KEY =
  "glassday.ui.scrollbarsVisible.v1";

const SCROLLBARS_HIDDEN_CLASS = "glassday-scrollbars-hidden";

export const getSavedScrollbarVisibility = () => {
  if (typeof window === "undefined") return true;

  return window.localStorage.getItem(SCROLLBAR_VISIBILITY_STORAGE_KEY) !== "false";
};

export const applyScrollbarVisibility = (visible: boolean) => {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle(
    SCROLLBARS_HIDDEN_CLASS,
    !visible
  );
  document.body?.classList.toggle(SCROLLBARS_HIDDEN_CLASS, !visible);
};

export const saveScrollbarVisibility = (visible: boolean) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    SCROLLBAR_VISIBILITY_STORAGE_KEY,
    String(visible)
  );
  applyScrollbarVisibility(visible);
};
