/**
 * KO: 분리된 Money/Journal 창의 도구줄과 위젯 슬롯을 렌더링한다.
 *     실제 Money·Journal 데이터 편집은 기존 WidgetRenderer의 컴포넌트가 맡는다.
 * EN: Render the detached window toolbar and slot. Existing Money/Journal
 *     components remain the sole owners of their widget data and editing UI.
 */
import { useEffect, useState } from "react";
import { Pin } from "lucide-react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

import type { PopoutWidgetId } from "../../lib/widgetPopup";
import { WidgetSlot } from "./WidgetSlot";

const labels: Record<PopoutWidgetId, string> = {
  money: "Money",
  journal: "Daily Journal",
};

export const DetachedWidgetWindow = ({ widgetId }: { widgetId: PopoutWidgetId }) => {
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (!isTauri()) return;
    void getCurrentWindow().isAlwaysOnTop().then(setPinned).catch(console.error);
  }, []);

  const togglePinned = async () => {
    if (!isTauri()) return;
    const next = !pinned;
    await getCurrentWindow().setAlwaysOnTop(next);
    setPinned(next);
  };

  return (
    <main className="detached-widget-window">
      <header className="detached-widget-window__toolbar">
        <strong>{labels[widgetId]}</strong>
        {isTauri() ? (
          <button
            type="button"
            className={pinned ? "is-pinned" : ""}
            onClick={() => void togglePinned()}
            aria-pressed={pinned}
            title={pinned ? "Unpin this widget" : "Keep this widget on top"}
          >
            <Pin aria-hidden="true" />
            {pinned ? "고정 해제" : "항상 위에 고정"}
          </button>
        ) : (
          <span>항상 위 고정은 설치 앱에서 사용할 수 있어요</span>
        )}
      </header>
      <div className={`detached-widget-window__content detached-widget-window__content--${widgetId}`}>
        <WidgetSlot widgetId={widgetId} />
      </div>
    </main>
  );
};
