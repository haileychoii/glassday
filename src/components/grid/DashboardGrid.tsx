import ReactGridLayout from "react-grid-layout";
import type { Layout, Layouts } from "react-grid-layout";

import { TodayFocusWidget } from "../widgets/TodayFocusWidget";
import { AlertCenterWidget } from "../widgets/AlertCenterWidget";
import { DailyJournalWidget } from "../widgets/DailyJournalWidget";
import { CalendarWidget } from "../widgets/CalendarWidget";
import { MemoWidget } from "../widgets/MemoWidget";
import { StudyWidget } from "../widgets/StudyWidget";
import { CareerWidget } from "../widgets/CareerWidget";
import { HealthWidget } from "../widgets/HealthWidget";
import { MoneyWidget } from "../widgets/MoneyWidget";
import { MoodWidget } from "../widgets/MoodWidget";
import { AlertCenterWidget } from "../widgets/AlertCenterWidget";
import { defaultLayouts } from "./gridDefaults";
import { allWidgetIds, widgetRegistry } from "../../constants/widgets";
import type { DashboardTab, WidgetId } from "../../types/workspace";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const RGL = ReactGridLayout as unknown as {
  Responsive: React.ComponentType<any>;
  WidthProvider: (
    component: React.ComponentType<any>
  ) => React.ComponentType<any>;
};

const ResponsiveGridLayout = RGL.WidthProvider(RGL.Responsive);

type DashboardGridProps = {
  editMode: boolean;
  activeTab: DashboardTab;
  onLayoutsChange: (layouts: Layouts) => void;
  onAddWidget: (widgetId: WidgetId) => void;
  onRemoveWidget: (widgetId: WidgetId) => void;
};

const widgetMap: Record<WidgetId, JSX.Element> = {
  today: <TodayFocusWidget />,
  alerts: <AlertCenterWidget />,
  journal: <DailyJournalWidget />,
  calendar: <CalendarWidget />,
  memo: <MemoWidget />,
  study: <StudyWidget />,
  career: <CareerWidget />,
  health: <HealthWidget />,
  money: <MoneyWidget />,
  mood: <MoodWidget />,
};

const createFallbackLayout = (widgetId: WidgetId, index: number): Layout => {
  return {
    i: widgetId,
    x: (index * 3) % 12,
    y: Math.floor(index / 4) * 4,
    w: 3,
    h: 4,
  };
};

const ensureLayoutsForWidgets = (
  layouts: Layouts,
  widgetIds: WidgetId[]
): Layouts => {
  const breakpoints = ["lg", "md", "sm"] as const;

  return Object.fromEntries(
    breakpoints.map((breakpoint) => {
      const currentLayouts = layouts?.[breakpoint] ?? [];
      const defaultBreakpointLayouts = defaultLayouts?.[breakpoint] ?? [];

      const nextLayouts = widgetIds.map((widgetId, index) => {
        return (
          currentLayouts.find((item) => item.i === widgetId) ??
          defaultBreakpointLayouts.find((item) => item.i === widgetId) ??
          createFallbackLayout(widgetId, index)
        );
      });

      return [breakpoint, nextLayouts];
    })
  ) as Layouts;
};

export const DashboardGrid = ({
  editMode,
  activeTab,
  onLayoutsChange,
  onAddWidget,
  onRemoveWidget,
}: DashboardGridProps) => {
  const layouts = ensureLayoutsForWidgets(activeTab.layouts, activeTab.widgetIds);

  const hiddenWidgets = allWidgetIds.filter(
    (widgetId) => !activeTab.widgetIds.includes(widgetId)
  );

  return (
    <div className="dashboard-tab-space">
      <div className="dashboard-tab-header">
        <div>
          <div className="text-xs text-muted-foreground">Current Workspace</div>
          <h2 className="text-xl font-semibold">
            {activeTab.icon} {activeTab.label}
          </h2>
        </div>

        {editMode && (
          <div className="widget-picker-panel">
            {hiddenWidgets.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                All widgets are already here.
              </span>
            ) : (
              hiddenWidgets.map((widgetId) => (
                <button
                  key={widgetId}
                  type="button"
                  onClick={() => onAddWidget(widgetId)}
                  className="widget-picker-button"
                >
                  + {widgetRegistry[widgetId].label}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <ResponsiveGridLayout
        className="layout dashboard-grid-board"
        layouts={layouts}
        breakpoints={{
          lg: 1200,
          md: 768,
          sm: 0,
        }}
        cols={{
          lg: 12,
          md: 12,
          sm: 4,
        }}
        rowHeight={76}
        margin={[18, 18]}
        containerPadding={[0, 0]}
        isDraggable={editMode}
        isResizable={editMode}
        compactType="vertical"
        preventCollision={false}
        onLayoutChange={(_, allLayouts) => {
          onLayoutsChange(allLayouts);
        }}
      >
        {activeTab.widgetIds.map((widgetId) => (
          <div key={widgetId} className="dashboard-grid-item">
            {editMode && (
              <button
                type="button"
                onClick={() => onRemoveWidget(widgetId)}
                className="widget-remove-button"
              >
                Remove
              </button>
            )}

            {widgetMap[widgetId]}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};