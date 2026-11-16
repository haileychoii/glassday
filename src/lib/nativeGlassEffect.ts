/**
 * Windows desktop glass material for the transparent Tauri host window.
 * 투명한 Tauri 창의 바탕화면 영역은 CSS backdrop-filter가 흐릴 수 없으므로,
 * 이 모듈이 OS 수준 Acrylic/Blur를 적용한다. Web/Vercel 렌더링에는 영향이 없다.
 */
import { isTauri } from "@tauri-apps/api/core";
import { Effect, getCurrentWindow } from "@tauri-apps/api/window";

import type { ThemeId } from "../constants/themes";

const GLASS_THEMES: ReadonlySet<ThemeId> = new Set([
  "glass-light",
  "glass-dark",
  "aurora",
]);

/**
 * Match native blur/tint to the selected glass palette and remove it elsewhere.
 * 선택된 유리 테마와 OS 창 재질을 맞추고, 비유리 테마에서는 효과를 비운다.
 */
export const syncNativeGlassEffect = async (theme: ThemeId): Promise<void> => {
  if (!isTauri()) return;

  const window = getCurrentWindow();

  if (!GLASS_THEMES.has(theme)) {
    await window.clearEffects().catch(() => undefined);
    return;
  }

  const isDark = theme === "glass-dark" || theme === "aurora";
  const tint: [number, number, number, number] = isDark
    ? [24, 27, 36, 84]
    : [236, 244, 255, 76];

  try {
    // Acrylic samples and blurs pixels behind the native window on Windows.
    // Acrylic은 Windows 네이티브 창 뒤의 실제 바탕화면을 샘플링해 흐린다.
    await window.setEffects({ effects: [Effect.Acrylic], color: tint });
  } catch {
    // Older Windows builds may lack Acrylic; Blur is the compatibility fallback.
    // 구형 Windows에서 Acrylic을 지원하지 않으면 호환 Blur로 대체한다.
    await window.setEffects({ effects: [Effect.Blur], color: tint }).catch(() => undefined);
  }
};
