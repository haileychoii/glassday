/**
 * ============================================================
 * [UI Preference] Display Preferences
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
 * 하단 모바일 탭 글자 표시 설정도 같은 Display 탭에서 보관/적용한다.
 * ============================================================
 */

export const SCROLLBAR_VISIBILITY_STORAGE_KEY =
  "glassday.ui.scrollbarsVisible.v1";

/** Whether mobile workspace names are shown below their icons. Defaults to icons only. */
export const MOBILE_TAB_LABELS_VISIBILITY_STORAGE_KEY =
  "glassday.ui.mobileTabLabelsVisible.v1";

const SCROLLBARS_HIDDEN_CLASS = "glassday-scrollbars-hidden";
const MOBILE_TAB_LABELS_VISIBLE_CLASS = "glassday-mobile-tab-labels-visible";

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

export const getSavedMobileTabLabelsVisibility = () => {
  if (typeof window === "undefined") return false;

  return window.localStorage.getItem(
    MOBILE_TAB_LABELS_VISIBILITY_STORAGE_KEY
  ) === "true";
};

export const applyMobileTabLabelsVisibility = (visible: boolean) => {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle(
    MOBILE_TAB_LABELS_VISIBLE_CLASS,
    visible
  );
  document.body?.classList.toggle(MOBILE_TAB_LABELS_VISIBLE_CLASS, visible);
};

export const saveMobileTabLabelsVisibility = (visible: boolean) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    MOBILE_TAB_LABELS_VISIBILITY_STORAGE_KEY,
    String(visible)
  );
  applyMobileTabLabelsVisibility(visible);
};
