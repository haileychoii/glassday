/**
 * ============================================================
 * GLASSDAY - TAURI WINDOW SHAPE BRIDGE
 * File: src/lib/nativeGlassEffect.ts
 * ============================================================
 *
 * Role / 역할
 * - Keeps the Tauri window silhouette synchronized with the selected theme.
 * - 테마에 맞춰 Windows 실제 창 모서리만 동기화한다.
 * - The visible glassmorphism belongs to the React/CSS theme files, not to
 *   the native window compositor.
 *
 * Connection / 연결
 * SettingsModal.tsx or theme state
 *   -> AppShell.tsx
 *   -> syncNativeGlassEffect()
 *   -> src-tauri/src/lib.rs::set_native_window_shape
 *
 * Important design decision / 중요한 설계 결정
 * - We intentionally do not apply Windows Acrylic/Blur here. Those native
 *   effects changed tint and opacity when the transparent window lost focus.
 * - 위젯 내부의 반투명 카드와 CSS blur는 그대로 유지하고, 창 전체는
 *   일반적인 안정형 Tauri 창으로 사용한다.
 */

import { invoke, isTauri } from "@tauri-apps/api/core";

import type { ThemeId } from "../constants/themes";


/* ============================================================
   THEME-SAFE WINDOW SHAPE

   src-tauri/src/lib.rs에서 실제 Windows 창 영역을 갱신한다.
   Pixel Desk만 사각형이고, 나머지 테마는 둥근 모서리를 사용한다.
   ============================================================ */

const applyNativeWindowShape = async (
  theme: ThemeId
): Promise<void> => {
  await invoke("set_native_window_shape", {
    square: theme === "pixel-desk",
  });
};


/* ============================================================
   THEME SYNCHRONIZATION

   AppShell.tsx가 앱 시작과 테마 변경 때 호출한다.
   화면의 색상/blur/카드 스타일은 각 theme CSS가 담당하고,
   이 파일은 native geometry만 담당한다.
   ============================================================ */

let pendingShapeUpdate: Promise<void> = Promise.resolve();

export const syncNativeGlassEffect = (
  theme: ThemeId
): Promise<void> => {
  // 일반 웹, Vercel, 모바일 웹에서는 Tauri command를 호출하지 않는다.
  if (!isTauri()) {
    return Promise.resolve();
  }

  // 테마를 빠르게 여러 번 바꿔도 마지막 모서리 상태가 적용되도록 순서화한다.
  pendingShapeUpdate = pendingShapeUpdate
    .catch(() => undefined)
    .then(async () => {
      try {
        await applyNativeWindowShape(theme);
      } catch (error) {
        console.warn(
          `[Glassday] Native window shape failed: ${theme}`,
          error
        );
      }
    });

  return pendingShapeUpdate;
};
