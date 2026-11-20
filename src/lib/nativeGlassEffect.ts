
/**
 * ============================================================
 * GLASSDAY — NATIVE GLASS EFFECT
 * 파일: src/lib/nativeGlassEffect.ts
 * ============================================================
 *
 * [역할]
 * - Windows Native Acrylic 및 Blur 효과
 * - 테마별 실제 Window 모서리 동기화
 * - 연속적인 테마 변경 요청 관리
 *
 * [연결 구조]
 * SettingsModal.tsx
 *   → Theme Change Event
 *   → AppShell.tsx
 *   → nativeGlassEffect.ts
 *   → src-tauri/src/lib.rs
 *
 * 관련 CSS: desktop-window.css
 *
 * ============================================================
 */

import { invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

import type { ThemeId } from "../constants/themes";


/* ============================================================
   01. GLASS THEME REGISTRY

   CSS glass fallback을 사용하는 테마 목록.
   Tauri native backdrop은 현재 기본적으로 비활성화한다.
   ============================================================ */

const GLASS_THEMES: ReadonlySet<ThemeId> = new Set([
  "pastel",
  "glass-light",
  "glass-dark",
  "aurora",
]);


/* ============================================================
   01-B. NATIVE BACKDROP FEATURE FLAG

   현재 Windows Tauri transparent window에서는 native Blur/Acrylic이
   포커스를 잃을 때 불투명한 검정/회색 레이어로 바뀌는 문제가 있다.
   그래서 지금의 제품 동작은 CSS glass fallback을 기본값으로 삼는다.

   / EN: Keep this flag explicit so a future WinUI/Win32 shell can re-enable
   the native backdrop after the inactive-window behavior is verified there.
   ============================================================ */

const USE_NATIVE_DESKTOP_BACKDROP = true;


/* ============================================================
   02. NATIVE EFFECT QUEUE

   빠르게 테마를 변경해도 이전 요청이
   마지막으로 선택한 테마를 덮어쓰지 않도록 한다.
   ============================================================ */

let pendingEffect: Promise<void> = Promise.resolve();


/* ============================================================
   03. NATIVE GLASS MATERIAL

   Windows 바탕화면에 실제 glass material을 적용한다.

   Tauri의 기본 WindowEffect 대신 src-tauri/src/lib.rs의 Windows
   composition command를 호출한다. 이 경로는 WebView의 CSS 레이어와
   분리되어 있어 포커스 변경 때 native tint가 임의로 덧씌워지는 문제를
   줄인다.

   Blur를 먼저 선택하는 이유:
   - Windows Acrylic은 창이 포커스를 잃을 때 tint가 진해지거나
     불투명한 사각형처럼 보이는 경우가 있다.
   - Blur는 비활성 상태에서도 상대적으로 일관된 투명도를 유지한다.
   - Blur를 지원하지 않는 환경만 Acrylic으로 보완한다.

   / EN: Blur is intentionally preferred over Acrylic because Acrylic can
   become heavily tinted when a transparent Tauri window loses focus.
   ============================================================ */

const applyNativeMaterial = async (
  theme: ThemeId
): Promise<void> => {
  const currentWindow = getCurrentWindow();

  // 일반 테마에서는 native 효과를 확실히 제거한다.
  // 이 호출이 있어야 이전 실행에서 남은 Acrylic/Blur가 다음 테마에 남지 않는다.
  if (!USE_NATIVE_DESKTOP_BACKDROP || !GLASS_THEMES.has(theme)) {
    await currentWindow.clearEffects();
    return;
  }

  try {
    // Rust의 Windows composition layer가 실제 바탕화면 blur를 담당한다.
    await invoke("set_native_window_blur", {
      enabled: true,
      dark: theme === "glass-dark" || theme === "aurora",
    });
  } catch {
    // native blur가 지원되지 않아도 CSS glass 화면은 계속 사용할 수 있다.
    await currentWindow.clearEffects();
  }
};


/* ============================================================
   04. NATIVE WINDOW SHAPE

   연결: src-tauri/src/lib.rs

   Windows 실제 창의 경계와 CSS 외곽선을 일치시킨다.

   - Pixel Desk: 0px
   - 나머지 테마: 10px
   ============================================================ */

const applyNativeWindowShape = async (
  theme: ThemeId
): Promise<void> => {
  await invoke("set_native_window_shape", {
    square: theme === "pixel-desk",
  });
};


/* ============================================================
   05. THEME SYNCHRONIZATION

   AppShell.tsx에서 앱 시작 및 테마 변경 시 호출한다.

   Glass 효과가 실패하더라도 창 모서리 변경은 수행한다.
   ============================================================ */

export const syncNativeGlassEffect = (
  theme: ThemeId
): Promise<void> => {

  // 일반 웹, Vercel 및 모바일 웹에서는 실행하지 않는다.
  if (!isTauri()) {
    return Promise.resolve();
  }

  pendingEffect = pendingEffect
    .catch(() => undefined)
    .then(async () => {

      try {
        await applyNativeMaterial(theme);
      } catch (error) {
        console.warn(
          `[Glassday] Native glass material failed: ${theme}`,
          error
        );
      }

      try {
        await applyNativeWindowShape(theme);
      } catch (error) {
        console.warn(
          `[Glassday] Native window shape failed: ${theme}`,
          error
        );
      }
    });

  return pendingEffect;
};
