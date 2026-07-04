import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import { Responsive } from "react-grid-layout/legacy";

import type {
  DashboardTab,
  GridLayoutItem,
  Layouts,
  WidgetId,
  WidgetMeta,
} from "../../types/workspace";

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

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = Responsive as unknown as ComponentType<
  Record<string, unknown>
>;

const safeWidgetRegistry = widgetRegistry as Record<string, WidgetMeta>;

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
  lg: 980,
  md: 620,
  sm: 0,
};

const GRID_COLS: Record<Breakpoint, number> = {
  lg: 16,
  md: 16,
  sm: 16,
};

const ROW_HEIGHT = 52;
const GRID_GAP = 14;
const INITIAL_VISIBLE_ROWS = 16;

const DRAGGABLE_CANCEL_SELECTOR = [
  "button",
  "input",
  "textarea",
  "select",
  "option",
  "a",
  "label",
  "[contenteditable='true']",
  ".widget-remove-button",
  ".react-resizable-handle",
].join(", ");

const RESIZE_HANDLES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

const widgetMap: Partial<Record<WidgetId, ReactNode>> = {
  today: <TodayFocusWidget />,
  alerts: <AlertCenterWidget />,
  journal: <DailyJournalWidget />,
  calendar: <CalendarWidget />,
  memo: <MemoWidget />,
  study: <StudyWidget />,
  career: <CareerWidget />,
  health: <HealthWidget />,
  money: <MoneyWidget />,
  wealth: <MoneyWidget />,
  mood: <MoodWidget />,
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isGridLayoutItem = (value: unknown): value is GridLayoutItem => {
  if (!isRecord(value)) return false;

  return (
    typeof value.i === "string" &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.w === "number" &&
    typeof value.h === "number"
  );
};

const normalizeLayoutItem = (item: GridLayoutItem): GridLayoutItem => {
  const safeWidth = Math.max(2, Math.min(item.w || 4, 16));
  const safeX = Math.max(0, Math.min(item.x || 0, 16 - safeWidth));

  return {
    ...item,
    i: item.i,
    x: safeX,
    y: Number.isFinite(item.y) ? Math.max(0, item.y) : item.y,
    w: safeWidth,
    h: Math.max(3, item.h || 5),
  };
};

const toLayoutArray = (value: unknown): GridLayoutItem[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item: unknown): item is GridLayoutItem => isGridLayoutItem(item))
    .map((item) => normalizeLayoutItem(item));
};

const getDefaultLayoutForWidget = (
  widgetId: WidgetId,
  breakpoint: Breakpoint,
  index: number
): GridLayoutItem => {
  const layouts = defaultLayouts as Partial<Layouts>;

  const defaultItem =
    layouts[breakpoint]?.find((item) => item.i === widgetId) ??
    layouts.lg?.find((item) => item.i === widgetId);

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
  layout: unknown,
  widgetIds: WidgetId[],
  breakpoint: Breakpoint
): GridLayoutItem[] => {
  const safeLayout = toLayoutArray(layout);
  const filteredLayout = safeLayout.filter((item) =>
    widgetIds.includes(item.i as WidgetId)
  );
  const existingIds = new Set(filteredLayout.map((item) => item.i));

  const missingLayout = widgetIds
    .filter((widgetId) => !existingIds.has(widgetId))
    .map((widgetId, index) =>
      getDefaultLayoutForWidget(widgetId, breakpoint, index)
    );

  return [...filteredLayout, ...missingLayout];
};

const ensureResponsiveLayouts = (
  layouts: unknown,
  widgetIds: WidgetId[]
): Layouts => {
  const source = layouts && typeof layouts === "object" ? layouts : {};
  const sourceLayouts = source as Partial<Layouts>;

  return {
    lg: ensureLayoutForWidgets(sourceLayouts.lg, widgetIds, "lg"),
    md: ensureLayoutForWidgets(sourceLayouts.md, widgetIds, "md"),
    sm: ensureLayoutForWidgets(sourceLayouts.sm, widgetIds, "sm"),
  };
};

const isOverlapping = (a: GridLayoutItem, b: GridLayoutItem) => {
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

const stackCollidingLayout = (layout: GridLayoutItem[]): GridLayoutItem[] => {
  const placed: GridLayoutItem[] = [];
  const orderedLayout = [...layout].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    if (a.x !== b.x) return a.x - b.x;
    return a.i.localeCompare(b.i);
  });

  orderedLayout.forEach((sourceItem) => {
    const item = { ...sourceItem };
    let moved = true;

    while (moved) {
      moved = false;

      placed.forEach((placedItem) => {
        if (isOverlapping(item, placedItem)) {
          item.y = placedItem.y + placedItem.h;
          moved = true;
        }
      });
    }

    placed.push(item);
  });

  return placed;
};

const stackResponsiveLayouts = (layouts: Layouts): Layouts => ({
  lg: stackCollidingLayout(layouts.lg),
  md: stackCollidingLayout(layouts.md),
  sm: stackCollidingLayout(layouts.sm),
});

const getWidgetIdFromLayoutItem = (item: unknown): WidgetId | null => {
  if (!isRecord(item) || typeof item.i !== "string") return null;
  return item.i as WidgetId;
};

export const DashboardGrid = ({
  editMode,
  activeTab,
  onLayoutsChange,
  onAddWidget,
  onRemoveWidget,
  onEditValidationChange,
}: DashboardGridProps) => {
  const gridWidthRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(1200);
  const [currentBreakpoint, setCurrentBreakpoint] =
    useState<Breakpoint>("lg");
  const [selectedWidgetId, setSelectedWidgetId] = useState<WidgetId | null>(
    null
  );

  useEffect(() => {
    if (!gridWidthRef.current) return;

    const updateWidth = () => {
      if (!gridWidthRef.current) return;
      const nextWidth = gridWidthRef.current.getBoundingClientRect().width;
      setWidth(Math.max(280, Math.floor(nextWidth)));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(gridWidthRef.current);
    window.addEventListener("resize", updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const activeWidgetIds = useMemo<WidgetId[]>(() => {
    return Array.isArray(activeTab.widgetIds) ? activeTab.widgetIds : [];
  }, [activeTab.widgetIds]);

  const responsiveLayouts = useMemo<Layouts>(() => {
    return ensureResponsiveLayouts(activeTab.layouts, activeWidgetIds);
  }, [activeTab.layouts, activeWidgetIds]);

  const displayedLayouts = useMemo<Layouts>(() => {
    return editMode
      ? responsiveLayouts
      : stackResponsiveLayouts(responsiveLayouts);
  }, [editMode, responsiveLayouts]);

  const editLayout = useMemo<GridLayoutItem[]>(() => {
    return responsiveLayouts[currentBreakpoint] ?? responsiveLayouts.lg ?? [];
  }, [responsiveLayouts, currentBreakpoint]);

  const collidingWidgetIds = useMemo<WidgetId[]>(() => {
    return editMode ? getCollidingWidgetIds(editLayout) : [];
  }, [editMode, editLayout]);

  const collidingSet = useMemo(
    () => new Set<WidgetId>(collidingWidgetIds),
    [collidingWidgetIds]
  );

  const hiddenWidgetIds = useMemo<WidgetId[]>(() => {
    return (allWidgetIds as WidgetId[]).filter(
      (widgetId) => !activeWidgetIds.includes(widgetId)
    );
  }, [activeWidgetIds]);

  useEffect(() => {
    onEditValidationChange?.({
      hasCollision: collidingWidgetIds.length > 0,
      collidingWidgetIds,
    });
  }, [collidingWidgetIds, onEditValidationChange]);

  const handleLayoutChange = (_layout: unknown, allLayouts: unknown) => {
    const nextLayouts = ensureResponsiveLayouts(allLayouts, activeWidgetIds);

    onLayoutsChange({
      lg: ensureLayoutForWidgets(nextLayouts.lg, activeWidgetIds, "lg"),
      md: ensureLayoutForWidgets(nextLayouts.md, activeWidgetIds, "md"),
      sm: ensureLayoutForWidgets(nextLayouts.sm, activeWidgetIds, "sm"),
    });
  };

  const selectLayoutItem = (item: unknown) => {
    const widgetId = getWidgetIdFromLayoutItem(item);
    if (widgetId) setSelectedWidgetId(widgetId);
  };

  const canvasStyle = {
    "--gd-grid-row-height": `${ROW_HEIGHT}px`,
    "--gd-grid-gap": `${GRID_GAP}px`,
    "--gd-grid-min-height": `${
      INITIAL_VISIBLE_ROWS * ROW_HEIGHT + (INITIAL_VISIBLE_ROWS - 1) * GRID_GAP
    }px`,
  } as CSSProperties;

  return (
    <div
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
              ? "Rearranging widgets"
              : "16-column grid - move & resize"}
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
              const widget = safeWidgetRegistry[widgetId];

              return (
                <button
                  key={widgetId}
                  type="button"
                  onClick={() => onAddWidget(widgetId)}
                  className="widget-picker-button"
                >
                  <strong>{widget?.label ?? widgetId}</strong>
                  <span>{widget?.description ?? "Add widget"}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {editMode && (
        <div className="edit-grid-help">
          Drag any non-control area of a widget to move it. Drag an edge or
          corner to resize. Widgets reflow on the 16-column grid instead of
          overlapping.
        </div>
      )}

      <div
        ref={gridWidthRef}
        className={["dashboard-edit-canvas", editMode ? "is-editing" : ""]
          .filter(Boolean)
          .join(" ")}
        style={canvasStyle}
      >
        <ResponsiveGridLayout
          className="layout dashboard-rgl"
          layouts={displayedLayouts}
          breakpoints={BREAKPOINTS}
          cols={GRID_COLS}
          rowHeight={ROW_HEIGHT}
          width={width}
          margin={[GRID_GAP, GRID_GAP]}
          containerPadding={[0, 0]}
          autoSize={true}
          isDraggable={editMode}
          isResizable={editMode}
          isBounded={false}
          compactType="vertical"
          preventCollision={false}
          allowOverlap={false}
          draggableCancel={DRAGGABLE_CANCEL_SELECTOR}
          resizeHandles={RESIZE_HANDLES}
          onBreakpointChange={(breakpoint: unknown) => {
            setCurrentBreakpoint(breakpoint as Breakpoint);
          }}
          onDragStart={(
            _layout: unknown,
            _oldItem: unknown,
            newItem: unknown
          ) => selectLayoutItem(newItem)}
          onResizeStart={(
            _layout: unknown,
            _oldItem: unknown,
            newItem: unknown
          ) => selectLayoutItem(newItem)}
          onLayoutChange={handleLayoutChange}
        >
          {activeWidgetIds.map((widgetId) => {
            const isSelected = editMode && selectedWidgetId === widgetId;
            const isColliding = collidingSet.has(widgetId);
            const widget = safeWidgetRegistry[widgetId];

            return (
              <div
                key={widgetId}
                onPointerDownCapture={(event) => {
                  if (!editMode) return;
                  const target = event.target as HTMLElement;

                  if (
                    target.closest(".widget-remove-button") ||
                    target.closest(".react-resizable-handle")
                  ) {
                    return;
                  }

                  setSelectedWidgetId(widgetId);
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
                      {widget?.label ?? widgetId}
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
                      x
                    </button>
                  </>
                )}

                {widgetMap[widgetId] ?? (
                  <div className="glass-card unknown-widget-card">
                    Unknown widget: {widgetId}
                  </div>
                )}
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
};
