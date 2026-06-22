import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Responsive } from "react-grid-layout";
import type { GridLayoutItem, Layouts, WidgetId } from "../../types/workspace";

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

type Breakpoint = "lg" | "md" | "sm";

type DashboardGridProps = {
  editMode: boolean;
  activeTab: DashboardTab;
  onLayoutsChange: (layouts: Layouts) => void;
  onAddWidget: (widgetId: WidgetId) => void;
  onRemoveWidget: (widgetId: WidgetId) => void;
  onEditValidationChange?: (state: {
    hasCollision: boolean;
    collidingWidgetIds: WidgetId[];
  }) => void;
};

const BREAKPOINTS: Record<Breakpoint, number> = {
  lg: 1200,
  md: 900,
  sm: 0,
};

const GRID_COLS: Record<Breakpoint, number> = {
  lg: 16,
  md: 16,
  sm: 16,
};

const ROW_HEIGHT = 52;

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

const normalizeLayoutItem = (item: Layout): Layout => {
  const safeWidth = Math.max(2, Math.min(item.w || 4, 16));
  const safeX = Math.max(0, Math.min(item.x || 0, 16 - safeWidth));

  return {
    ...item,
    x: safeX,
    y: Math.max(0, item.y || 0),
    w: safeWidth,
    h: Math.max(3, item.h || 5),
  };
};

const getDefaultLayoutForWidget = (
  widgetId: WidgetId,
  breakpoint: Breakpoint,
  index: number
): Layout => {
  const defaultItem =
    defaultLayouts[breakpoint]?.find((item) => item.i === widgetId) ??
    defaultLayouts.lg?.find((item) => item.i === widgetId);

  if (defaultItem) {
    return normalizeLayoutItem(defaultItem);
  }

  return {
    i: widgetId,
    x: breakpoint === "sm" ? 0 : (index * 4) % 16,
    y: Infinity,
    w: breakpoint === "sm" ? 16 : 8,
    h: 8,
  };
};

const ensureLayoutForWidgets = (
  layout: GridLayoutItem[] | undefined,
  widgetIds: WidgetId[],
  breakpoint: Breakpoint
): Layout[] => {
  const safeLayout = Array.isArray(layout) ? layout : [];
  const existingIds = new Set(safeLayout.map((item) => item.i));

  const filteredLayout = safeLayout
    .filter((item) => widgetIds.includes(item.i as WidgetId))
    .map(normalizeLayoutItem);

  const missingLayout = widgetIds
    .filter((widgetId) => !existingIds.has(widgetId))
    .map((widgetId, index) =>
      getDefaultLayoutForWidget(widgetId, breakpoint, index)
    );

  return [...filteredLayout, ...missingLayout];
};

const ensureResponsiveLayouts = (
  layouts: Layouts | undefined,
  widgetIds: WidgetId[]
): Layouts => {
  return {
    lg: ensureLayoutForWidgets(layouts?.lg, widgetIds, "lg"),
    md: ensureLayoutForWidgets(layouts?.md, widgetIds, "md"),
    sm: ensureLayoutForWidgets(layouts?.sm, widgetIds, "sm"),
  };
};

const isOverlapping = (a: Layout, b: Layout) => {
  const aLeft = a.x;
  const aRight = a.x + a.w;
  const aTop = a.y;
  const aBottom = a.y + a.h;

  const bLeft = b.x;
  const bRight = b.x + b.w;
  const bTop = b.y;
  const bBottom = b.y + b.h;

  return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
};

const getCollidingWidgetIds = (layout: GridLayoutItem[]): WidgetId[] => {
  const collided = new Set<WidgetId>();

  for (let i = 0; i < layout.length; i += 1) {
    for (let j = i + 1; j < layout.length; j += 1) {
      const first = layout[i];
      const second = layout[j];

      if (!first || !second) continue;

      if (isOverlapping(first, second)) {
        collided.add(first.i as WidgetId);
        collided.add(second.i as WidgetId);
      }
    }
  }

  return [...collided];
};

export const DashboardGrid = ({
  editMode,
  activeTab,
  onLayoutsChange,
  onAddWidget,
  onRemoveWidget,
  onEditValidationChange,
}: DashboardGridProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(1200);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>("lg");
  const [selectedWidgetId, setSelectedWidgetId] = useState<WidgetId | null>(
    null
  );

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

  const responsiveLayouts = useMemo(() => {
    return ensureResponsiveLayouts(activeTab.layouts, activeWidgetIds);
  }, [activeTab.layouts, activeWidgetIds]);

  const currentLayout = useMemo(() => {
    return responsiveLayouts[currentBreakpoint] ?? responsiveLayouts.lg ?? [];
  }, [responsiveLayouts, currentBreakpoint]);

  const collidingWidgetIds = useMemo(() => {
    return editMode ? getCollidingWidgetIds(currentLayout) : [];
  }, [editMode, currentLayout]);

  const collidingSet = useMemo(
    () => new Set<WidgetId>(collidingWidgetIds),
    [collidingWidgetIds]
  );

  const hiddenWidgetIds = useMemo(() => {
    return allWidgetIds.filter((widgetId) => !activeWidgetIds.includes(widgetId));
  }, [activeWidgetIds]);

  useEffect(() => {
    onEditValidationChange?.({
      hasCollision: collidingWidgetIds.length > 0,
      collidingWidgetIds,
    });
  }, [collidingWidgetIds, onEditValidationChange]);

  useEffect(() => {
    if (!editMode) setSelectedWidgetId(null);
  }, [editMode]);

  const handleLayoutChange = (_layout: GridLayoutItem[], allLayouts: Layouts) => {
    onLayoutsChange({
      lg: ensureLayoutForWidgets(allLayouts.lg, activeWidgetIds, "lg"),
      md: ensureLayoutForWidgets(allLayouts.md, activeWidgetIds, "md"),
      sm: ensureLayoutForWidgets(allLayouts.sm, activeWidgetIds, "sm"),
    });
  };

  return (
    <div
      ref={wrapperRef}
      className={["dashboard-tab-space", editMode ? "is-editing" : ""]
        .filter(Boolean)
        .join(" ")}
    >
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
          <div
            className={[
              "edit-status-pill",
              collidingWidgetIds.length > 0 ? "is-danger" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {collidingWidgetIds.length > 0
              ? `${collidingWidgetIds.length} widgets overlapping`
              : `${currentBreakpoint.toUpperCase()} responsive grid`}
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

      {editMode && (
        <div className="edit-grid-help">
          위젯을 누른 채 드래그하면 이동, 모서리를 잡으면 크기 조절. 화면
          너비에 따라 LG / MD / SM 레이아웃이 따로 저장돼.
        </div>
      )}

      <div className="dashboard-edit-canvas">
        <Responsive
          className="layout"
          layouts={responsiveLayouts}
          breakpoints={BREAKPOINTS}
          cols={GRID_COLS}
          rowHeight={ROW_HEIGHT}
          width={width}
          margin={[14, 14]}
          containerPadding={[0, 0]}
          isDraggable={editMode}
          isResizable={editMode}
          compactType={editMode ? null : "vertical"}
          preventCollision={!editMode}
          allowOverlap={editMode}
          resizeHandles={["se", "sw", "ne", "nw", "e", "w", "n", "s"]}
          draggableCancel="button, input, textarea, select, [contenteditable='true'], .memo-editor, .floating-window"
          onBreakpointChange={(breakpoint) =>
            setCurrentBreakpoint(breakpoint as Breakpoint)
          }
          onLayoutChange={handleLayoutChange}
        >
          {activeWidgetIds.map((widgetId) => {
            const isSelected = selectedWidgetId === widgetId;
            const isColliding = collidingSet.has(widgetId);

            return (
              <div
                key={widgetId}
                onMouseDown={() => {
                  if (editMode) setSelectedWidgetId(widgetId);
                }}
                className={[
                  "dashboard-grid-item",
                  editMode ? "is-editing" : "",
                  isSelected ? "is-selected" : "",
                  isColliding ? "is-colliding" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {editMode && (
                  <>
                    <div className="widget-edit-label">
                      {widgetRegistry[widgetId]?.label ?? widgetId}
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveWidget(widgetId);
                      }}
                      className="widget-remove-button"
                      title="Remove widget"
                    >
                      ×
                    </button>
                  </>
                )}

                {widgetMap[widgetId]}
              </div>
            );
          })}
        </Responsive>
      </div>
    </div>
  );
};