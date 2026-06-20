import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import GridLayout from "react-grid-layout";
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

import { defaultLayouts } from "./gridDefaults";
import { allWidgetIds, widgetRegistry } from "../../constants/widgets";
import type { DashboardTab, WidgetId } from "../../types/workspace";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

type DashboardGridProps = {
  editMode: boolean;
  activeTab: DashboardTab;
  onLayoutsChange: (layouts: Layouts) => void;
  onAddWidget: (widgetId: WidgetId) => void;
  onRemoveWidget: (widgetId: WidgetId) => void;
};

const widgetMap: Record<WidgetId, ReactNode> = {
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

const getDefaultLayoutForWidget = (widgetId: WidgetId, index: number): Layout => {
  const defaultItem =
    defaultLayouts.lg?.find((item) => item.i === widgetId) ??
    defaultLayouts.md?.find((item) => item.i === widgetId) ??
    defaultLayouts.sm?.find((item) => item.i === widgetId);

  if (defaultItem) {
    return { ...defaultItem };
  }

  return {
    i: widgetId,
    x: (index * 3) % 12,
    y: Infinity,
    w: 4,
    h: 5,
  };
};

const ensureLayoutForWidgets = (
  layout: Layout[] | undefined,
  widgetIds: WidgetId[]
): Layout[] => {
  const safeLayout = Array.isArray(layout) ? layout : [];
  const existingIds = new Set(safeLayout.map((item) => item.i));

  const filteredLayout = safeLayout.filter((item) =>
    widgetIds.includes(item.i as WidgetId)
  );

  const missingLayout = widgetIds
    .filter((widgetId) => !existingIds.has(widgetId))
    .map((widgetId, index) => getDefaultLayoutForWidget(widgetId, index));

  return [...filteredLayout, ...missingLayout];
};

export const DashboardGrid = ({
  editMode,
  activeTab,
  onLayoutsChange,
  onAddWidget,
  onRemoveWidget,
}: DashboardGridProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const updateWidth = () => {
      if (!wrapperRef.current) return;
      setWidth(Math.max(320, wrapperRef.current.offsetWidth));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(wrapperRef.current);

    window.addEventListener("resize", updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const activeWidgetIds = useMemo(() => {
    return Array.isArray(activeTab.widgetIds) ? activeTab.widgetIds : [];
  }, [activeTab.widgetIds]);

  const layout = useMemo(() => {
    return ensureLayoutForWidgets(activeTab.layouts?.lg, activeWidgetIds);
  }, [activeTab.layouts, activeWidgetIds]);

  const hiddenWidgetIds = useMemo(() => {
    return allWidgetIds.filter((widgetId) => !activeWidgetIds.includes(widgetId));
  }, [activeWidgetIds]);

  const handleLayoutChange = (nextLayout: Layout[]) => {
    onLayoutsChange({
      ...activeTab.layouts,
      lg: nextLayout,
    });
  };

  return (
    <div ref={wrapperRef} className="dashboard-tab-space">
      <div className="dashboard-tab-header">
        <div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-[0.18em]">
            Workspace
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            {activeTab.icon} {activeTab.label}
          </h2>
        </div>

        {editMode && (
          <div className="text-xs font-bold text-muted-foreground">
            Drag widgets · Resize from corner
          </div>
        )}
      </div>

      {editMode && hiddenWidgetIds.length > 0 && (
        <div className="widget-picker-panel">
          <div className="text-xs font-bold text-muted-foreground">
            Add widgets
          </div>

          <div className="flex flex-wrap gap-2">
            {hiddenWidgetIds.map((widgetId) => {
              const widget = widgetRegistry[widgetId];

              return (
                <button
                  key={widgetId}
                  type="button"
                  onClick={() => onAddWidget(widgetId)}
                  className="widget-picker-button"
                >
                  <strong>{widget.label}</strong>
                  <span>{widget.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={76}
        width={width}
        margin={[18, 18]}
        containerPadding={[0, 0]}
        isDraggable={editMode}
        isResizable={editMode}
        draggableCancel="button, input, textarea, select, [contenteditable='true'], .memo-editor, .floating-window"
        onLayoutChange={handleLayoutChange}
      >
        {activeWidgetIds.map((widgetId) => (
          <div key={widgetId} className="dashboard-grid-item">
            {editMode && (
              <button
                type="button"
                onClick={() => onRemoveWidget(widgetId)}
                className="widget-remove-button"
                title="Remove widget"
              >
                ×
              </button>
            )}

            {widgetMap[widgetId]}
          </div>
        ))}
      </GridLayout>
    </div>
  );
};