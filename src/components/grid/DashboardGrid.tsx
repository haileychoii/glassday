import { useEffect, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Move,
  RotateCcw,
} from "lucide-react";

import { TodayFocusWidget } from "../widgets/TodayFocusWidget";
import { CalendarWidget } from "../widgets/CalendarWidget";
import { MemoWidget } from "../widgets/MemoWidget";
import { StudyWidget } from "../widgets/StudyWidget";
import { CareerWidget } from "../widgets/CareerWidget";
import { HealthWidget } from "../widgets/HealthWidget";
import { MoneyWidget } from "../widgets/MoneyWidget";
import { MoodWidget } from "../widgets/MoodWidget";

import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";

type WidgetId =
  | "todayFocus"
  | "calendar"
  | "memo"
  | "career"
  | "study"
  | "health"
  | "money"
  | "mood";

type LayoutTool = "content" | "move" | "resize";

type GridItem = {
  id: WidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
};

type DashboardGridProps = {
  editMode: boolean;
};

const COLS = 12;
const ROWS = 12;
const ROW_HEIGHT = 82;
const GAP = 16;

/**
 * v3로 바꾼 이유:
 * 기존 localStorage에 저장된 "today" id / 오래된 배치가 있으면
 * 새 todayFocus 위젯이 안 뜨거나 꼬일 수 있어서 새 레이아웃으로 시작하게 함.
 */
const STORAGE_KEY = "glassday.widget.grid-layout.v3";

const defaultGridLayout: GridItem[] = [
  {
    id: "todayFocus",
    x: 0,
    y: 0,
    w: 5,
    h: 4,
    minW: 4,
    minH: 3,
  },
  {
    id: "calendar",
    x: 5,
    y: 0,
    w: 7,
    h: 5,
    minW: 5,
    minH: 4,
  },
  {
    id: "memo",
    x: 0,
    y: 4,
    w: 5,
    h: 4,
    minW: 4,
    minH: 3,
  },
  {
    id: "career",
    x: 5,
    y: 5,
    w: 4,
    h: 4,
    minW: 4,
    minH: 3,
  },
  {
    id: "study",
    x: 9,
    y: 5,
    w: 3,
    h: 4,
    minW: 3,
    minH: 3,
  },
  {
    id: "health",
    x: 0,
    y: 8,
    w: 3,
    h: 4,
    minW: 3,
    minH: 3,
  },
  {
    id: "money",
    x: 3,
    y: 8,
    w: 3,
    h: 4,
    minW: 3,
    minH: 3,
  },
  {
    id: "mood",
    x: 6,
    y: 9,
    w: 3,
    h: 3,
    minW: 3,
    minH: 3,
  },
];

const widgetMap: Record<WidgetId, ReactNode> = {
  todayFocus: <TodayFocusWidget />,
  calendar: <CalendarWidget />,
  memo: <MemoWidget />,
  career: <CareerWidget />,
  study: <StudyWidget />,
  health: <HealthWidget />,
  money: <MoneyWidget />,
  mood: <MoodWidget />,
};

const widgetLabels: Record<WidgetId, string> = {
  todayFocus: "Today Focus",
  calendar: "Calendar",
  memo: "Memo",
  career: "Career",
  study: "Study",
  health: "Health",
  money: "Money",
  mood: "Mood",
};

const widgetIds = Object.keys(widgetMap) as WidgetId[];

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const isOverlapping = (a: GridItem, b: GridItem) => {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
};

const hasCollision = (candidate: GridItem, layout: GridItem[]) => {
  return layout.some((item) => {
    if (item.id === candidate.id) return false;
    return isOverlapping(candidate, item);
  });
};

const normalizeLayout = (layout: GridItem[]) => {
  const validItems = layout.filter((item) =>
    widgetIds.includes(item.id)
  );

  const existingIds = new Set(validItems.map((item) => item.id));

  const missingItems = defaultGridLayout.filter(
    (item) => !existingIds.has(item.id)
  );

  return [...validItems, ...missingItems].map((item) => {
    const defaultItem =
      defaultGridLayout.find((defaultLayoutItem) => defaultLayoutItem.id === item.id) ??
      item;

    return {
      ...defaultItem,
      ...item,
      minW: item.minW ?? defaultItem.minW,
      minH: item.minH ?? defaultItem.minH,
      w: clamp(item.w, item.minW ?? defaultItem.minW, COLS),
      h: clamp(item.h, item.minH ?? defaultItem.minH, ROWS),
      x: clamp(item.x, 0, COLS - item.w),
      y: clamp(item.y, 0, ROWS - item.h),
    };
  });
};

export const DashboardGrid = ({ editMode }: DashboardGridProps) => {
  const boardRef = useRef<HTMLDivElement | null>(null);

  const [tool, setTool] = useState<LayoutTool>("content");
  const [selectedId, setSelectedId] = useState<WidgetId>("todayFocus");

  const [panelPos, setPanelPos] = useState(() => ({
    x: Math.max(24, window.innerWidth - 520),
    y: 96,
  }));

  const {
    value: storedLayout,
    setValue: setLayout,
    resetValue,
  } = useLocalStorage<GridItem[]>(STORAGE_KEY, defaultGridLayout);

  const layout = normalizeLayout(storedLayout);

  const selectedItem = layout.find((item) => item.id === selectedId);
  const isLayoutTool = editMode && tool !== "content";

  useEffect(() => {
    if (!editMode) {
      setTool("content");
    }
  }, [editMode]);

  useEffect(() => {
    const normalized = normalizeLayout(storedLayout);

    const storedText = JSON.stringify(storedLayout);
    const normalizedText = JSON.stringify(normalized);

    if (storedText !== normalizedText) {
      setLayout(normalized);
    }
  }, [storedLayout, setLayout]);

  const getCellMetrics = () => {
    const board = boardRef.current;
    if (!board) return null;

    const rect = board.getBoundingClientRect();
    const cellWidth = (rect.width - GAP * (COLS - 1)) / COLS;
    const stepX = cellWidth + GAP;
    const stepY = ROW_HEIGHT + GAP;

    return { stepX, stepY };
  };

  const updateItem = (candidate: GridItem) => {
    setLayout((prev) => {
      const normalized = normalizeLayout(prev);

      if (hasCollision(candidate, normalized)) return normalized;

      return normalized.map((item) =>
        item.id === candidate.id ? candidate : item
      );
    });
  };

  const moveItem = (id: WidgetId, dx: number, dy: number) => {
    const item = layout.find((currentItem) => currentItem.id === id);
    if (!item) return;

    const candidate: GridItem = {
      ...item,
      x: clamp(item.x + dx, 0, COLS - item.w),
      y: clamp(item.y + dy, 0, ROWS - item.h),
    };

    updateItem(candidate);
  };

  const resizeItem = (id: WidgetId, dw: number, dh: number) => {
    const item = layout.find((currentItem) => currentItem.id === id);
    if (!item) return;

    const candidate: GridItem = {
      ...item,
      w: clamp(item.w + dw, item.minW, COLS - item.x),
      h: clamp(item.h + dh, item.minH, ROWS - item.y),
    };

    updateItem(candidate);
  };

  const startMove = (event: PointerEvent<HTMLElement>, item: GridItem) => {
    if (!(editMode && tool === "move")) return;

    event.preventDefault();
    event.stopPropagation();

    setSelectedId(item.id);

    const metrics = getCellMetrics();
    if (!metrics) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startItem = { ...item };

    document.body.style.userSelect = "none";

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      const gx = Math.round(dx / metrics.stepX);
      const gy = Math.round(dy / metrics.stepY);

      const candidate: GridItem = {
        ...startItem,
        x: clamp(startItem.x + gx, 0, COLS - startItem.w),
        y: clamp(startItem.y + gy, 0, ROWS - startItem.h),
      };

      setLayout((prev) => {
        const normalized = normalizeLayout(prev);

        if (hasCollision(candidate, normalized)) return normalized;

        return normalized.map((currentItem) =>
          currentItem.id === candidate.id ? candidate : currentItem
        );
      });
    };

    const handlePointerUp = () => {
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const startResize = (event: PointerEvent<HTMLElement>, item: GridItem) => {
    if (!(editMode && tool === "resize")) return;

    event.preventDefault();
    event.stopPropagation();

    setSelectedId(item.id);

    const metrics = getCellMetrics();
    if (!metrics) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startItem = { ...item };

    document.body.style.userSelect = "none";

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      const dw = Math.round(dx / metrics.stepX);
      const dh = Math.round(dy / metrics.stepY);

      const candidate: GridItem = {
        ...startItem,
        w: clamp(startItem.w + dw, startItem.minW, COLS - startItem.x),
        h: clamp(startItem.h + dh, startItem.minH, ROWS - startItem.y),
      };

      setLayout((prev) => {
        const normalized = normalizeLayout(prev);

        if (hasCollision(candidate, normalized)) return normalized;

        return normalized.map((currentItem) =>
          currentItem.id === candidate.id ? candidate : currentItem
        );
      });
    };

    const handlePointerUp = () => {
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const startPanelDrag = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const startPos = { ...panelPos };

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      const nextX = startPos.x + (moveEvent.clientX - startX);
      const nextY = startPos.y + (moveEvent.clientY - startY);

      setPanelPos({
        x: clamp(nextX, 12, window.innerWidth - 360),
        y: clamp(nextY, 12, window.innerHeight - 180),
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div className="space-y-4">
      {editMode && (
        <div
          className="layout-floating-panel"
          style={{
            left: panelPos.x,
            top: panelPos.y,
          }}
        >
          <div
            className="layout-floating-panel-handle"
            onPointerDown={startPanelDrag}
          >
            <div className="flex items-center gap-2">
              <Move className="w-3.5 h-3.5" />
              <span>Layout Controller</span>
            </div>

            <span className="text-[10px] text-muted-foreground">
              drag me
            </span>
          </div>

          <div className="p-3 space-y-3">
            <div className="grid grid-cols-3 gap-1 rounded-full bg-white/35 border border-white/50 p-1">
              {(["content", "move", "resize"] as LayoutTool[]).map((mode) => {
                const label =
                  mode === "content"
                    ? "Select"
                    : mode === "move"
                      ? "Move"
                      : "Resize";

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTool(mode)}
                    className={cn(
                      "h-8 rounded-full text-xs capitalize transition",
                      tool === mode
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/45"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {selectedItem && (
              <div className="rounded-2xl bg-white/25 border border-white/40 p-3">
                <div className="text-sm font-medium">
                  {widgetLabels[selectedItem.id]}
                </div>

                <div className="text-xs text-muted-foreground mt-1">
                  x {selectedItem.x + 1}, y {selectedItem.y + 1}, w{" "}
                  {selectedItem.w}, h {selectedItem.h}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  <button
                    type="button"
                    onClick={() => moveItem(selectedItem.id, -1, 0)}
                    className="grid-tool-button"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveItem(selectedItem.id, 1, 0)}
                    className="grid-tool-button"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveItem(selectedItem.id, 0, -1)}
                    className="grid-tool-button"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveItem(selectedItem.id, 0, 1)}
                    className="grid-tool-button"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => resizeItem(selectedItem.id, -1, 0)}
                    className="grid-tool-button"
                  >
                    W-
                  </button>

                  <button
                    type="button"
                    onClick={() => resizeItem(selectedItem.id, 1, 0)}
                    className="grid-tool-button"
                  >
                    W+
                  </button>

                  <button
                    type="button"
                    onClick={() => resizeItem(selectedItem.id, 0, -1)}
                    className="grid-tool-button"
                  >
                    H-
                  </button>

                  <button
                    type="button"
                    onClick={() => resizeItem(selectedItem.id, 0, 1)}
                    className="grid-tool-button"
                  >
                    H+
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={resetValue}
              className="w-full h-9 rounded-full bg-white/35 border border-white/50 text-xs hover:bg-white/55 transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Grid
            </button>
          </div>
        </div>
      )}

      <div
        ref={boardRef}
        className={cn(
          "dashboard-grid-board",
          editMode && "dashboard-grid-editing",
          isLayoutTool && "dashboard-grid-locked-content",
          tool === "move" && "move-grid-mode",
          tool === "resize" && "resize-grid-mode"
        )}
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridAutoRows: `${ROW_HEIGHT}px`,
          gap: `${GAP}px`,
          minHeight: ROWS * ROW_HEIGHT + (ROWS - 1) * GAP,
        }}
      >
        {isLayoutTool && (
          <div
            className="dashboard-grid-guides"
            style={{
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${ROWS}, ${ROW_HEIGHT}px)`,
              gap: `${GAP}px`,
            }}
          >
            {Array.from({ length: COLS * ROWS }).map((_, index) => (
              <div key={index} className="dashboard-grid-cell" />
            ))}
          </div>
        )}

        {layout.map((item) => (
          <section
            key={item.id}
            onClick={() => {
              if (editMode) {
                setSelectedId(item.id);
              }
            }}
            onPointerDown={(event) => {
              if (tool === "move") {
                startMove(event, item);
              }

              if (tool === "resize") {
                startResize(event, item);
              }
            }}
            className={cn(
              "dashboard-grid-item",
              isLayoutTool && "layout-tool-item",
              selectedId === item.id && isLayoutTool && "is-selected"
            )}
            style={{
              gridColumn: `${item.x + 1} / span ${item.w}`,
              gridRow: `${item.y + 1} / span ${item.h}`,
            }}
          >
            <div
              className={cn(
                "dashboard-grid-item-content h-full",
                isLayoutTool && "is-muted-for-layout"
              )}
            >
              {widgetMap[item.id]}
            </div>

            {tool === "move" && selectedId === item.id && (
              <div className="layout-action-badge">
                Drag anywhere to move
              </div>
            )}

            {tool === "resize" && selectedId === item.id && (
              <div className="layout-action-badge">
                Drag anywhere to resize
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};