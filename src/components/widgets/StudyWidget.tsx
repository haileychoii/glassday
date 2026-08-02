import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  FormEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  BookOpenCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleStop,
  Eraser,
  Maximize2,
  Play,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";
import {
  STUDY_END_HOUR,
  STUDY_PLANNER_STORAGE_KEY,
  STUDY_PLANNER_SUBJECTS,
  STUDY_SLOT_MINUTES,
  STUDY_SLOTS_PER_HOUR,
  STUDY_START_HOUR,
} from "../../constants/study";
import type {
  StudyDayData,
  StudyPlannerStorage,
  StudyPlannerSubjectId,
  StudyPlannerTask,
} from "../../types/study";
import {
  addDays,
  createId,
  createInitialStudyPlannerStorage,
  formatClockMinutes,
  formatElapsedTimer,
  formatStudyDate,
  formatStudyMinutes,
  getStudyDay,
  getStudyPlannerSubjectTotals,
  getStudyPlannerTotalMinutes,
  getTimerSlotIndexes,
  normalizeStudyPlannerStorage,
  toLocalDateInput,
} from "./study/studyUtils";
import { StudyDetailWindow } from "./study/StudyDetailWindow";

type StudyPaintTool = StudyPlannerSubjectId | "erase";
type StudyPlannerMode = "widget" | "detail";

const HOURS = Array.from(
  { length: STUDY_END_HOUR - STUDY_START_HOUR },
  (_, index) => STUDY_START_HOUR + index
);

const getSubject = (subjectId: StudyPlannerSubjectId) =>
  STUDY_PLANNER_SUBJECTS.find((subject) => subject.id === subjectId) ??
  STUDY_PLANNER_SUBJECTS[0];

const getSubjectStyle = (color: string) =>
  ({ "--study-subject-color": color } as CSSProperties);

/* Ten-minute study planner
   One durable v2 storage object contains every date plus the active timer.
   Widget and floating detail layouts render from the same state, which keeps
   Wide/Laptop modes and cloud snapshots consistent. / 날짜별 시간표, 할 일,
   목표, 메모는 모두 기존 useLocalStorage 경로를 통해 한 번만 저장됩니다. */
export const StudyWidget = () => {
  const today = toLocalDateInput();
  const initialPlanner = useMemo(() => createInitialStudyPlannerStorage(), []);
  const { value: storedPlanner, setValue: setStoredPlanner } =
    useLocalStorage<StudyPlannerStorage>(
      STUDY_PLANNER_STORAGE_KEY,
      initialPlanner
    );
  const planner = useMemo(
    () => normalizeStudyPlannerStorage(storedPlanner),
    [storedPlanner]
  );

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTool, setSelectedTool] =
    useState<StudyPaintTool>("economics");
  const [taskSubjectId, setTaskSubjectId] =
    useState<StudyPlannerSubjectId>("economics");
  const [taskText, setTaskText] = useState("");
  const [taskEstimate, setTaskEstimate] = useState("30");
  const [detailOpen, setDetailOpen] = useState(false);
  const [timerNow, setTimerNow] = useState(Date.now());

  const paintingRef = useRef(false);
  const paintToolRef = useRef<StudyPaintTool>(selectedTool);
  const lastPaintedSlotRef = useRef<number | null>(null);

  const selectedDay = useMemo(
    () => getStudyDay(planner, selectedDate),
    [planner, selectedDate]
  );
  const totalMinutes = useMemo(
    () => getStudyPlannerTotalMinutes(selectedDay),
    [selectedDay]
  );
  const subjectTotals = useMemo(
    () => getStudyPlannerSubjectTotals(selectedDay),
    [selectedDay]
  );
  const progress = Math.min(
    100,
    Math.round((totalMinutes / Math.max(selectedDay.goalMinutes, 1)) * 100)
  );
  const completedTasks = selectedDay.tasks.filter((task) => task.done).length;
  const activeTimer = planner.activeTimer;
  const timerSeconds = activeTimer
    ? Math.max(0, Math.floor((timerNow - activeTimer.startedAt) / 1000))
    : 0;

  /* Date updater
     All date-level edits pass through this helper, so updatedAt and v2 shape
     are applied consistently. / 새 필드를 추가할 때도 이 함수 안에서 하루
     데이터를 갱신하면 저장 형식이 흐트러지지 않습니다. */
  const updateDay = useCallback(
    (date: string, updater: (day: StudyDayData) => StudyDayData) => {
      setStoredPlanner((current) => {
        const normalized = normalizeStudyPlannerStorage(current);
        const currentDay = getStudyDay(normalized, date);
        const nextDay = updater(currentDay);

        return {
          ...normalized,
          days: {
            ...normalized.days,
            [date]: {
              ...nextDay,
              updatedAt: Date.now(),
            },
          },
        };
      });
    },
    [setStoredPlanner]
  );

  useEffect(() => {
    paintToolRef.current = selectedTool;
  }, [selectedTool]);

  useEffect(() => {
    window.dispatchEvent(new Event("glassday:study-updated"));
  }, [storedPlanner]);

  useEffect(() => {
    if (!activeTimer) return;

    setTimerNow(Date.now());
    const timerId = window.setInterval(() => setTimerNow(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, [activeTimer]);

  useEffect(() => {
    if (!activeTimer || activeTimer.date === today) return;

    setStoredPlanner((current) => ({
      ...normalizeStudyPlannerStorage(current),
      activeTimer: null,
    }));
  }, [activeTimer, setStoredPlanner, today]);

  const paintSlot = useCallback(
    (slotIndex: number, tool = paintToolRef.current) => {
      if (lastPaintedSlotRef.current === slotIndex) return;
      lastPaintedSlotRef.current = slotIndex;

      updateDay(selectedDate, (day) => {
        const slotKey = String(slotIndex);
        const nextBlocks = { ...day.blocks };

        if (tool === "erase") {
          if (!(slotKey in nextBlocks)) return day;
          delete nextBlocks[slotKey];
        } else {
          if (nextBlocks[slotKey] === tool) return day;
          nextBlocks[slotKey] = tool;
        }

        return { ...day, blocks: nextBlocks };
      });
    },
    [selectedDate, updateDay]
  );

  /* Pointer painting
     elementFromPoint lets one implementation handle mouse drag and touch drag
     even when the pointer crosses many buttons quickly. / 셀 자체는 그리기
     동작을 우선하고, 시간표 패널의 스크롤바로 긴 시간을 이동합니다. */
  useEffect(() => {
    const finishPainting = () => {
      paintingRef.current = false;
      lastPaintedSlotRef.current = null;
    };

    const continuePainting = (event: PointerEvent) => {
      if (!paintingRef.current) return;
      event.preventDefault();

      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLButtonElement>("[data-study-slot-index]");
      const slotIndex = Number(target?.dataset.studySlotIndex);
      if (Number.isInteger(slotIndex)) paintSlot(slotIndex);
    };

    window.addEventListener("pointermove", continuePainting, { passive: false });
    window.addEventListener("pointerup", finishPainting);
    window.addEventListener("pointercancel", finishPainting);

    return () => {
      window.removeEventListener("pointermove", continuePainting);
      window.removeEventListener("pointerup", finishPainting);
      window.removeEventListener("pointercancel", finishPainting);
    };
  }, [paintSlot]);

  const beginPainting = (
    event: ReactPointerEvent<HTMLButtonElement>,
    slotIndex: number
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    paintingRef.current = true;
    lastPaintedSlotRef.current = null;
    paintSlot(slotIndex);
  };

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = taskText.trim();
    if (!text) return;

    const task: StudyPlannerTask = {
      id: createId("study-task"),
      subjectId: taskSubjectId,
      text,
      estimatedMinutes: Math.max(
        STUDY_SLOT_MINUTES,
        Math.round((Number(taskEstimate) || 30) / STUDY_SLOT_MINUTES) *
          STUDY_SLOT_MINUTES
      ),
      done: false,
      createdAt: Date.now(),
    };

    updateDay(selectedDate, (day) => ({
      ...day,
      tasks: [...day.tasks, task],
    }));
    setTaskText("");
  };

  const updateTask = (taskId: string, patch: Partial<StudyPlannerTask>) => {
    updateDay(selectedDate, (day) => ({
      ...day,
      tasks: day.tasks.map((task) =>
        task.id === taskId ? { ...task, ...patch } : task
      ),
    }));
  };

  const removeTask = (taskId: string) => {
    updateDay(selectedDate, (day) => ({
      ...day,
      tasks: day.tasks.filter((task) => task.id !== taskId),
    }));
  };

  const startTimer = () => {
    if (selectedDate !== today) {
      window.alert("실시간 타이머는 오늘 날짜에서만 사용할 수 있어요.");
      return;
    }
    if (selectedTool === "erase") {
      window.alert("타이머를 시작할 과목을 먼저 선택해 주세요.");
      return;
    }

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (
      nowMinutes < STUDY_START_HOUR * 60 ||
      nowMinutes >= STUDY_END_HOUR * 60
    ) {
      window.alert("타이머 기록 시간은 오전 6시부터 자정까지예요.");
      return;
    }

    setStoredPlanner((current) => ({
      ...normalizeStudyPlannerStorage(current),
      activeTimer: {
        date: today,
        subjectId: selectedTool,
        startedAt: Date.now(),
      },
    }));
  };

  const stopTimer = () => {
    if (!activeTimer) return;

    const endedAt = Date.now();
    const slotIndexes = getTimerSlotIndexes(activeTimer, endedAt);
    if (slotIndexes.length === 0) {
      window.alert("오전 6시부터 자정 사이에 기록할 시간이 없어요.");
      setStoredPlanner((current) => ({
        ...normalizeStudyPlannerStorage(current),
        activeTimer: null,
      }));
      return;
    }

    const timerDay = getStudyDay(planner, activeTimer.date);
    const conflicts = slotIndexes.filter((slotIndex) => {
      const existing = timerDay.blocks[String(slotIndex)];
      return existing && existing !== activeTimer.subjectId;
    });

    if (
      conflicts.length > 0 &&
      !window.confirm(
        `${conflicts.length}개의 10분 칸에 다른 과목이 있어요. 현재 타이머 과목으로 덮어쓸까요?`
      )
    ) {
      return;
    }

    setStoredPlanner((current) => {
      const normalized = normalizeStudyPlannerStorage(current);
      const day = getStudyDay(normalized, activeTimer.date);
      const blocks = { ...day.blocks };
      slotIndexes.forEach((slotIndex) => {
        blocks[String(slotIndex)] = activeTimer.subjectId;
      });

      return {
        ...normalized,
        days: {
          ...normalized.days,
          [activeTimer.date]: {
            ...day,
            blocks,
            updatedAt: Date.now(),
          },
        },
        activeTimer: null,
      };
    });
  };

  const clearTimeline = () => {
    if (
      Object.keys(selectedDay.blocks).length > 0 &&
      !window.confirm("선택한 날짜의 10분 기록을 모두 지울까요?")
    ) {
      return;
    }
    updateDay(selectedDate, (day) => ({ ...day, blocks: {} }));
  };

  const renderPlanner = (mode: StudyPlannerMode) => {
    const idPrefix = `study10-${mode}`;

    return (
      <div className={cn("study10-planner", `study10-planner--${mode}`)}>
        {/* Summary strip: the same compact metrics anchor every container size. */}
        <section className="study10-summary" aria-label="Study summary">
          <div className="study10-summary-card">
            <span>오늘 공부</span>
            <strong>{formatStudyMinutes(totalMinutes)}</strong>
          </div>
          <div className="study10-summary-card">
            <span>할 일</span>
            <strong>
              {completedTasks}/{selectedDay.tasks.length}
            </strong>
          </div>
          <div className="study10-summary-card study10-summary-card--goal">
            <label htmlFor={`${idPrefix}-goal`}>목표</label>
            <div className="study10-goal-line">
              <input
                id={`${idPrefix}-goal`}
                type="number"
                min={10}
                step={10}
                value={selectedDay.goalMinutes}
                onChange={(event) =>
                  updateDay(selectedDate, (day) => ({
                    ...day,
                    goalMinutes: Math.max(10, Number(event.target.value) || 10),
                  }))
                }
                aria-label="Daily study goal in minutes"
              />
              <strong>{progress}%</strong>
            </div>
            <div className="study10-progress" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        </section>

        {/* Date navigation remains visible above all scrollable planner content. */}
        <section className="study10-date-bar" aria-label="Study date">
          <button
            type="button"
            className="study10-icon-button"
            onClick={() => setSelectedDate((date) => addDays(date, -1))}
            aria-label="Previous date"
          >
            <ChevronLeft />
          </button>
          <label className="study10-date-control">
            <span>{formatStudyDate(selectedDate)}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              aria-label="Select study date"
            />
          </label>
          <button
            type="button"
            className="study10-today-button"
            onClick={() => setSelectedDate(today)}
            disabled={selectedDate === today}
          >
            오늘
          </button>
          <button
            type="button"
            className="study10-icon-button"
            onClick={() => setSelectedDate((date) => addDays(date, 1))}
            aria-label="Next date"
          >
            <ChevronRight />
          </button>
        </section>

        {/* Subject tools and real-time timer share one compact control band. */}
        <section className="study10-control-band">
          <div className="study10-subject-tools" aria-label="Study subjects">
            {STUDY_PLANNER_SUBJECTS.map((subject) => (
              <button
                key={subject.id}
                type="button"
                className={cn(
                  "study10-subject-tool",
                  selectedTool === subject.id && "is-active"
                )}
                style={getSubjectStyle(subject.color)}
                onClick={() => setSelectedTool(subject.id)}
                aria-pressed={selectedTool === subject.id}
                title={`${subject.label} · ${formatStudyMinutes(
                  subjectTotals[subject.id]
                )}`}
              >
                <span className="study10-subject-dot" />
                <span>{subject.shortLabel}</span>
                <small>{formatStudyMinutes(subjectTotals[subject.id])}</small>
              </button>
            ))}
            <button
              type="button"
              className={cn(
                "study10-subject-tool study10-eraser-tool",
                selectedTool === "erase" && "is-active"
              )}
              onClick={() => setSelectedTool("erase")}
              aria-pressed={selectedTool === "erase"}
            >
              <Eraser />
              <span>지우개</span>
            </button>
          </div>

          <div className={cn("study10-timer", activeTimer && "is-running")}>
            <div className="study10-timer-copy">
              <span>{activeTimer ? getSubject(activeTimer.subjectId).label : "실시간 기록"}</span>
              <strong>
                {activeTimer ? formatElapsedTimer(timerSeconds) : "00:00:00"}
              </strong>
            </div>
            <button
              type="button"
              className="study10-timer-button"
              onClick={activeTimer ? stopTimer : startTimer}
              aria-label={activeTimer ? "Stop study timer" : "Start study timer"}
              disabled={!activeTimer && selectedDate !== today}
            >
              {activeTimer ? <CircleStop /> : <Play />}
              <span>{activeTimer ? "종료" : "시작"}</span>
            </button>
          </div>
        </section>

        <div className="study10-workspace">
          {/* Timeline: 18 hour rows x six 10-minute cells. */}
          <section className="study10-panel study10-timeline-panel">
            <div className="study10-panel-heading">
              <div>
                <span>10분 시간표</span>
                <small>06:00–24:00</small>
              </div>
              <button
                type="button"
                className="study10-icon-button"
                onClick={clearTimeline}
                aria-label="Clear selected date timeline"
                title="시간표 지우기"
              >
                <RotateCcw />
              </button>
            </div>

            <div className="study10-timeline-scroll">
              <div className="study10-minute-head" aria-hidden="true">
                <span />
                {[0, 10, 20, 30, 40, 50].map((minute) => (
                  <span key={minute}>{String(minute).padStart(2, "0")}</span>
                ))}
              </div>
              <div className="study10-timeline-grid">
                {HOURS.map((hour, hourIndex) => (
                  <div className="study10-hour-row" key={hour}>
                    <span className="study10-hour-label">
                      {String(hour).padStart(2, "0")}
                    </span>
                    {Array.from({ length: STUDY_SLOTS_PER_HOUR }, (_, slot) => {
                      const slotIndex =
                        hourIndex * STUDY_SLOTS_PER_HOUR + slot;
                      const subjectId = selectedDay.blocks[String(slotIndex)];
                      const subject = subjectId ? getSubject(subjectId) : null;
                      const startMinutes =
                        STUDY_START_HOUR * 60 +
                        slotIndex * STUDY_SLOT_MINUTES;
                      const label = `${formatClockMinutes(
                        startMinutes
                      )}–${formatClockMinutes(
                        startMinutes + STUDY_SLOT_MINUTES
                      )} · ${subject?.label ?? "미기록"}`;

                      return (
                        <button
                          key={slotIndex}
                          type="button"
                          className={cn(
                            "study10-slot",
                            subject && "is-filled"
                          )}
                          style={
                            subject
                              ? getSubjectStyle(subject.color)
                              : undefined
                          }
                          data-study-slot-index={slotIndex}
                          onPointerDown={(event) =>
                            beginPainting(event, slotIndex)
                          }
                          onPointerEnter={() => {
                            if (paintingRef.current) paintSlot(slotIndex);
                          }}
                          aria-label={label}
                          aria-pressed={Boolean(subject)}
                          title={label}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="study10-side-stack">
            {/* Tasks: subject, text and estimate stay in one semantic form. */}
            <section className="study10-panel study10-task-panel">
              <div className="study10-panel-heading">
                <div>
                  <span>오늘 할 일</span>
                  <small>{completedTasks}/{selectedDay.tasks.length} 완료</small>
                </div>
              </div>

              <form className="study10-task-form" onSubmit={addTask}>
                <select
                  value={taskSubjectId}
                  onChange={(event) =>
                    setTaskSubjectId(event.target.value as StudyPlannerSubjectId)
                  }
                  aria-label="Task subject"
                >
                  {STUDY_PLANNER_SUBJECTS.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.label}
                    </option>
                  ))}
                </select>
                <input
                  value={taskText}
                  onChange={(event) => setTaskText(event.target.value)}
                  placeholder="공부할 내용"
                  aria-label="Study task"
                />
                <label className="study10-estimate-input">
                  <input
                    type="number"
                    min={10}
                    step={10}
                    value={taskEstimate}
                    onChange={(event) => setTaskEstimate(event.target.value)}
                    aria-label="Estimated minutes"
                  />
                  <span>분</span>
                </label>
                <button
                  type="submit"
                  className="study10-add-button"
                  aria-label="Add study task"
                >
                  <Plus />
                  <span>추가</span>
                </button>
              </form>

              <div className="study10-task-list">
                {selectedDay.tasks.length === 0 ? (
                  <p className="study10-empty">오늘 할 일을 추가해 보세요.</p>
                ) : (
                  selectedDay.tasks.map((task) => {
                    const subject = getSubject(task.subjectId);
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "study10-task-row",
                          task.done && "is-done"
                        )}
                        style={getSubjectStyle(subject.color)}
                      >
                        <button
                          type="button"
                          className="study10-task-check"
                          onClick={() =>
                            updateTask(task.id, { done: !task.done })
                          }
                          aria-label={
                            task.done ? "Mark task incomplete" : "Complete task"
                          }
                          aria-pressed={task.done}
                        >
                          {task.done && <Check />}
                        </button>
                        <span className="study10-task-color" />
                        <div className="study10-task-copy">
                          <strong>{task.text}</strong>
                          <small>
                            {subject.label} · {formatStudyMinutes(task.estimatedMinutes)}
                          </small>
                        </div>
                        <button
                          type="button"
                          className="study10-task-delete"
                          onClick={() => removeTask(task.id)}
                          aria-label={`Delete ${task.text}`}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Daily note follows the selected date and grows only inside its panel. */}
            <section className="study10-panel study10-note-panel">
              <div className="study10-panel-heading">
                <div>
                  <span>오늘 메모</span>
                  <small>막힌 부분 · 내일 복습 · 컨디션</small>
                </div>
              </div>
              <textarea
                value={selectedDay.note}
                onChange={(event) =>
                  updateDay(selectedDate, (day) => ({
                    ...day,
                    note: event.target.value,
                  }))
                }
                placeholder="짧게 기록해 두면 내일 바로 이어갈 수 있어요."
                aria-label="Daily study note"
              />
            </section>

            {(selectedDay.legacyRecords?.length ?? 0) > 0 && (
              <section className="study10-legacy-note">
                이전 Study 기록 {formatStudyMinutes(
                  selectedDay.legacyRecords?.reduce(
                    (sum, record) => sum + record.minutes,
                    0
                  ) ?? 0
                )}이 오늘 합계에 포함되어 있어요.
              </section>
            )}
          </aside>
        </div>
      </div>
    );
  };

  return (
    <>
      <GlassCard
        className="study-widget"
        title="Study Planner"
        subtitle={`${formatStudyMinutes(totalMinutes)} · 목표 ${progress}%`}
        icon={<BookOpenCheck className="w-4 h-4" />}
        actions={
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="glass-button h-8 w-8 flex items-center justify-center"
            title="Open study planner"
            aria-label="Open study planner detail window"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        }
      >
        {renderPlanner("widget")}
      </GlassCard>

      <StudyDetailWindow
        open={detailOpen}
        subtitle={`${formatStudyDate(selectedDate)} · ${formatStudyMinutes(
          totalMinutes
        )}`}
        onClose={() => setDetailOpen(false)}
      >
        {renderPlanner("detail")}
      </StudyDetailWindow>
    </>
  );
};
