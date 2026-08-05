/**
 * ============================================================
 * [Figma Mapping] Dashboard / Today Focus Widget
 * ============================================================
 *
 * 화면 역할: 오늘의 할 일, 일정, Career deadline, pinned Memo를 한곳에 요약한다.
 * 요약 항목을 선택하면 원본 Calendar/Career/Memo Widget과 detail로 이동한다.
 *
 * 연결:
 * - Renderer: src/components/grid/DashboardGrid.tsx (WidgetId: today)
 * - Shared Context: src/context/DashboardDataContext.tsx
 * - Local tasks: useLocalStorage / glassday.todayFocus.tasks.v1
 * - Cross-widget action: src/constants/widgetNavigation.ts
 * - Style: src/styles/widgets/today-focus.css, responsive.css, theme overrides
 *
 * Figma 구조: Hero Summary, Top Tasks, Linked Mini Lists, Pinned Memo, Alert State
 * Variants: Default / Empty / Has Urgent Item / Compact
 * ============================================================
 */
import { useMemo } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Circle,
  Pin,
  Plus,
  Sparkles,
  StickyNote,
  Trash2,
} from "lucide-react";

import { GlassCard } from "../glass/GlassCard";
import { useDashboardData } from "../../context/DashboardDataContext";
import {
  openCalendarEvent,
  openMemoNote,
  openWidget,
} from "../../constants/widgetNavigation";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";

type FocusTask = {
  id: string;
  text: string;
  done: boolean;
};

type MemoNotePreview = {
  id: string;
  title?: string;
  html?: string;
  pinned?: boolean;
  updatedAt?: number;
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `focus-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const defaultFocusTasks: FocusTask[] = [
  {
    id: "focus-1",
    text: "Check today’s calendar",
    done: false,
  },
  {
    id: "focus-2",
    text: "Review career deadlines",
    done: false,
  },
  {
    id: "focus-3",
    text: "Write one useful memo",
    done: false,
  },
];

const toLocalDateInput = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateDiff = (targetDate: string, baseDate: string) => {
  const target = new Date(`${targetDate}T00:00:00`).getTime();
  const base = new Date(`${baseDate}T00:00:00`).getTime();

  return Math.ceil((target - base) / (1000 * 60 * 60 * 24));
};

const stripHtml = (html = "") => {
  const temp = document.createElement("div");
  temp.innerHTML = html;

  return temp.innerText.replace(/\s+/g, " ").trim();
};

const getMemoTitle = (memo: MemoNotePreview) => {
  const plain = stripHtml(memo.html);
  const firstLine = plain.split(/\r?\n/).find(Boolean);

  return memo.title || firstLine || "Pinned memo";
};

const getMemoPreview = (memo: MemoNotePreview) => {
  const plain = stripHtml(memo.html);

  return plain || "No memo content yet.";
};

const readPinnedMemos = (): MemoNotePreview[] => {
  try {
    const rawV2 = localStorage.getItem("glassday.memo.notes.v2");
    const rawV1 = localStorage.getItem("glassday.memo.notes.v1");
    const raw = rawV2 || rawV1;

    if (!raw) return [];

    const parsed = JSON.parse(raw) as MemoNotePreview[];

    return parsed
      .filter((memo) => memo.pinned)
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  } catch {
    return [];
  }
};

/* Today Focus is a cross-widget summary surface.
   Each block here should either summarize local state or deep-link the user
   into the owning widget (calendar, career, memo). */
/** 자체 task와 다른 Widget의 공유 데이터를 함께 조합하는 Dashboard summary component. */
export const TodayFocusWidget = () => {
  const { calendarEvents, careerApplications, openCareerDetail } =
    useDashboardData();

  const today = toLocalDateInput();

  const { value: focusTasks, setValue: setFocusTasks } = useLocalStorage<
    FocusTask[]
  >("glassday.todayFocus.tasks.v1", defaultFocusTasks);

  const todayEvents = useMemo(() => {
    return calendarEvents
      .filter((event) => event.startDate <= today && event.endDate >= today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 4);
  }, [calendarEvents, today]);

  const urgentCareers = useMemo(() => {
    return careerApplications
      .map((item) => {
        const deadline =
          item.applicationEndDate || item.deadline || item.applicationStartDate;
        const dDay = deadline ? getDateDiff(deadline, today) : 999;

        return {
          ...item,
          deadline,
          dDay,
        };
      })
      .filter((item) => item.deadline && item.dDay >= 0 && item.dDay <= 7)
      .sort((a, b) => a.dDay - b.dDay)
      .slice(0, 4);
  }, [careerApplications, today]);

  const pinnedMemos = useMemo(() => readPinnedMemos().slice(0, 2), []);

  const completedTasks = focusTasks.filter((task) => task.done).length;
  const taskProgress =
    focusTasks.length > 0
      ? Math.round((completedTasks / focusTasks.length) * 100)
      : 0;

  const addTask = () => {
    setFocusTasks((prev) => [
      ...prev,
      {
        id: createId(),
        text: "New focus task",
        done: false,
      },
    ]);
  };

  const updateTask = (id: string, patch: Partial<FocusTask>) => {
    setFocusTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              ...patch,
            }
          : task
      )
    );
  };

  const removeTask = (id: string) => {
    setFocusTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleOpenCalendarItem = (eventId: string) => {
    openWidget({ widgetId: "calendar" });
    openCalendarEvent({ eventId });
  };

  const handleOpenCareerItem = (careerId: string) => {
    openCareerDetail(careerId);
    openWidget({ widgetId: "career", preferredTabId: "career" });
  };

  const handleOpenMemoItem = (noteId: string) => {
    openWidget({ widgetId: "memo", preferredTabId: "memo" });
    openMemoNote({ noteId });
  };

  return (
    <GlassCard
      className="today-focus-widget"
      title="Today Focus"
      subtitle={`${today} · ${taskProgress}% clear`}
      icon={<Sparkles className="w-4 h-4" />}
      actions={
        <button
          type="button"
          onClick={addTask}
          className="glass-button h-8 w-8 flex items-center justify-center"
          title="Add focus task"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      }
    >
      <div className="today-focus">
        {/* Figma Frame: Hero Summary / Horizontal Auto Layout / Space Between */}
        <section className="today-focus-hero">
          <div>
            <div className="today-focus-kicker">Today</div>
            <div className="today-focus-main">
              {todayEvents.length + urgentCareers.length > 0
                ? `${todayEvents.length + urgentCareers.length} things need attention`
                : "A clean day"}
            </div>
          </div>

          <div className="today-focus-ring">
            <span>{taskProgress}%</span>
          </div>
        </section>

        {/* Figma Frame: Top Tasks / Vertical Auto Layout / Editable Task Row list */}
        <section className="today-focus-section">
          <div className="today-focus-section-title">
            <Check className="w-3.5 h-3.5" />
            Top 3
          </div>

          <div className="today-focus-task-list">
            {focusTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className={cn("today-focus-task", task.done && "is-done")}
              >
                <button
                  type="button"
                  onClick={() =>
                    updateTask(task.id, {
                      done: !task.done,
                    })
                  }
                  className="today-focus-check"
                  aria-label={task.done ? "Mark task as incomplete" : "Mark task as complete"}
                  title={task.done ? "Mark as incomplete" : "Mark as complete"}
                >
                  {task.done ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                </button>

                <input
                  value={task.text}
                  onChange={(e) =>
                    updateTask(task.id, {
                      text: e.target.value,
                    })
                  }
                  spellCheck={false}
                  className="today-focus-task-input"
                  title={task.text || "Focus task"}
                />

                <button
                  type="button"
                  onClick={() => removeTask(task.id)}
                  className="today-focus-delete"
                  aria-label="Delete focus task"
                  title="Delete task"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Figma Frame: Linked Summaries / Responsive Grid / Calendar + Career */}
        <div className="today-focus-grid">
          <section className="today-focus-section">
            <div className="today-focus-section-title">
              <CalendarDays className="w-3.5 h-3.5" />
              Calendar
            </div>

            <div className="today-focus-mini-list">
              {todayEvents.length === 0 ? (
                <div className="today-focus-empty">No events today.</div>
              ) : (
                todayEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => handleOpenCalendarItem(event.id)}
                    className="today-focus-mini-item is-clickable"
                  >
                    <span
                      className="today-focus-color"
                      style={{
                        backgroundColor: event.color || "#DCEBFF",
                      }}
                    />
                    <div className="min-w-0">
                      <strong>{event.title}</strong>
                      <span>
                        {event.startTime}–{event.endTime}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="today-focus-section">
            <div className="today-focus-section-title">
              <BriefcaseBusiness className="w-3.5 h-3.5" />
              Career
            </div>

            <div className="today-focus-mini-list">
              {urgentCareers.length === 0 ? (
                <div className="today-focus-empty">No urgent deadline.</div>
              ) : (
                urgentCareers.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleOpenCareerItem(item.id)}
                    className="today-focus-career-item is-clickable"
                  >
                    <div className="min-w-0">
                      <strong>{item.company}</strong>
                      <span>{item.role}</span>
                    </div>

                    <div
                      className={cn(
                        "today-focus-dday",
                        item.dDay <= 1 && "is-danger"
                      )}
                    >
                      {item.dDay === 0 ? "D-Day" : `D-${item.dDay}`}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="today-focus-section">
          <div className="today-focus-section-title">
            <Pin className="w-3.5 h-3.5" />
            Pinned Memo
          </div>

          <div className="today-focus-memo-list">
            {pinnedMemos.length === 0 ? (
              <div className="today-focus-empty">
                Pin a memo to show it here.
              </div>
            ) : (
              pinnedMemos.map((memo) => (
                <button
                  key={memo.id}
                  type="button"
                  onClick={() => handleOpenMemoItem(memo.id)}
                  className="today-focus-memo is-clickable"
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  <div className="min-w-0">
                    <strong>{getMemoTitle(memo)}</strong>
                    <span>{getMemoPreview(memo)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {(todayEvents.length > 0 || urgentCareers.some((item) => item.dDay <= 1)) && (
          <div className="today-focus-alert">
            <AlertCircle className="w-3.5 h-3.5" />
            {urgentCareers.some((item) => item.dDay === 0)
              ? "Some applications close today."
              : "You have something scheduled today."}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
