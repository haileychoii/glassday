/**
 * GLASSDAY - FREEFORM DIARY WORKSPACE
 *
 * EN: A small Whatt-inspired canvas for arranging existing widgets and notes.
 * KO: 기존 위젯과 짧은 메모를 한 화면에 배치하는 왓띵 스타일 캔버스다.
 *
 * Related files:
 * - DailyJournalWidget.tsx: date-based journal data and editing
 * - MemoWidget.tsx: memo editor and note storage
 * - WidgetSlot.tsx: keeps shared widget instances alive while moving them
 * - dashboard-grid.css: existing react-grid-layout visual foundation
 * - diary-workspace.css: canvas-specific styling
 *
 * The canvas layout is separate from DashboardTab.layouts. Moving a Diary item
 * therefore never changes the user's normal dashboard arrangement.
 */
import { CalendarDays, Grip, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Responsive } from "react-grid-layout/legacy";

import type { GridLayoutItem, Layouts } from "../../types/workspace";
import { WidgetSlot } from "./WidgetSlot";

const ResponsiveGridLayout = Responsive as unknown as ComponentType<
  Record<string, unknown>
>;

const DIARY_CANVAS_KEY = "glassday.diary.canvas.v1";

type DiaryCanvasItem = {
  i: string;
  kind: "journal" | "memo" | "note";
  text?: string;
};

type DiaryCanvasStorage = {
  items: DiaryCanvasItem[];
  layouts: Layouts;
};

const defaultItems: DiaryCanvasItem[] = [
  { i: "journal", kind: "journal" },
  { i: "memo", kind: "memo" },
];

const defaultLayouts: Layouts = {
  lg: [
    { i: "journal", x: 0, y: 0, w: 9, h: 11, minW: 5, minH: 6 },
    { i: "memo", x: 9, y: 0, w: 7, h: 8, minW: 4, minH: 5 },
  ],
  md: [
    { i: "journal", x: 0, y: 0, w: 9, h: 11, minW: 5, minH: 6 },
    { i: "memo", x: 9, y: 0, w: 7, h: 8, minW: 4, minH: 5 },
  ],
  sm: [
    { i: "journal", x: 0, y: 0, w: 16, h: 11, minW: 8, minH: 6 },
    { i: "memo", x: 0, y: 11, w: 16, h: 8, minW: 8, minH: 5 },
  ],
};

const createNoteId = () =>
  `diary-note-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isLayoutItem = (value: unknown): value is GridLayoutItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.i === "string" &&
    typeof item.x === "number" &&
    typeof item.y === "number" &&
    typeof item.w === "number" &&
    typeof item.h === "number"
  );
};

const readCanvasStorage = (): DiaryCanvasStorage => {
  if (typeof window === "undefined") {
    return { items: defaultItems, layouts: defaultLayouts };
  }

  try {
    const raw = window.localStorage.getItem(DIARY_CANVAS_KEY);
    if (!raw) return { items: defaultItems, layouts: defaultLayouts };

    const parsed = JSON.parse(raw) as Partial<DiaryCanvasStorage>;
    const items = Array.isArray(parsed.items)
      ? parsed.items.filter(
          (item): item is DiaryCanvasItem =>
            Boolean(item) &&
            typeof item.i === "string" &&
            ["journal", "memo", "note"].includes(item.kind)
        )
      : defaultItems;
    const layouts = parsed.layouts && typeof parsed.layouts === "object"
      ? Object.fromEntries(
          Object.entries(parsed.layouts).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.filter(isLayoutItem) : [],
          ])
        ) as Layouts
      : defaultLayouts;

    return {
      items: items.length > 0 ? items : defaultItems,
      layouts: Object.keys(layouts).length > 0 ? layouts : defaultLayouts,
    };
  } catch {
    return { items: defaultItems, layouts: defaultLayouts };
  }
};

/** A freeform Diary canvas with opt-in movement, resizing, and note blocks. */
export const DiaryWorkspace = () => {
  const initialStorage = useMemo(readCanvasStorage, []);
  const [items, setItems] = useState<DiaryCanvasItem[]>(initialStorage.items);
  const [layouts, setLayouts] = useState<Layouts>(initialStorage.layouts);
  const [editMode, setEditMode] = useState(false);
  const gridWidthRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(1080);

  useEffect(() => {
    window.localStorage.setItem(
      DIARY_CANVAS_KEY,
      JSON.stringify({ items, layouts } satisfies DiaryCanvasStorage)
    );
  }, [items, layouts]);

  useEffect(() => {
    if (!gridWidthRef.current) return;

    const updateWidth = () => {
      const nextWidth = gridWidthRef.current?.getBoundingClientRect().width ?? 1080;
      setWidth(Math.max(320, Math.floor(nextWidth)));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(gridWidthRef.current);
    return () => observer.disconnect();
  }, []);

  const addNote = () => {
    const id = createNoteId();
    setItems((current) => [
      ...current,
      { i: id, kind: "note", text: "새로운 기록" },
    ]);
    setLayouts((current) => ({
      ...current,
      lg: [...(current.lg ?? []), { i: id, x: 0, y: 12, w: 4, h: 4, minW: 3, minH: 3 }],
      md: [...(current.md ?? []), { i: id, x: 0, y: 12, w: 4, h: 4, minW: 3, minH: 3 }],
      sm: [...(current.sm ?? []), { i: id, x: 0, y: 20, w: 8, h: 4, minW: 6, minH: 3 }],
    }));
  };

  const updateNote = (id: string, text: string) => {
    setItems((current) =>
      current.map((item) => (item.i === id ? { ...item, text } : item))
    );
  };

  const removeNote = (id: string) => {
    setItems((current) => current.filter((item) => item.i !== id));
    setLayouts((current) =>
      Object.fromEntries(
        Object.entries(current).map(([key, layout]) => [
          key,
          layout.filter((item) => item.i !== id),
        ])
      ) as Layouts
    );
  };

  const handleLayoutChange = (nextLayouts: Layouts) => {
    if (editMode) setLayouts(nextLayouts);
  };

  return (
    <section className="diary-workspace" aria-label="Diary workspace">
      <header className="diary-workspace__header">
        <div className="diary-workspace__heading">
          <span className="diary-workspace__eyebrow">
            <Sparkles aria-hidden="true" /> Diary canvas
          </span>
          <h2>오늘을 내 방식으로 배치해</h2>
          <p>위젯을 옮기고 메모를 추가해서 나만의 기록 화면을 만들어 보세요.</p>
        </div>

        <div className="diary-workspace__actions">
          <button type="button" className="diary-workspace__action" onClick={addNote}>
            <Plus aria-hidden="true" /> 메모 추가
          </button>
          <button
            type="button"
            className={`diary-workspace__action ${editMode ? "is-active" : ""}`}
            onClick={() => setEditMode((current) => !current)}
            aria-pressed={editMode}
          >
            <Pencil aria-hidden="true" /> {editMode ? "배치 저장" : "배치 편집"}
          </button>
        </div>
      </header>

      <div ref={gridWidthRef} className={`diary-workspace__canvas ${editMode ? "is-editing" : ""}`}>
        <ResponsiveGridLayout
          className="diary-canvas-grid"
          layouts={layouts}
          breakpoints={{ lg: 980, md: 620, sm: 0 }}
          cols={{ lg: 16, md: 16, sm: 16 }}
          rowHeight={54}
          width={width}
          margin={[12, 12]}
          containerPadding={[0, 0]}
          compactType={null}
          preventCollision={false}
          allowOverlap={true}
          isDraggable={editMode}
          isResizable={editMode}
          onLayoutChange={handleLayoutChange}
        >
          {items.map((item) => (
            <div key={item.i} className={`diary-canvas-item diary-canvas-item--${item.kind}`}>
              {item.kind === "note" ? (
                <article className="diary-note-block">
                  <div className="diary-note-block__toolbar">
                    <Grip aria-hidden="true" />
                    <span>Quick note</span>
                    {editMode && (
                      <button type="button" onClick={() => removeNote(item.i)} aria-label="Delete note">
                        <Trash2 aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  {editMode ? (
                    <textarea
                      value={item.text ?? ""}
                      onChange={(event) => updateNote(item.i, event.target.value)}
                      aria-label="Diary quick note"
                    />
                  ) : (
                    <p>{item.text || "빈 메모"}</p>
                  )}
                </article>
              ) : (
                <WidgetSlot widgetId={item.i} />
              )}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>

      <div className="diary-workspace__footer">
        <CalendarDays aria-hidden="true" />
        <span>{items.length}개의 기록 블록을 배치할 수 있어요.</span>
        {!editMode && <span>배치 편집을 눌러 이동하거나 크기를 바꿔 보세요.</span>}
      </div>
    </section>
  );
};

