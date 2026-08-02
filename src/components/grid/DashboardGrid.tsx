import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ComponentType,
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { Responsive } from "react-grid-layout/legacy";

import type {
  DashboardLayoutMode,
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
import { TimerWidget } from "../widgets/TimerWidget";
import { CareerWidget } from "../widgets/CareerWidget";
import { HealthWidget } from "../widgets/HealthWidget";
import { MoneyWidget } from "../widgets/MoneyWidget";
import { MoodWidget } from "../widgets/MoodWidget";

import { defaultLayoutsByMode } from "./gridDefaults";
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
  layoutMode: DashboardLayoutMode;
  activeTab: DashboardTab;
  onLayoutsChange: (mode: DashboardLayoutMode, layouts: Layouts) => void;
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

const INITIAL_VISIBLE_ROWS = 16;

const RESIZE_HANDLES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const;

const WIDGET_LAYOUT_CONSTRAINTS: Partial<
  Record<WidgetId, Pick<GridLayoutItem, "minH" | "minW">>
> = {
  calendar: {
    // Calendar rows now compress further, so the widget can stay usable
    // even when the user shortens it in laptop mode.
    minH: 9,
    minW: 5,
  },
};

type ResizeHandle = (typeof RESIZE_HANDLES)[number];

type EditInteraction = {
  mode: "move" | "resize";
  inputKind: "pointer" | "mouse";
  widgetId: WidgetId;
  breakpoint: Breakpoint;
  handle?: ResizeHandle;
  startClientX: number;
  startClientY: number;
  startItem: GridLayoutItem;
  startLayouts: Layouts;
  lastLayouts: Layouts;
};

const widgetMap: Partial<Record<WidgetId, ReactNode>> = {
  today: <TodayFocusWidget />,
  alerts: <AlertCenterWidget />,
  journal: <DailyJournalWidget />,
  calendar: <CalendarWidget />,
  memo: <MemoWidget />,
  study: <StudyWidget />,
  timer: <TimerWidget />,
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
  const constraints = WIDGET_LAYOUT_CONSTRAINTS[item.i as WidgetId] ?? {};
  const minWidth = Math.max(2, constraints.minW ?? item.minW ?? 2);
  const minHeight = Math.max(3, constraints.minH ?? item.minH ?? 3);
  const safeWidth = Math.max(minWidth, Math.min(item.w || 4, 16));
  const safeX = Math.max(0, Math.min(item.x || 0, 16 - safeWidth));

  return {
    ...item,
    ...constraints,
    i: item.i,
    x: safeX,
    y: Number.isFinite(item.y) ? Math.max(0, item.y) : item.y,
    w: safeWidth,
    h: Math.max(minHeight, item.h || 5),
  };
};

const toLayoutArray = (value: unknown): GridLayoutItem[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item: unknown): item is GridLayoutItem => isGridLayoutItem(item))
    .map((item) => normalizeLayoutItem(item));
};

const getDefaultLayoutForWidget = (
  layoutMode: DashboardLayoutMode,
  widgetId: WidgetId,
  breakpoint: Breakpoint,
  index: number
): GridLayoutItem => {
  const layouts = defaultLayoutsByMode[layoutMode] as Partial<Layouts>;

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
  breakpoint: Breakpoint,
  layoutMode: DashboardLayoutMode
): GridLayoutItem[] => {
  const safeLayout = toLayoutArray(layout);
  const filteredLayout = safeLayout.filter((item) =>
    widgetIds.includes(item.i as WidgetId)
  );
  const existingIds = new Set(filteredLayout.map((item) => item.i));

  const missingLayout = widgetIds
    .filter((widgetId) => !existingIds.has(widgetId))
    .map((widgetId, index) =>
      getDefaultLayoutForWidget(layoutMode, widgetId, breakpoint, index)
    );

  return [...filteredLayout, ...missingLayout];
};

const ensureResponsiveLayouts = (
  layouts: unknown,
  widgetIds: WidgetId[],
  layoutMode: DashboardLayoutMode
): Layouts => {
  const source = layouts && typeof layouts === "object" ? layouts : {};
  const sourceLayouts = source as Partial<Layouts>;

  return {
    lg: ensureLayoutForWidgets(sourceLayouts.lg, widgetIds, "lg", layoutMode),
    md: ensureLayoutForWidgets(sourceLayouts.md, widgetIds, "md", layoutMode),
    sm: ensureLayoutForWidgets(sourceLayouts.sm, widgetIds, "sm", layoutMode),
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

const stackLayoutWithPriority = (
  layout: GridLayoutItem[],
  priorityItemId: string
): GridLayoutItem[] => {
  const placed: GridLayoutItem[] = [];
  const priorityItem = layout.find((item) => item.i === priorityItemId);
  const remainingItems = layout
    .filter((item) => item.i !== priorityItemId)
    .sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      if (a.x !== b.x) return a.x - b.x;
      return a.i.localeCompare(b.i);
    });
  const orderedItems = priorityItem ? [priorityItem, ...remainingItems] : remainingItems;

  orderedItems.forEach((sourceItem) => {
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

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(value, max));
};

const normalizeLayoutItemForCols = (
  item: GridLayoutItem,
  cols: number
): GridLayoutItem => {
  const constraints = WIDGET_LAYOUT_CONSTRAINTS[item.i as WidgetId] ?? {};
  const minWidth = Math.max(2, constraints.minW ?? item.minW ?? 2);
  const minHeight = Math.max(3, constraints.minH ?? item.minH ?? 3);
  const safeWidth = clamp(item.w, Math.min(minWidth, cols), cols);
  const safeX = clamp(item.x, 0, cols - safeWidth);

  return {
    ...item,
    ...constraints,
    x: safeX,
    y: Math.max(0, item.y),
    w: safeWidth,
    h: Math.max(minHeight, item.h),
  };
};

const replaceLayoutItem = (
  layout: GridLayoutItem[],
  nextItem: GridLayoutItem,
  cols: number
) => {
  const normalizedItem = normalizeLayoutItemForCols(nextItem, cols);

  return layout.map((item) =>
    item.i === normalizedItem.i ? normalizedItem : item
  );
};

export const DashboardGrid = ({
  editMode,
  layoutMode,
  activeTab,
  onLayoutsChange,
  onAddWidget,
  onRemoveWidget,
  onEditValidationChange,
}: DashboardGridProps) => {
  const gridWidthRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<EditInteraction | null>(null);
  const [width, setWidth] = useState(1200);
  const [currentBreakpoint, setCurrentBreakpoint] =
    useState<Breakpoint>("lg");
  const [selectedWidgetId, setSelectedWidgetId] = useState<WidgetId | null>(
    null
  );
  const [draftLayouts, setDraftLayouts] = useState<Layouts | null>(null);

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
  const rowHeight = layoutMode === "laptop" ? 46 : 52;
  const gridGap = layoutMode === "laptop" ? 10 : 14;

  const responsiveLayouts = useMemo<Layouts>(() => {
    return ensureResponsiveLayouts(
      activeTab.layouts[layoutMode],
      activeWidgetIds,
      layoutMode
    );
  }, [activeTab.layouts, activeWidgetIds, layoutMode]);

  const displayedLayouts = useMemo<Layouts>(() => {
    if (editMode && draftLayouts) {
      return draftLayouts;
    }

    return editMode
      ? responsiveLayouts
      : stackResponsiveLayouts(responsiveLayouts);
  }, [draftLayouts, editMode, responsiveLayouts]);

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

  const getGridMetrics = (breakpoint: Breakpoint) => {
    const cols = GRID_COLS[breakpoint];
    const columnWidth = (width - gridGap * (cols - 1)) / cols;

    return {
      cols,
      columnStep: columnWidth + gridGap,
      rowStep: rowHeight + gridGap,
    };
  };

  const commitInteractionLayout = (
    session: EditInteraction,
    clientX: number,
    clientY: number
  ) => {
    const { cols, columnStep, rowStep } = getGridMetrics(session.breakpoint);
    const deltaColumns = Math.round(
      (clientX - session.startClientX) / columnStep
    );
    const deltaRows = Math.round(
      (clientY - session.startClientY) / rowStep
    );
    const startItem = session.startItem;
    let nextItem: GridLayoutItem = { ...startItem };

    if (session.mode === "move") {
      nextItem = {
        ...nextItem,
        x: clamp(startItem.x + deltaColumns, 0, cols - startItem.w),
        y: Math.max(0, startItem.y + deltaRows),
      };
    } else {
      const handle = session.handle ?? "se";
      let nextX = startItem.x;
      let nextY = startItem.y;
      let nextW = startItem.w;
      let nextH = startItem.h;
      const minWidth = startItem.minW ?? 2;
      const minHeight = startItem.minH ?? 3;

      if (handle.includes("e")) {
        nextW = clamp(
          startItem.w + deltaColumns,
          Math.min(minWidth, cols - startItem.x),
          cols - startItem.x
        );
      }

      if (handle.includes("s")) {
        nextH = Math.max(minHeight, startItem.h + deltaRows);
      }

      if (handle.includes("w")) {
        const maxLeftDelta = startItem.x;
        const maxRightDelta = startItem.w - minWidth;
        const leftDelta = clamp(deltaColumns, -maxLeftDelta, maxRightDelta);

        nextX = startItem.x + leftDelta;
        nextW = startItem.w - leftDelta;
      }

      if (handle.includes("n")) {
        const maxUpDelta = startItem.y;
        const maxDownDelta = startItem.h - minHeight;
        const topDelta = clamp(deltaRows, -maxUpDelta, maxDownDelta);

        nextY = startItem.y + topDelta;
        nextH = startItem.h - topDelta;
      }

      nextItem = {
        ...nextItem,
        x: nextX,
        y: nextY,
        w: nextW,
        h: nextH,
      };
    }

    const sourceLayout =
      session.startLayouts[session.breakpoint] ?? session.startLayouts.lg;
    const nextLayout = stackLayoutWithPriority(
      replaceLayoutItem(sourceLayout, nextItem, cols),
      session.widgetId
    );

    const nextLayouts = {
      ...session.startLayouts,
      [session.breakpoint]: nextLayout,
    };

    session.lastLayouts = nextLayouts;
    setDraftLayouts(nextLayouts);
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const session = interactionRef.current;
      if (!session || session.inputKind !== "pointer") return;

      event.preventDefault();
      commitInteractionLayout(session, event.clientX, event.clientY);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const session = interactionRef.current;
      if (!session || session.inputKind !== "mouse") return;

      event.preventDefault();
      commitInteractionLayout(session, event.clientX, event.clientY);
    };

    const finishInteraction = () => {
      const session = interactionRef.current;
      if (session) {
        onLayoutsChange(layoutMode, session.lastLayouts);
      }

      interactionRef.current = null;
      setDraftLayouts(null);
    };

    const handlePointerUp = () => {
      const session = interactionRef.current;
      if (!session || session.inputKind !== "pointer") return;
      finishInteraction();
    };

    const handleMouseUp = () => {
      const session = interactionRef.current;
      if (!session || session.inputKind !== "mouse") return;
      finishInteraction();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [layoutMode, onLayoutsChange, width]);

  const continuePointerInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    const session = interactionRef.current;
    if (!session || session.inputKind !== "pointer") return;

    event.preventDefault();
    commitInteractionLayout(session, event.clientX, event.clientY);
  };

  const continueMouseInteraction = (event: ReactMouseEvent<HTMLElement>) => {
    const session = interactionRef.current;
    if (!session || session.inputKind !== "mouse") return;

    event.preventDefault();
    commitInteractionLayout(session, event.clientX, event.clientY);
  };

  const startEditInteraction = (
    mode: EditInteraction["mode"],
    inputKind: EditInteraction["inputKind"],
    widgetId: WidgetId,
    clientX: number,
    clientY: number,
    handle?: ResizeHandle
  ) => {
    const layout = responsiveLayouts[currentBreakpoint] ?? responsiveLayouts.lg;
    const startItem = layout.find((item) => item.i === widgetId);
    if (!startItem) return;

    setSelectedWidgetId(widgetId);

    interactionRef.current = {
      mode,
      inputKind,
      widgetId,
      breakpoint: currentBreakpoint,
      handle,
      startClientX: clientX,
      startClientY: clientY,
      startItem: { ...startItem },
      startLayouts: responsiveLayouts,
      lastLayouts: responsiveLayouts,
    };

    setDraftLayouts(responsiveLayouts);
  };

  const beginEditInteraction = (
    mode: EditInteraction["mode"],
    widgetId: WidgetId,
    event: ReactPointerEvent<HTMLElement>,
    handle?: ResizeHandle
  ) => {
    if (!editMode) return;
    if (interactionRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const layout = responsiveLayouts[currentBreakpoint] ?? responsiveLayouts.lg;
    const startItem = layout.find((item) => item.i === widgetId);
    if (!startItem) return;

    event.preventDefault();
    event.stopPropagation();

    startEditInteraction(
      mode,
      "pointer",
      widgetId,
      event.clientX,
      event.clientY,
      handle
    );
  };

  const beginMouseEditInteraction = (
    mode: EditInteraction["mode"],
    widgetId: WidgetId,
    event: ReactMouseEvent<HTMLElement>,
    handle?: ResizeHandle
  ) => {
    if (!editMode) return;
    if (interactionRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    startEditInteraction(
      mode,
      "mouse",
      widgetId,
      event.clientX,
      event.clientY,
      handle
    );
  };

  const canvasStyle = {
    "--gd-grid-row-height": `${rowHeight}px`,
    "--gd-grid-gap": `${gridGap}px`,
    "--gd-grid-min-height": `${
      INITIAL_VISIBLE_ROWS * rowHeight + (INITIAL_VISIBLE_ROWS - 1) * gridGap
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
        onPointerMove={continuePointerInteraction}
        onMouseMove={continueMouseInteraction}
      >
        <ResponsiveGridLayout
          className="layout dashboard-rgl"
          layouts={displayedLayouts}
          breakpoints={BREAKPOINTS}
          cols={GRID_COLS}
          rowHeight={rowHeight}
          width={width}
          margin={[gridGap, gridGap]}
          containerPadding={[0, 0]}
          autoSize={true}
          isDraggable={false}
          isResizable={false}
          isBounded={false}
          compactType="vertical"
          preventCollision={false}
          allowOverlap={false}
          onBreakpointChange={(breakpoint: unknown) => {
            setCurrentBreakpoint(breakpoint as Breakpoint);
          }}
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
                    <div
                      className="widget-move-surface"
                      aria-hidden="true"
                      onPointerDown={(event) =>
                        beginEditInteraction("move", widgetId, event)
                      }
                      onPointerMove={continuePointerInteraction}
                      onMouseDown={(event) =>
                        beginMouseEditInteraction("move", widgetId, event)
                      }
                      onMouseMove={continueMouseInteraction}
                    />

                    {RESIZE_HANDLES.map((handle) => (
                      <span
                        key={handle}
                        className={`react-resizable-handle react-resizable-handle-${handle}`}
                        aria-hidden="true"
                        onPointerDown={(event) =>
                          beginEditInteraction("resize", widgetId, event, handle)
                        }
                        onPointerMove={continuePointerInteraction}
                        onMouseDown={(event) =>
                          beginMouseEditInteraction(
                            "resize",
                            widgetId,
                            event,
                            handle
                          )
                        }
                        onMouseMove={continueMouseInteraction}
                      />
                    ))}

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

      {/* Global Career detail host
          Career's normal widget owns the portal when it is visible. Other
          workspaces mount only the detail renderer so Calendar events can open
          the same floating window without adding Career to that grid. */}
      {!activeWidgetIds.includes("career") && <CareerWidget detailOnly />}
    </div>
  );
};
