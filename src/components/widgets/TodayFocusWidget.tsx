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

export const TodayFocusWidget = () => {
  const { calendarEvents, careerApplications } = useDashboardData();

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

  return (
    <GlassCard
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
                />

                <button
                  type="button"
                  onClick={() => removeTask(task.id)}
                  className="today-focus-delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </section>

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
                  <div key={event.id} className="today-focus-mini-item">
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
                  </div>
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
                  <div key={item.id} className="today-focus-career-item">
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
                  </div>
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
                <div key={memo.id} className="today-focus-memo">
                  <StickyNote className="w-3.5 h-3.5" />
                  <div className="min-w-0">
                    <strong>{getMemoTitle(memo)}</strong>
                    <span>{getMemoPreview(memo)}</span>
                  </div>
                </div>
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