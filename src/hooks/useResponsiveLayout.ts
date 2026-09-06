/**
 * [Layout Hook] Mobile Web breakpoint / App.tsx
 * Shares no persisted layout state: Wide/Laptop coordinates remain untouched.
 * Tauri always keeps its desktop shell. / 창 폭은 웹 표시 방식만 결정합니다.
 */
import { useSyncExternalStore } from "react";
import { isTauri } from "@tauri-apps/api/core";

const MOBILE_QUERY = "(width < 768px)";

const subscribe = (onChange: () => void) => {
  if (isTauri()) return () => {};
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const getSnapshot = () => !isTauri() && window.matchMedia(MOBILE_QUERY).matches;

export const useResponsiveLayout = () =>
  useSyncExternalStore(subscribe, getSnapshot, () => false);
