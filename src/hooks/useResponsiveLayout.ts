/**
 * [Layout Hook] Mobile Web breakpoint / App.tsx
 * Shares no persisted layout state: Wide/Laptop coordinates remain untouched.
 * Tauri always keeps its desktop shell. / 창 폭은 웹 표시 방식만 결정합니다.
 */
import { useSyncExternalStore } from "react";
import { isTauri } from "@tauri-apps/api/core";

const MOBILE_QUERY = "(width < 768px)";

/**
 * A phone browser can expose a desktop-sized layout viewport when the user
 * enables "Request desktop site" or when the browser is embedded in a narrow
 * webview. In that case width alone would incorrectly mount the desktop shell.
 *
 * 휴대폰 브라우저가 데스크톱 사이트 모드로 동작하면 CSS viewport가 768px
 * 이상으로 보고될 수 있다. Tauri는 이 판별에서 항상 제외하고, 일반 Web의
 * 모바일 user agent만 MobileLayout으로 보낸다.
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

const matchesMobileLayout = () =>
  window.matchMedia(MOBILE_QUERY).matches || isMobileBrowser();

const subscribe = (onChange: () => void) => {
  if (isTauri()) return () => {};
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onChange);
  window.addEventListener("resize", onChange, { passive: true });
  return () => {
    query.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
  };
};

const getSnapshot = () => !isTauri() && matchesMobileLayout();

export const useResponsiveLayout = () =>
  useSyncExternalStore(subscribe, getSnapshot, () => false);
