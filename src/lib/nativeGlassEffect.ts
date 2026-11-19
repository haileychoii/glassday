
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
import { Effect, getCurrentWindow } from "@tauri-apps/api/window";

import type { ThemeId } from "../constants/themes";


/* ============================================================
   01. GLASS THEME REGISTRY

   Native Acrylic을 사용하는 테마 목록.
   나머지 테마에서는 Native Blur를 제거한다.
   ============================================================ */

const GLASS_THEMES: ReadonlySet<ThemeId> = new Set([
  "pastel",
  "glass-light",
  "glass-dark",
  "aurora",
]);


/* ============================================================
   02. NATIVE EFFECT QUEUE

   빠르게 테마를 변경해도 이전 요청이
   마지막으로 선택한 테마를 덮어쓰지 않도록 한다.
   ============================================================ */

let pendingEffect: Promise<void> = Promise.resolve();


/* ============================================================
   03. NATIVE GLASS MATERIAL

   Windows 바탕화면에 실제 Acrylic 효과를 적용한다.
   Acrylic 적용에 실패하면 Blur를 시도한다.
   ============================================================ */

const applyNativeMaterial = async (
  theme: ThemeId
): Promise<void> => {
  const currentWindow = getCurrentWindow();

  // Mac Core / Pixel Desk / Pink Diary
  if (!GLASS_THEMES.has(theme)) {
    await currentWindow.clearEffects();
    return;
  }

  // 기존 테마별 Acrylic 색상 유지
  const tint: [number, number, number, number] =
    theme === "glass-dark" || theme === "aurora"
      ? [24, 27, 36, 72]
      : theme === "pastel"
        ? [255, 230, 244, 56]
        : [236, 244, 255, 76];

  try {
    await currentWindow.setEffects({
      effects: [Effect.Acrylic],
      color: tint,
    });
  } catch {
    // Acrylic 미지원 환경의 대체 효과
    await currentWindow.setEffects({
      effects: [Effect.Blur],
      color: tint,
    });
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
