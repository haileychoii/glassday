/**
 * Windows desktop glass material for the transparent Tauri host window.
 * 투명한 Tauri 창의 바탕화면 영역은 CSS backdrop-filter가 흐릴 수 없으므로,
 * 이 모듈이 OS 수준 Acrylic/Blur를 적용한다. Web/Vercel 렌더링에는 영향이 없다.
 */
import { isTauri } from "@tauri-apps/api/core";
import { Effect, getCurrentWindow } from "@tauri-apps/api/window";

import type { ThemeId } from "../constants/themes";

const GLASS_THEMES: ReadonlySet<ThemeId> = new Set([
  "pastel",
  "glass-light",
  "glass-dark",
  "aurora",
]);

// KO: 빠른 테마 전환에서도 마지막 선택이 승리하도록 OS 호출을 순서대로 실행한다.
// EN: AppShell.tsx can request a new material before the previous native call ends.
let pendingEffect: Promise<void> = Promise.resolve();

/**
 * Match native blur/tint to the selected glass palette and remove it elsewhere.
 * 선택된 유리 테마와 OS 창 재질을 맞추고, 비유리 테마에서는 효과를 비운다.
 */
export const syncNativeGlassEffect = (theme: ThemeId): Promise<void> => {
  if (!isTauri()) return Promise.resolve();

  pendingEffect = pendingEffect.catch(() => undefined).then(async () => {
    const window = getCurrentWindow();

    if (!GLASS_THEMES.has(theme)) {
      await window.clearEffects();
      return;
    }

    const tint: [number, number, number, number] =
      theme === "glass-dark" || theme === "aurora"
        ? [24, 27, 36, 72]
        : theme === "pastel"
          ? [255, 230, 244, 56]
          : [236, 244, 255, 76];

    try {
      // KO: CSS backdrop-filter는 WebView 밖의 바탕화면을 흐릴 수 없다.
      // EN: Native Acrylic blurs the desktop; theme CSS controls the glass tint.
      await window.setEffects({ effects: [Effect.Acrylic], color: tint });
    } catch {
      // KO: Acrylic 미지원 환경에서는 Windows Blur를 시도한다.
      // EN: Keep the compatibility path, but expose failure for debugging.
      await window.setEffects({ effects: [Effect.Blur], color: tint });
    }
  }).catch((error: unknown) => {
    console.warn(`[Glassday] Native glass material failed for ${theme}`, error);
  });

  return pendingEffect;
};
