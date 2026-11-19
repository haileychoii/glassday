
/**
 * ============================================================
 * GLASSDAY — NATIVE GLASS EFFECT
 * 파일: src/lib/nativeGlassEffect.ts
 * ============================================================
 *
 * [역할]
 * - Windows Native Acrylic 효과
 * - Windows Blur fallback
 * - 테마별 실제 Window 모서리 동기화
 *
 * [연결 구조]
 *
 * SettingsModal.tsx
 *  → Theme Change Event
 *  → AppShell.tsx
 *  → nativeGlassEffect.ts
 *  → src-tauri/src/lib.rs
 *
 * 일반 Web / Vercel / Mobile에서는 실행하지 않는다.
 * ============================================================
 */

import {
  invoke,
  isTauri,
} from "@tauri-apps/api/core";

import {
  Effect,
  getCurrentWindow,
} from "@tauri-apps/api/window";

import type {
  ThemeId,
} from "../constants/themes";


/* ============================================================
   01. GLASS THEME REGISTRY

   Native Acrylic 효과를 적용하는 테마.
   다른 테마에서는 Native Blur를 제거한다.
============================================================ */

const GLASS_THEMES: ReadonlySet<ThemeId> = new Set([
  "pastel",
  "glass-light",
  "glass-dark",
  "aurora",
]);


/* ============================================================
   02. NATIVE EFFECT QUEUE

   테마를 빠르게 연속 변경하더라도
   마지막으로 선택한 테마가 최종 적용되도록 한다.
============================================================ */

let pendingEffect: Promise<void> =
  Promise.resolve();


/* ============================================================
   03. APPLY WINDOWS MATERIAL

   기존 Glassday의 테마별 Acrylic 색상을 유지한다.

   Acrylic 지원이 불가능한 경우 Blur를 시도한다.
============================================================ */

const applyNativeMaterial = async (
  theme: ThemeId
): Promise<void> => {

  const currentWindow = getCurrentWindow();

  // Mac Core / Pixel Desk / Retro 등
  if (!GLASS_THEMES.has(theme)) {

    await currentWindow.clearEffects();

    return;
  }


  // 기존 테마별 Native Glass 색상 유지
  const tint: [
    number,
    number,
    number,
    number
  ] =

    theme === "glass-dark" ||
    theme === "aurora"

      ? [24, 27, 36, 72]

      : theme === "pastel"

        ? [255, 230, 244, 56]

        : [236, 244, 255, 76];


  try {

    await currentWindow.setEffects({

      effects: [
        Effect.Acrylic,
      ],

      color: tint,

    });

  } catch {

    // Acrylic 미지원 환경의 대체 효과
    await currentWindow.setEffects({

      effects: [
        Effect.Blur,
      ],

      color: tint,

    });
  }
};


/* ============================================================
   04. APPLY NATIVE WINDOW SHAPE

   연결: src-tauri/src/lib.rs

   실제 Windows 창 경계와 CSS의 모서리를 일치시킨다.

   Pixel Desk: 직각
   다른 테마: 둥근 사각형
============================================================ */

const applyNativeWindowShape = async (
  theme: ThemeId
): Promise<void> => {

  await invoke(
    "set_native_window_shape",
    {
      square: theme === "pixel-desk",
    }
  );
};


/* ============================================================
   05. MAIN THEME SYNCHRONIZATION

   AppShell.tsx에서 호출하는 Public API.

   1. Native Acrylic / Blur 적용
   2. Native Window 외곽선 적용

   두 작업을 분리하여 Glass 적용에 실패하더라도
   창 모서리 변경은 계속 수행한다.
============================================================ */

export const syncNativeGlassEffect = (
  theme: ThemeId
): Promise<void> => {

  // 일반 웹 및 모바일 웹에서는 실행하지 않는다.
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
