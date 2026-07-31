/* =========================================================
   UI PREFERENCES
   Browser-only display preferences that should persist with the rest of
   Glassday's local snapshot, but do not belong to a single widget.
========================================================= */

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
