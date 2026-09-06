/**
 * [Figma Mapping] Mobile / Single-column Workspace
 * Reads existing widgetIds only; never derives or writes Desktop grid layouts.
 * Styles: styles/mobile.css. Widget interiors remain unchanged in phase one.
 * 다음 단계: 위젯별 요약/상세 UX, Cloud Sync 충돌 및 DailyJournal 구독 검토.
 * TODO: address sync separately; this presentation layer must not change it.
 */
import type { DashboardTab } from "../../types/workspace";
import { widgetRegistry } from "../../constants/widgets";
import { WidgetSlot } from "../widgets/WidgetSlot";

export const MobileDashboard = ({ activeTab }: { activeTab: DashboardTab }) => (
  <div className="mobile-dashboard">
    {activeTab.widgetIds.map((id) => (
      <div key={id} className="mobile-widget-slot" data-widget-id={id}
        role="region" aria-label={widgetRegistry[id]?.label ?? id}>
        <WidgetSlot widgetId={id} />
      </div>
    ))}
    {activeTab.widgetIds.length === 0 && <p className="mobile-empty">No widgets in this workspace.</p>}
  </div>
);
