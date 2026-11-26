/** Render the active workspace as mobile cards without changing widget data.
 * See docs/mobile-ui-map.md for the component, host, and stylesheet map.
 */

import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { GripHorizontal, RotateCcw } from "lucide-react";
import type { DashboardTab, WidgetId } from "../../types/workspace";

import { widgetRegistry } from "../../constants/widgets";

import { WidgetSlot } from "../widgets/WidgetSlot";

import { MobileCalendarCard } from "./MobileCalendarCard";
import { MobileCareerCard } from "./MobileCareerCard";

export const MobileDashboard = ({
  activeTab,
  editMode,
  onSetWidgetHeight,
  onAddWidget,
}: {
  activeTab: DashboardTab;
  editMode: boolean;
  onSetWidgetHeight: (widgetId: string, height: number | null) => void;
  onAddWidget: (widgetId: WidgetId) => void;
}) => {
  // A mobile size edit is only the card height. The card keeps its phone width,
  // and the desktop Wide/Laptop layouts remain completely untouched.
  const [previewHeight, setPreviewHeight] = useState<{
    widgetId: string;
    height: number;
  } | null>(null);
  const resizeGesture = useRef<{
    widgetId: string;
    pointerId: number;
    startY: number;
    startHeight: number;
  } | null>(null);

  const clampHeight = (height: number) =>
    Math.max(160, Math.min(1200, Math.floor(window.innerHeight * 0.82), height));

  // The catalog is shared with desktop. Hide widgets already on this tab so a
  // tap can only add something new and never creates a duplicate card.
  const availableWidgetIds = (Object.keys(widgetRegistry) as WidgetId[]).filter(
    (widgetId) => !activeTab.widgetIds.includes(widgetId)
  );

  const beginResize = (widgetId: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    const slot = event.currentTarget.closest<HTMLElement>(".mobile-widget-slot");
    if (!slot) return;

    event.preventDefault();
    event.stopPropagation();
    const startHeight = clampHeight(
      activeTab.mobileWidgetHeights?.[widgetId] ?? slot.getBoundingClientRect().height
    );
    resizeGesture.current = {
      widgetId,
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setPreviewHeight({ widgetId, height: startHeight });
  };

  const continueResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const gesture = resizeGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const height = clampHeight(
      gesture.startHeight + event.clientY - gesture.startY
    );
    setPreviewHeight({ widgetId: gesture.widgetId, height });
  };

  const finishResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const gesture = resizeGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const height = clampHeight(
      gesture.startHeight + event.clientY - gesture.startY
    );
    onSetWidgetHeight(gesture.widgetId, height);
    resizeGesture.current = null;
    setPreviewHeight(null);
  };

  return (
    <div className="mobile-dashboard">
      {editMode && availableWidgetIds.length > 0 && (
        <section className="mobile-widget-picker" aria-label="위젯 추가">
          <h2>위젯 추가</h2>
          <p>원하는 위젯을 선택하면 이 화면에 추가돼요.</p>
          <div className="mobile-widget-picker-list">
            {availableWidgetIds.map((widgetId) => {
              const widget = widgetRegistry[widgetId];
              return (
                <button
                  key={widgetId}
                  type="button"
                  className="mobile-widget-picker-option"
                  onClick={() => onAddWidget(widgetId)}
                >
                  <strong>{widget.label}</strong>
                  <span>{widget.description}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
      {/*
       * 현재 워크스페이스에 등록된 위젯을
       * 순서대로 렌더링합니다.
       *
       * widgetIds의 순서가 모바일 화면의
       * 위젯 표시 순서가 됩니다.
       */}
      {activeTab.widgetIds.map((id) => {
        /*
         * Special cards need a slot class for their card-specific rules.
         * Shared frame geometry stays in mobile-common.css.
         */
        const slotClassName = [
          "mobile-widget-slot",
          activeTab.mobileWidgetHeights?.[id] || previewHeight?.widgetId === id
            ? "has-mobile-widget-height"
            : "",

          id === "calendar"
            ? "mobile-widget-slot--calendar"
            : "",

          id === "career"
            ? "mobile-widget-slot--career"
            : "",
        ]
          .filter(Boolean)
          .join(" ");
        const widgetLabel = widgetRegistry[id]?.label ?? id;
        const widgetHeight = previewHeight?.widgetId === id
          ? previewHeight.height
          : activeTab.mobileWidgetHeights?.[id];
        const widgetStyle = widgetHeight
          ? ({ "--mobile-widget-height": `${widgetHeight}px` } as CSSProperties)
          : undefined;

        return (
          <div
            key={id}
            className={slotClassName}
            data-widget-id={id}
            role="region"
            aria-label={widgetLabel}
            style={widgetStyle}
          >
            {id === "calendar" ? (
              <MobileCalendarCard />
            ) : id === "career" ? (
              <MobileCareerCard />
            ) : (
              <WidgetSlot widgetId={id} attachToParent />
            )}
            {editMode && (
              <div
                className="mobile-widget-size-controls"
                role="group"
                aria-label={`${widgetLabel} size controls`}
              >
                <button
                  type="button"
                  className="mobile-widget-size-handle"
                  aria-label={`Resize ${widgetLabel}; drag vertically, or use arrow keys`}
                  aria-keyshortcuts="ArrowUp ArrowDown"
                  title="Drag to change widget height. Use arrow keys to resize."
                  onPointerDown={(event) => beginResize(id, event)}
                  onPointerMove={continueResize}
                  onPointerUp={finishResize}
                  onPointerCancel={finishResize}
                  onKeyDown={(event) => {
                    if (event.key === "Delete" || event.key === "Backspace") {
                      event.preventDefault();
                      onSetWidgetHeight(id, null);
                      return;
                    }
                    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                    event.preventDefault();
                    const slot = event.currentTarget.closest<HTMLElement>(".mobile-widget-slot");
                    const currentHeight =
                      previewHeight?.widgetId === id
                        ? previewHeight.height
                        : activeTab.mobileWidgetHeights?.[id] ?? slot?.getBoundingClientRect().height ?? 320;
                    onSetWidgetHeight(
                      id,
                      clampHeight(
                        currentHeight + (event.key === "ArrowUp" ? 24 : -24)
                      )
                    );
                  }}
                >
                  <GripHorizontal size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="mobile-widget-size-reset"
                  aria-label={`Reset ${widgetLabel} height`}
                  title="Reset widget height"
                  onClick={() => onSetWidgetHeight(id, null)}
                >
                  <RotateCcw size={15} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      {activeTab.widgetIds.length === 0 && !editMode && (
        <p className="mobile-empty">
          위젯을 추가하려면 위쪽의 편집 버튼을 눌러 주세요.
        </p>
      )}
    </div>
  );
};
