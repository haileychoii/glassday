import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ComponentType,
  CSSProperties,
  ReactNode,
} from "react";
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

/* =========================================================
   16 COLUMN GRID
========================================================= */

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
const GRID_GAP = 14;
const INITIAL_VISIBLE_ROWS = 16;

/* =========================================================
   Drag 제외 대상

   위젯의 일반적인 빈 공간은 drag 가능.
   버튼 / input / 실제 scroll 영역은 원래 기능 유지.
   resize edge는 drag보다 resize가 우선.
========================================================= */

const DRAGGABLE_CANCEL_SELECTOR = [
  "button",
  "input",
  "textarea",
  "select",
  "option",
  "a",
  "[contenteditable='true']",

  ".react-resizable-handle",

  ".memo-editor",
  ".floating-window",

  ".widget-scroll-area",
  ".calendar-event-list",
  ".calendar-day-list",
  ".calendar-week-list",
  ".calendar-month-scroll",

  ".alert-center-list",
  ".alert-list",

  ".journal-main-scroll",

  ".memo-note-list",
  ".memo-floating-body",

  ".today-task-list",
  ".today-focus-list",

  ".career-list",
  ".study-list",

  ".calendar-google-preview",
  ".calendar-view-toggle",
].join(", ");

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

/* =========================================================
   Type guards
========================================================= */

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

const getWidgetIdFromGridItem = (value: unknown): WidgetId | null => {
  if (!isRecord(value)) return null;
  if (typeof value.i !== "string") return null;

  return value.i as WidgetId;
};

/* =========================================================
   Layout normalization
========================================================= */

const normalizeLayoutItem = (
  item: GridLayoutItem
): GridLayoutItem => {
  const safeWidth = Math.max(2, Math.min(item.w || 4, 16));
  const safeX = Math.max(
    0,
    Math.min(item.x || 0, 16 - safeWidth)
  );

  return {
    ...item,
    i: item.i,
    x: safeX,
    y: Number.isFinite(item.y)
      ? Math.max(0, item.y)
      : item.y,
    w: safeWidth,
    h: Math.max(3, item.h || 5),
  };
};

const toLayoutArray = (value: unknown): GridLayoutItem[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item: unknown): item is GridLayoutItem =>
        isGridLayoutItem(item)
    )
    .map((item) => normalizeLayoutItem(item));
};

const getDefaultLayoutForWidget = (
  widgetId: WidgetId,
  breakpoint: Breakpoint,
  index: number
): GridLayoutItem => {
  const layouts = defaultLayouts as Partial<Layouts>;

  const defaultItem =
    layouts[breakpoint]?.find(
      (item) => item.i === widgetId
    ) ??
    layouts.lg?.find(
      (item) => item.i === widgetId
    );

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

  const existingIds = new Set(
    filteredLayout.map((item) => item.i)
  );

  const missingLayout = widgetIds
    .filter((widgetId) => !existingIds.has(widgetId))
    .map((widgetId, index) =>
      getDefaultLayoutForWidget(
        widgetId,
        breakpoint,
        index
      )
    );

  return [...filteredLayout, ...missingLayout];
};

const ensureResponsiveLayouts = (
  layouts: unknown,
  widgetIds: WidgetId[]
): Layouts => {
  const source =
    layouts && typeof layouts === "object"
      ? layouts
      : {};

  const sourceLayouts = source as Partial<Layouts>;

  return {
    lg: ensureLayoutForWidgets(
      sourceLayouts.lg,
      widgetIds,
      "lg"
    ),

    md: ensureLayoutForWidgets(
      sourceLayouts.md,
      widgetIds,
      "md"
    ),

    sm: ensureLayoutForWidgets(
      sourceLayouts.sm,
      widgetIds,
      "sm"
    ),
  };
};

/* =========================================================
   Collision check
========================================================= */

const isOverlapping = (
  a: GridLayoutItem,
  b: GridLayoutItem
) => {
  const aLeft = a.x;
  const aRight = a.x + a.w;
  const aTop = a.y;
  const aBottom = a.y + a.h;

  const bLeft = b.x;
  const bRight = b.x + b.w;
  const bTop = b.y;
  const bBottom = b.y + b.h;

  return (
    aLeft < bRight &&
    aRight > bLeft &&
    aTop < bBottom &&
    aBottom > bTop
  );
};

const getCollidingWidgetIds = (
  layout: GridLayoutItem[]
): WidgetId[] => {
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

/* =========================================================
   COMPONENT
========================================================= */

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

  const [selectedWidgetId, setSelectedWidgetId] =
    useState<WidgetId | null>(null);

  const isMobileGrid = width < 768;

  /* =========================================================
     Measure actual dashboard width
  ========================================================= */

  useEffect(() => {
    if (!gridWidthRef.current) return;

    const updateWidth = () => {
      if (!gridWidthRef.current) return;

      const nextWidth =
        gridWidthRef.current.getBoundingClientRect().width;

      setWidth(
        Math.max(280, Math.floor(nextWidth))
      );
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);

    observer.observe(gridWidthRef.current);

    window.addEventListener(
      "resize",
      updateWidth
    );

    return () => {
      observer.disconnect();

      window.removeEventListener(
        "resize",
        updateWidth
      );
    };
  }, []);

  /* =========================================================
     Current widgets / layouts
  ========================================================= */

  const activeWidgetIds = useMemo<WidgetId[]>(() => {
    return Array.isArray(activeTab.widgetIds)
      ? activeTab.widgetIds
      : [];
  }, [activeTab.widgetIds]);

  const responsiveLayouts = useMemo<Layouts>(() => {
    return ensureResponsiveLayouts(
      activeTab.layouts,
      activeWidgetIds
    );
  }, [activeTab.layouts, activeWidgetIds]);

  const currentLayout = useMemo<GridLayoutItem[]>(() => {
    return (
      responsiveLayouts[currentBreakpoint] ??
      responsiveLayouts.lg ??
      []
    );
  }, [responsiveLayouts, currentBreakpoint]);

  const collidingWidgetIds = useMemo<WidgetId[]>(() => {
    return editMode
      ? getCollidingWidgetIds(currentLayout)
      : [];
  }, [editMode, currentLayout]);

  const collidingSet = useMemo(
    () => new Set<WidgetId>(collidingWidgetIds),
    [collidingWidgetIds]
  );

  const hiddenWidgetIds = useMemo<WidgetId[]>(() => {
    return (allWidgetIds as WidgetId[]).filter(
      (widgetId) =>
        !activeWidgetIds.includes(widgetId)
    );
  }, [activeWidgetIds]);

  /* =========================================================
     Validation
  ========================================================= */

  useEffect(() => {
    onEditValidationChange?.({
      hasCollision:
        collidingWidgetIds.length > 0,

      collidingWidgetIds,
    });
  }, [
    collidingWidgetIds,
    onEditValidationChange,
  ]);

  useEffect(() => {
    if (!editMode) {
      setSelectedWidgetId(null);
    }
  }, [editMode]);

  /* =========================================================
     Persist layouts
  ========================================================= */

  const handleLayoutChange = (
    _layout: unknown,
    allLayouts: unknown
  ) => {
    const nextLayouts =
      ensureResponsiveLayouts(
        allLayouts,
        activeWidgetIds
      );

    onLayoutsChange({
      lg: ensureLayoutForWidgets(
        nextLayouts.lg,
        activeWidgetIds,
        "lg"
      ),

      md: ensureLayoutForWidgets(
        nextLayouts.md,
        activeWidgetIds,
        "md"
      ),

      sm: ensureLayoutForWidgets(
        nextLayouts.sm,
        activeWidgetIds,
        "sm"
      ),
    });
  };

  const selectGridItem = (item: unknown) => {
    const widgetId =
      getWidgetIdFromGridItem(item);

    if (widgetId) {
      setSelectedWidgetId(widgetId);
    }
  };

  /* =========================================================
     CSS variables for edit grid
  ========================================================= */

  const canvasStyle = {
    "--gd-grid-row-height": `${ROW_HEIGHT}px`,
    "--gd-grid-gap": `${GRID_GAP}px`,
    "--gd-grid-min-height": `${
      INITIAL_VISIBLE_ROWS *
      (ROW_HEIGHT + GRID_GAP)
    }px`,
  } as CSSProperties;

  return (
    <div
      className={[
        "dashboard-tab-space",
        editMode ? "is-editing" : "",
      ]
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
              collidingWidgetIds.length > 0
                ? "is-danger"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {collidingWidgetIds.length > 0
              ? "Rearranging widgets…"
              : isMobileGrid
                ? "16-column grid · move"
                : "16-column grid · move & resize"}
          </div>
        )}
      </div>

      {editMode &&
        hiddenWidgetIds.length > 0 && (
          <div className="widget-picker-panel">
            <div className="text-xs font-bold text-muted-foreground">
              Add widgets
            </div>

            <div className="flex flex-wrap gap-2">
              {hiddenWidgetIds.map(
                (widgetId) => {
                  const widget =
                    safeWidgetRegistry[widgetId];

                  return (
                    <button
                      key={widgetId}
                      type="button"
                      onClick={() =>
                        onAddWidget(widgetId)
                      }
                      className="widget-picker-button"
                    >
                      <strong>
                        {widget?.label ?? widgetId}
                      </strong>

                      <span>
                        {widget?.description ??
                          "Add widget"}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}

      {editMode && (
        <div className="edit-grid-help">
          위젯 안의 빈 공간을 잡아 이동하고,
          가장자리나 모서리를 잡아 크기를 조절해.
          다른 위젯과 부딪히면 자동으로 밀려나.
        </div>
      )}

      <div
        ref={gridWidthRef}
        className={[
          "dashboard-edit-canvas",
          editMode ? "is-editing" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={canvasStyle}
      >
        <ResponsiveGridLayout
  className="layout dashboard-rgl"
  layouts={responsiveLayouts}
  breakpoints={BREAKPOINTS}
  cols={GRID_COLS}
  rowHeight={ROW_HEIGHT}
  width={width}
  margin={[14, 14]}
  containerPadding={[0, 0]}

  autoSize={true}

  isDraggable={editMode}
  isResizable={editMode}

  isBounded={false}

  compactType="vertical"

  preventCollision={false}
  allowOverlap={false}

  draggableHandle={
    editMode ? ".widget-move-surface" : undefined
  }

  onDragStart={(
  _layout: unknown,
  _oldItem: unknown,
  newItem: unknown
) => {
  const item = newItem as GridLayoutItem;

  setSelectedWidgetId(item.i as WidgetId);
}}

onResizeStart={(
  _layout: unknown,
  _oldItem: unknown,
  newItem: unknown
) => {
  const item = newItem as GridLayoutItem;

  setSelectedWidgetId(item.i as WidgetId);
}}

  resizeHandles={[
    "n",
    "s",
    "e",
    "w",
    "ne",
    "nw",
    "se",
    "sw",
  ]}

  onBreakpointChange={(breakpoint: unknown) => {
    setCurrentBreakpoint(breakpoint as Breakpoint);
  }}

  onDragStart={(
    _layout: unknown,
    _oldItem: unknown,
    newItem: unknown
  ) => {
    const item = newItem as GridLayoutItem;

    setSelectedWidgetId(item.i as WidgetId);
  }}

  onResizeStart={(
    _layout: unknown,
    _oldItem: unknown,
    newItem: unknown
  ) => {
    const item = newItem as GridLayoutItem;

    setSelectedWidgetId(item.i as WidgetId);
  }}

  onLayoutChange={handleLayoutChange}
>


          {activeWidgetIds.map((widgetId) => {
            const isSelected =
              selectedWidgetId === widgetId;

            const isColliding =
              collidingSet.has(widgetId);

            const widget =
              safeWidgetRegistry[widgetId];

            return (
              <div
  key={widgetId}
  onPointerDownCapture={(event) => {
    if (!editMode) return;

    const target = event.target as HTMLElement;

    /*
     * 삭제 버튼을 누를 때는 선택 이벤트 제외.
     * resize handle은 RGL이 직접 처리.
     */
    if (
      target.closest(".widget-remove-button") ||
      target.closest(".react-resizable-handle")
    ) {
      return;
    }

    setSelectedWidgetId(widgetId);
  }}
  onClickCapture={() => {
    if (!editMode) return;

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
                      ×
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