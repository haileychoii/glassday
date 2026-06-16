import { useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
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
  | "today"
  | "calendar"
  | "memo"
  | "study"
  | "career"
  | "health"
  | "money"
  | "mood";

type LayoutMode = "content" | "resize";

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

const STORAGE_KEY = "glassday.widget.grid-layout.v1";

const defaultGridLayout: GridItem[] = [
  { id: "today", x: 0, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
  { id: "calendar", x: 4, y: 0, w: 8, h: 5, minW: 4, minH: 3 },
  { id: "memo", x: 0, y: 3, w: 4, h: 3, minW: 3, minH: 2 },
  { id: "study", x: 0, y: 6, w: 4, h: 3, minW: 3, minH: 2 },
  { id: "career", x: 4, y: 5, w: 4, h: 3, minW: 3, minH: 2 },
  { id: "health", x: 8, y: 5, w: 2, h: 3, minW: 2, minH: 2 },
  { id: "money", x: 10, y: 5, w: 2, h: 3, minW: 2, minH: 2 },
  { id: "mood", x: 0, y: 9, w: 4, h: 3, minW: 3, minH: 2 },
];

const widgetMap: Record<WidgetId, ReactNode> = {
  today: <TodayFocusWidget />,
  calendar: <CalendarWidget />,
  memo: <MemoWidget />,
  study: <StudyWidget />,
  career: <CareerWidget />,
  health: <HealthWidget />,
  money: <MoneyWidget />,
  mood: <MoodWidget />,
};

const widgetLabels: Record<WidgetId, string> = {
  today: "Today Focus",
  calendar: "Calendar",
  memo: "Memo",
  study: "Study",
  career: "Career",
  health: "Health",
  money: "Money",
  mood: "Mood",
};

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

export const DashboardGrid = ({ editMode }: DashboardGridProps) => {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("content");
  const [selectedId, setSelectedId] = useState<WidgetId | null>("calendar");

  const {
    value: layout,
    setValue: setLayout,
    resetValue,
  } = useLocalStorage<GridItem[]>(STORAGE_KEY, defaultGridLayout);

  const isResizeMode = editMode && layoutMode === "resize";

  const selectedItem = selectedId
    ? layout.find((item) => item.id === selectedId)
    : null;

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
      if (hasCollision(candidate, prev)) return prev;

      return prev.map((item) =>
        item.id === candidate.id ? candidate : item
      );
    });
  };

  const resizeItem = (id: WidgetId, dw: number, dh: number) => {
    const item = layout.find((x) => x.id === id);
    if (!item) return;

    const candidate: GridItem = {
      ...item,
      w: clamp(item.w + dw, item.minW, COLS - item.x),
      h: clamp(item.h + dh, item.minH, ROWS - item.y),
    };

    updateItem(candidate);
  };

  const moveItem = (id: WidgetId, dx: number, dy: number) => {
    const item = layout.find((x) => x.id === id);
    if (!item) return;

    const candidate: GridItem = {
      ...item,
      x: clamp(item.x + dx, 0, COLS - item.w),
      y: clamp(item.y + dy, 0, ROWS - item.h),
    };

    updateItem(candidate);
  };

  const startResize = (
    event: PointerEvent<HTMLButtonElement>,
    item: GridItem
  ) => {
    if (!isResizeMode) return;

    event.preventDefault();
    event.stopPropagation();

    setSelectedId(item.id);

    const metrics = getCellMetrics();
    if (!metrics) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startItem = { ...item };

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
        if (hasCollision(candidate, prev)) return prev;

        return prev.map((x) =>
          x.id === candidate.id ? candidate : x
        );
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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white/25 border border-white/40 px-4 py-3 backdrop-blur-2xl">
          <div>
            <div className="text-sm font-medium">Layout Tools</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Content Mode edits data. Resize Mode adjusts widgets on a 12×12 grid.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-10 rounded-full bg-white/35 border border-white/50 p-1 flex items-center">
              <button
                type="button"
                onClick={() => setLayoutMode("content")}
                className={cn(
                  "h-8 px-3 rounded-full text-xs transition",
                  layoutMode === "content"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Content
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode("resize")}
                className={cn(
                  "h-8 px-3 rounded-full text-xs transition",
                  layoutMode === "resize"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Resize Grid
              </button>
            </div>

            <button
              type="button"
              onClick={resetValue}
              className="h-10 rounded-full bg-white/35 border border-white/50 px-3 text-xs hover:bg-white/55 transition flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Grid
            </button>
          </div>
        </div>
      )}

      {isResizeMode && selectedItem && (
        <div className="rounded-3xl bg-white/25 border border-white/40 px-4 py-3 backdrop-blur-2xl flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">
              Selected: {widgetLabels[selectedItem.id]}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              x {selectedItem.x + 1}, y {selectedItem.y + 1}, w {selectedItem.w}, h{" "}
              {selectedItem.h}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

      <div
        ref={boardRef}
        className={cn(
          "dashboard-grid-board",
          isResizeMode && "resize-grid-mode"
        )}
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridAutoRows: `${ROW_HEIGHT}px`,
          gap: `${GAP}px`,
          minHeight: ROWS * ROW_HEIGHT + (ROWS - 1) * GAP,
        }}
      >
        {isResizeMode && (
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
              if (isResizeMode) setSelectedId(item.id);
            }}
            className={cn(
              "dashboard-grid-item",
              isResizeMode && "cursor-pointer",
              selectedId === item.id && isResizeMode && "is-selected"
            )}
            style={{
              gridColumn: `${item.x + 1} / span ${item.w}`,
              gridRow: `${item.y + 1} / span ${item.h}`,
            }}
          >
            <div
              className={cn(
                "h-full",
                isResizeMode && "pointer-events-none select-none"
              )}
            >
              {widgetMap[item.id]}
            </div>

            {isResizeMode && (
              <button
                type="button"
                onPointerDown={(event) => startResize(event, item)}
                className="dashboard-resize-handle"
                aria-label={`Resize ${widgetLabels[item.id]}`}
              />
            )}
          </section>
        ))}
      </div>
    </div>
  );
};