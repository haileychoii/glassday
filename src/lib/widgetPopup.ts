/**
 * KO: Money/Journal의 확장 버튼이 현재 대시보드와 분리된 창을 연다.
 *     Tauri는 별도 OS 창을 만들고, 웹은 브라우저 팝업을 사용한다.
 * EN: Open a detached detail window for Money or Journal. Tauri creates a
 *     native window; the web build uses a regular browser popup.
 */
import { isTauri } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export type PopoutWidgetId = "money" | "journal";

const openingLabels = new Set<string>();

const windowDetails: Record<PopoutWidgetId, { title: string; width: number; height: number }> = {
  money: { title: "Money", width: 860, height: 720 },
  journal: { title: "Daily Journal", width: 1040, height: 820 },
};

/** Open or focus the widget's single detached window; repeated clicks do not spawn duplicates. */
export const openWidgetPopup = async (widgetId: PopoutWidgetId): Promise<void> => {
  const details = windowDetails[widgetId];
  const url = new URL(window.location.href);
  url.searchParams.set("floatingWidget", widgetId);
  url.searchParams.delete("code");
  url.searchParams.delete("error");

  if (!isTauri()) {
    window.open(
      url.toString(),
      `glassday-${widgetId}-window`,
      `popup=yes,width=${details.width},height=${details.height},resizable=yes`
    );
    return;
  }

  const label = `floating-widget-${widgetId}`;
  if (openingLabels.has(label)) return;
  openingLabels.add(label);

  try {
    const existing = await WebviewWindow.getByLabel(label);
    if (existing) {
      await existing.show();
      await existing.setFocus();
      openingLabels.delete(label);
      return;
    }

    const popup = new WebviewWindow(label, {
      url: `${url.pathname}${url.search}${url.hash}`,
      title: details.title,
      width: details.width,
      height: details.height,
      minWidth: 520,
      minHeight: 420,
      center: true,
      resizable: true,
      decorations: true,
      transparent: false,
      alwaysOnTop: false,
      shadow: true,
      skipTaskbar: false,
    });

    // Keep the label reserved until Tauri confirms creation, so rapid repeated
    // clicks focus one window instead of racing to create duplicate labels.
    popup.once("tauri://created", () => openingLabels.delete(label));
    popup.once("tauri://error", (event) => {
      console.error(`[Glassday] Could not open ${widgetId} window`, event.payload);
      openingLabels.delete(label);
    });
  } catch (error) {
    console.error(`[Glassday] Could not open ${widgetId} window`, error);
    openingLabels.delete(label);
  }
};
