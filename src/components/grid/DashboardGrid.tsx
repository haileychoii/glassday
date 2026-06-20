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
  onEditValidationChange?: (state: {
    hasCollision: boolean;
    collidingWidgetIds: WidgetId[];
  }) => void;
};

const GRID_COLS = 16;
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
  const safeWidth = Math.max(2, Math.min(item.w || 4, GRID_COLS));
  const safeX = Math.max(0, Math.min(item.x || 0, GRID_COLS - safeWidth));

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
  index: number
): Layout => {
  const defaultItem =
    defaultLayouts.lg?.find((item) => item.i === widgetId) ??
    defaultLayouts.md?.find((item) => item.i === widgetId) ??
    defaultLayouts.sm?.find((item) => item.i === widgetId);

  if (defaultItem) {
    return normalizeLayoutItem({
      ...defaultItem,
      w: Math.min(GRID_COLS, Math.max(3, defaultItem.w)),
    });
  }

  return {
    i: widgetId,
    x: (index * 4) % GRID_COLS,
    y: Infinity,
    w: 5,
    h: 6,
  };
};

const ensureLayoutForWidgets = (
  layout: Layout[] | undefined,
  widgetIds: WidgetId[]
): Layout[] => {
  const safeLayout = Array.isArray(layout) ? layout : [];
  const existingIds = new Set(safeLayout.map((item) => item.i));

  const filteredLayout = safeLayout
    .filter((item) => widgetIds.includes(item.i as WidgetId))
    .map(normalizeLayoutItem);

  const missingLayout = widgetIds
    .filter((widgetId) => !existingIds.has(widgetId))
    .map((widgetId, index) => getDefaultLayoutForWidget(widgetId, index));

  return [...filteredLayout, ...missingLayout];
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

const getCollidingWidgetIds = (layout: Layout[]): WidgetId[] => {
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

  const layout = useMemo(() => {
    return ensureLayoutForWidgets(activeTab.layouts?.lg, activeWidgetIds);
  }, [activeTab.layouts, activeWidgetIds]);

  const collidingWidgetIds = useMemo(() => {
    return editMode ? getCollidingWidgetIds(layout) : [];
  }, [editMode, layout]);

  const collidingSet = useMemo(() => {
    return new Set<WidgetId>(collidingWidgetIds);
  }, [collidingWidgetIds]);

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
    if (!editMode) {
      setSelectedWidgetId(null);
    }
  }, [editMode]);

  const handleLayoutChange = (nextLayout: Layout[]) => {
    onLayoutsChange({
      ...activeTab.layouts,
      lg: nextLayout.map(normalizeLayoutItem),
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
              : "16×16 edit grid"}
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
          위젯을 누른 채 드래그하면 이동, 모서리를 잡으면 크기 조절. 겹치면
          붉은색으로 표시돼.
        </div>
      )}

      <div className="dashboard-edit-canvas">
        <GridLayout
          className="layout"
          layout={layout}
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
          onLayoutChange={handleLayoutChange}
        >
          {activeWidgetIds.map((widgetId) => {
            const isSelected = selectedWidgetId === widgetId;
            const isColliding = collidingSet.has(widgetId);

            return (
              <div
                key={widgetId}
                onMouseDown={() => {
                  if (editMode) {
                    setSelectedWidgetId(widgetId);
                  }
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
        </GridLayout>
      </div>
    </div>
  );
};