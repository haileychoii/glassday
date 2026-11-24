/** Render the active workspace as mobile cards without changing widget data.
 * See docs/mobile-ui-map.md for the component, host, and stylesheet map.
 */

import type { DashboardTab } from "../../types/workspace";

import { widgetRegistry } from "../../constants/widgets";

import { WidgetSlot } from "../widgets/WidgetSlot";

import { MobileCalendarCard } from "./MobileCalendarCard";
import { MobileCareerCard } from "./MobileCareerCard";

export const MobileDashboard = ({
  activeTab,
}: {
  activeTab: DashboardTab;
}) => {
  return (
    <div className="mobile-dashboard">
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

          id === "calendar"
            ? "mobile-widget-slot--calendar"
            : "",

          id === "career"
            ? "mobile-widget-slot--career"
            : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={id}
            className={slotClassName}
            data-widget-id={id}
            role="region"
            aria-label={widgetRegistry[id]?.label ?? id}
          >
            {id === "calendar" ? (
              <MobileCalendarCard />
            ) : id === "career" ? (
              <MobileCareerCard />
            ) : (
              <WidgetSlot widgetId={id} />
            )}
          </div>
        );
      })}

      {activeTab.widgetIds.length === 0 && (
        <p className="mobile-empty">
          이 워크스페이스에는 아직 위젯이 없어.
        </p>
      )}
    </div>
  );
};
