/**
 * [Layout Hook] Mobile Web breakpoint / App.tsx
 * Shares no persisted layout state: Wide/Laptop coordinates remain untouched.
 * Tauri always keeps its desktop shell. / 창 폭은 웹 표시 방식만 결정합니다.
 */
import { useSyncExternalStore } from "react";
import { isTauri } from "@tauri-apps/api/core";

const MOBILE_WIDTH_QUERY = "(width < 768px)";
const PORTRAIT_QUERY = "(orientation: portrait)";

/**
 * Mobile Web gets the dedicated phone layout only while the viewport is
 * portrait. Rotating a phone or tablet to landscape switches to AppShell so
 * the production URL follows the same horizontal dashboard as Laptop/Wide.
 * The mobile browser check still handles "Request desktop site", where the
 * portrait layout viewport can report a width above the normal phone breakpoint.
 *
 * 모바일 웹은 세로 방향에서만 전용 MobileLayout을 사용한다. 기기를 가로로
 * 돌리면 production URL에서도 AppShell의 가로형 Dashboard를 적용해 Tauri와
 * Laptop/Wide 화면 흐름을 따른다. 데스크톱 사이트 모드의 넓은 viewport는
 * 모바일 user agent로 보완 판별하되, 가로 방향이면 AppShell을 우선한다.
 */
const isMobileBrowser = () => {
  if (typeof navigator === "undefined") return false;

  const userAgentData = navigator as Navigator & {
    userAgentData?: { mobile?: boolean };
  };

  return Boolean(
    userAgentData.userAgentData?.mobile ||
      /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(navigator.userAgent),
  );
};

const matchesMobileLayout = () => {
  const isPortrait = window.matchMedia(PORTRAIT_QUERY).matches;

  return (
    isPortrait &&
    (window.matchMedia(MOBILE_WIDTH_QUERY).matches || isMobileBrowser())
  );
};

const subscribe = (onChange: () => void) => {
  if (isTauri()) return () => {};
  const widthQuery = window.matchMedia(MOBILE_WIDTH_QUERY);
  const orientationQuery = window.matchMedia(PORTRAIT_QUERY);
  widthQuery.addEventListener("change", onChange);
  orientationQuery.addEventListener("change", onChange);
  window.addEventListener("resize", onChange, { passive: true });
  window.addEventListener("orientationchange", onChange, { passive: true });
  return () => {
    widthQuery.removeEventListener("change", onChange);
    orientationQuery.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
    window.removeEventListener("orientationchange", onChange);
  };
};

const getSnapshot = () => !isTauri() && matchesMobileLayout();

export const useResponsiveLayout = () =>
  useSyncExternalStore(subscribe, getSnapshot, () => false);
