/**
 * ============================================================
 * [Figma Mapping] Dashboard / Study 10-minute Planner
 * ============================================================
 *
 * 화면 역할:
 * - 06:00~24:00 timeline에 10분 단위 실제 공부 기록을 과목 색상으로 칠한다.
 * - 날짜별 goal, task, memo와 오늘 실시간 timer를 같은 planner record로 관리한다.
 *
 * 연결:
 * - Renderer: DashboardGrid (WidgetId: study)
 * - Constants/Types: src/constants/study.ts, src/types/study.ts
 * - Persistence/Migration: useLocalStorage, studyUtils,
 *   glassday.study.planner.v2 및 legacy v1 key
 * - Detail shell: src/components/widgets/study/StudyDetailWindow.tsx
 * - Style: src/styles/widgets/study.css + theme/responsive overrides
 *
 * Figma 구조:
 * - Summary, Date Navigation, Subject/Timer Controls, 10-minute Timeline,
 *   Subject Totals, Tasks, Memo
 * - Variants: Widget / Detail / Timer Active / Paint Subject / Eraser / Empty
 *
 * 반응형: 같은 renderPlanner tree에 mode class를 적용하며 Widget container 기준으로 재배치한다.
 * ============================================================
 */
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
import { createPortal } from "react-dom";
import {
  BookOpenCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleStop,
  Eraser,
  Lock,
  Maximize2,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Undo2,
  Unlock,
  X,
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
type StudySubjectDraft = {
  subjectId: StudyPlannerSubjectId | null;
  name: string;
  color: string;
  note: string;
  isNew: boolean;
};

const HOURS = Array.from(
  { length: STUDY_END_HOUR - STUDY_START_HOUR },
  (_, index) => STUDY_START_HOUR + index
);

const getSubjectStyle = (color: string) =>
  ({ "--study-subject-color": color } as CSSProperties);

/**
 * StudyWidget
 * Widget/Detail이 하나의 v2 storage를 공유해 Wide/Laptop에서도 동일한 학습 기록을 본다.
 * pointer drag painting과 timer 종료가 모두 StudyDayData.blocks를 갱신한다.
 */
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
  /* Subject catalog view model
     Durable IDs stay separate from editable labels/colors. Custom subjects and
     defaults therefore use the same timeline/task rendering path. / 과목명을
     바꿔도 기존 시간표 block은 안정적인 id를 계속 참조합니다. */
  const subjects = useMemo(
    () =>
      [...STUDY_PLANNER_SUBJECTS, ...planner.customSubjects].map((subject) => {
        const setting = planner.subjectSettings[subject.id];
        const label = setting?.label?.trim() || subject.label;

        return {
          ...subject,
          label,
          shortLabel: label,
          color:
            setting?.color ??
            planner.subjectColors[subject.id] ??
            subject.color,
        };
      }),
    [
      planner.customSubjects,
      planner.subjectColors,
      planner.subjectSettings,
    ]
  );
  const getSubject = useCallback(
    (subjectId: StudyPlannerSubjectId) =>
      subjects.find((subject) => subject.id === subjectId) ?? subjects[0],
    [subjects]
  );

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTool, setSelectedTool] =
    useState<StudyPaintTool>("economics");
  const [taskSubjectId, setTaskSubjectId] =
    useState<StudyPlannerSubjectId>("economics");
  const [taskText, setTaskText] = useState("");
  const [taskEstimate, setTaskEstimate] = useState("30");
  const [detailOpen, setDetailOpen] = useState(false);
  const [timerNow, setTimerNow] = useState(() => Date.now());
  const [subjectDraft, setSubjectDraft] = useState<StudySubjectDraft | null>(
    null
  );
  const [isTimelineLocked, setIsTimelineLocked] = useState(false);
  const [timelineHistory, setTimelineHistory] = useState<
    Array<Record<string, StudyPlannerSubjectId>>
  >([]);

  const paintingRef = useRef(false);
  const paintToolRef = useRef<StudyPaintTool>(selectedTool);
  const paintedSlotsRef = useRef<Set<number>>(new Set());

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
  const allTimeSubjectTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.values(planner.days).forEach((day) => {
      const dayTotals = getStudyPlannerSubjectTotals(day);
      Object.entries(dayTotals).forEach(([subjectId, minutes]) => {
        totals[subjectId] = (totals[subjectId] ?? 0) + minutes;
      });
    });
    return totals;
  }, [planner.days]);
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

  /* Subject editor
     A first chip click selects a paint subject; clicking the selected chip
     again opens this draft. Closing by X, outside click, or Apply uses the same
     commit path. / 팝오버를 닫는 방식과 관계없이 변경사항이 동일하게 저장된다. */
  const openSubjectEditor = useCallback(
    (subjectId: StudyPlannerSubjectId) => {
      const subject = getSubject(subjectId);
      setSubjectDraft({
        subjectId,
        name: subject.label,
        color: subject.color,
        note: planner.subjectSettings[subjectId]?.note ?? "",
        isNew: false,
      });
    },
    [getSubject, planner.subjectSettings]
  );

  const openNewSubjectEditor = () => {
    setSubjectDraft({
      subjectId: null,
      name: "",
      color: "#BEE1E6",
      note: "",
      isNew: true,
    });
  };

  const commitSubjectDraft = useCallback(() => {
    if (!subjectDraft) return;

    const currentSubject = subjectDraft.subjectId
      ? subjects.find((subject) => subject.id === subjectDraft.subjectId)
      : null;
    const name =
      subjectDraft.name.trim().slice(0, 24) || currentSubject?.label || "";

    /* Empty new drafts are treated as cancel, while an existing subject keeps
       its previous name. / 실수로 빈 과목이 추가되는 것을 막는다. */
    if (!name) {
      setSubjectDraft(null);
      return;
    }

    const subjectId =
      subjectDraft.subjectId ??
      (`custom-${createId("study-subject")}` as StudyPlannerSubjectId);
    const color = subjectDraft.color.toUpperCase();

    setStoredPlanner((current) => {
      const normalized = normalizeStudyPlannerStorage(current);
      const alreadyExists = normalized.customSubjects.some(
        (subject) => subject.id === subjectId
      );

      return {
        ...normalized,
        subjectColors: {
          ...normalized.subjectColors,
          [subjectId]: color,
        },
        subjectSettings: {
          ...normalized.subjectSettings,
          [subjectId]: {
            label: name,
            color,
            note: subjectDraft.note,
          },
        },
        customSubjects:
          subjectDraft.isNew && !alreadyExists
            ? [
                ...normalized.customSubjects,
                {
                  id: subjectId,
                  label: name,
                  shortLabel: name,
                  color,
                },
              ]
            : normalized.customSubjects,
      };
    });

    setSelectedTool(subjectId);
    setTaskSubjectId(subjectId);
    setSubjectDraft(null);
  }, [setStoredPlanner, subjectDraft, subjects]);

  useEffect(() => {
    paintToolRef.current = selectedTool;
  }, [selectedTool]);

  useEffect(() => {
    const resetId = window.setTimeout(() => {
      setTimelineHistory([]);
    }, 0);
    paintingRef.current = false;
    paintedSlotsRef.current.clear();

    return () => window.clearTimeout(resetId);
  }, [selectedDate]);

  /* Persist the migration immediately.
     useLocalStorage does not write its initial value until the first edit, so
     this one-time bridge makes migrated v1 records available to cloud backup
     and Alert Center even before the user paints a cell. / 첫 편집을 기다리지
     않고 v2 키를 생성하되 기존 v1 키는 삭제하지 않습니다. */
  useEffect(() => {
    if (window.localStorage.getItem(STUDY_PLANNER_STORAGE_KEY) !== null) return;
    setStoredPlanner(initialPlanner);
  }, [initialPlanner, setStoredPlanner]);

  useEffect(() => {
    window.dispatchEvent(new Event("glassday:study-updated"));
  }, [storedPlanner]);

  useEffect(() => {
    if (!activeTimer) return;

    const syncNowId = window.setTimeout(() => setTimerNow(Date.now()), 0);
    const timerId = window.setInterval(() => setTimerNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(syncNowId);
      window.clearInterval(timerId);
    };
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
      if (paintedSlotsRef.current.has(slotIndex)) return;
      paintedSlotsRef.current.add(slotIndex);

      updateDay(selectedDate, (day) => {
        const slotKey = String(slotIndex);
        const nextBlocks = { ...day.blocks };

        if (tool === "erase") {
          if (!(slotKey in nextBlocks)) return day;
          delete nextBlocks[slotKey];
        } else {
          /* Toggle painting
             Every visited cell flips its current filled state exactly once per
             drag gesture. / 채워진 2칸과 빈 4칸을 함께 드래그하면 각각
             빈칸 2개와 선택 과목 4칸으로 반전된다. */
          if (slotKey in nextBlocks) {
            delete nextBlocks[slotKey];
          } else {
            nextBlocks[slotKey] = tool;
          }
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
      paintedSlotsRef.current.clear();
    };

    const continuePainting = (event: PointerEvent) => {
      if (!paintingRef.current || isTimelineLocked) return;
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
  }, [isTimelineLocked, paintSlot]);

  const beginPainting = (
    event: ReactPointerEvent<HTMLButtonElement>,
    slotIndex: number
  ) => {
    if (
      isTimelineLocked ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }
    event.preventDefault();
    setTimelineHistory((history) => [
      ...history.slice(-19),
      { ...selectedDay.blocks },
    ]);
    paintingRef.current = true;
    paintedSlotsRef.current.clear();
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
    if (isTimelineLocked) return;
    if (
      Object.keys(selectedDay.blocks).length > 0 &&
      !window.confirm("선택한 날짜의 10분 기록을 모두 지울까요?")
    ) {
      return;
    }
    setTimelineHistory((history) => [
      ...history.slice(-19),
      { ...selectedDay.blocks },
    ]);
    updateDay(selectedDate, (day) => ({ ...day, blocks: {} }));
  };

  const undoTimeline = () => {
    if (isTimelineLocked || timelineHistory.length === 0) return;
    const previousBlocks = timelineHistory[timelineHistory.length - 1];
    updateDay(selectedDate, (day) => ({
      ...day,
      blocks: { ...previousBlocks },
    }));
    setTimelineHistory((history) => history.slice(0, -1));
  };

  const renderPlanner = (mode: StudyPlannerMode) => {
    const idPrefix = `study10-${mode}`;

    return (
      <div
        className={cn(
          "study10-planner",
          `study10-planner--${mode}`,
          isTimelineLocked && "is-timeline-locked"
        )}
      >
        {/* Figma Frame: Summary Metrics / 모든 container size의 상단 기준선 */}
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

        {/* Figma Frame: Date Navigation / planner scroll content 위에 유지 */}
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

        {/* Figma Component Set: Subject Paint Tool + Eraser + Real-time Timer controls */}
        <section className="study10-control-band">
          <div className="study10-subject-tools" aria-label="Study subjects">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="study10-subject-control"
                style={getSubjectStyle(subject.color)}
              >
                <button
                  type="button"
                  className={cn(
                    "study10-subject-tool",
                    selectedTool === subject.id && "is-active"
                  )}
                  onClick={() => {
                    if (selectedTool === subject.id) {
                      openSubjectEditor(subject.id);
                      return;
                    }
                    setSelectedTool(subject.id);
                  }}
                  aria-pressed={selectedTool === subject.id}
                  title={
                    selectedTool === subject.id
                      ? `${subject.label} 설정 열기`
                      : `${subject.label} 선택 · ${formatStudyMinutes(
                          subjectTotals[subject.id] ?? 0
                        )}`
                  }
                >
                  <span className="study10-subject-dot" />
                  <span>{subject.shortLabel}</span>
                  <small>
                    {formatStudyMinutes(subjectTotals[subject.id] ?? 0)}
                  </small>
                </button>
              </div>
            ))}
            <button
              type="button"
              className="study10-subject-tool study10-subject-add-tool"
              onClick={openNewSubjectEditor}
              aria-label="새 과목 추가"
              title="새 과목 추가"
            >
              <Plus />
              <span>과목</span>
            </button>
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
              <div className="study10-panel-actions">
                <button
                  type="button"
                  className="study10-icon-button"
                  onClick={undoTimeline}
                  disabled={isTimelineLocked || timelineHistory.length === 0}
                  aria-label="마지막 시간표 편집 되돌리기"
                  title="되돌리기"
                >
                  <Undo2 />
                </button>
                <button
                  type="button"
                  className={cn(
                    "study10-icon-button study10-lock-button",
                    isTimelineLocked && "is-active"
                  )}
                  onClick={() => setIsTimelineLocked((locked) => !locked)}
                  aria-label={
                    isTimelineLocked ? "시간표 잠금 해제" : "시간표 잠금"
                  }
                  aria-pressed={isTimelineLocked}
                  title={isTimelineLocked ? "잠금 해제" : "편집 잠금"}
                >
                  {isTimelineLocked ? <Lock /> : <Unlock />}
                </button>
                <button
                  type="button"
                  className="study10-icon-button"
                  onClick={clearTimeline}
                  disabled={isTimelineLocked}
                  aria-label="선택한 날짜 시간표 전체 지우기"
                  title="전체 지우기"
                >
                  <RotateCcw />
                </button>
              </div>
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
                          aria-disabled={isTimelineLocked}
                          title={label}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="study10-side-stack">
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
                  {subjects.map((subject) => (
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
          </div>
        </div>
      </div>
    );
  };

  const subjectEditorPortal =
    subjectDraft && typeof document !== "undefined"
      ? createPortal(
          <div
            className="study10-subject-dialog-layer"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) commitSubjectDraft();
            }}
          >
            {/* Figma Component: Subject Settings Popover / Edit · Create */}
            <section
              className="study10-subject-dialog"
              role="dialog"
              aria-modal="true"
              aria-label={subjectDraft.isNew ? "새 과목 추가" : "과목 설정"}
              style={getSubjectStyle(subjectDraft.color)}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <header className="study10-subject-dialog-header">
                <div>
                  <span>{subjectDraft.isNew ? "NEW SUBJECT" : "SUBJECT"}</span>
                  <strong>
                    {subjectDraft.name.trim() || "새 과목"}
                  </strong>
                </div>
                <button
                  type="button"
                  className="study10-subject-dialog-close"
                  onClick={commitSubjectDraft}
                  aria-label="과목 설정 저장 후 닫기"
                  title="저장 후 닫기"
                >
                  <X />
                </button>
              </header>

              <div className="study10-subject-total">
                <span>전체 공부 시간</span>
                <strong>
                  {formatStudyMinutes(
                    subjectDraft.subjectId
                      ? allTimeSubjectTotals[subjectDraft.subjectId] ?? 0
                      : 0
                  )}
                </strong>
              </div>

              <label className="study10-subject-dialog-field">
                <span>과목명</span>
                <input
                  value={subjectDraft.name}
                  maxLength={24}
                  onChange={(event) =>
                    setSubjectDraft((draft) =>
                      draft ? { ...draft, name: event.target.value } : draft
                    )
                  }
                  placeholder="과목 이름"
                  autoFocus
                />
              </label>

              <label className="study10-subject-dialog-field study10-subject-color-field">
                <span>색상</span>
                <div>
                  <input
                    type="color"
                    value={subjectDraft.color}
                    onChange={(event) =>
                      setSubjectDraft((draft) =>
                        draft ? { ...draft, color: event.target.value } : draft
                      )
                    }
                    aria-label="과목 색상 선택"
                  />
                  <code>{subjectDraft.color.toUpperCase()}</code>
                </div>
              </label>

              <label className="study10-subject-dialog-field">
                <span>과목 메모</span>
                <textarea
                  value={subjectDraft.note}
                  onChange={(event) =>
                    setSubjectDraft((draft) =>
                      draft ? { ...draft, note: event.target.value } : draft
                    )
                  }
                  placeholder="목표, 교재, 자주 막히는 부분을 적어두세요."
                />
              </label>

              <button
                type="button"
                className="study10-subject-dialog-apply"
                onClick={commitSubjectDraft}
              >
                {subjectDraft.isNew ? "과목 추가" : "변경사항 적용"}
              </button>
            </section>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {/* Figma Component: Study Widget / compact planner mode */}
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

      {/* Figma Component: Study Detail Floating Window / expanded planner mode */}
      <StudyDetailWindow
        open={detailOpen}
        subtitle={`${formatStudyDate(selectedDate)} · ${formatStudyMinutes(
          totalMinutes
        )}`}
        onClose={() => setDetailOpen(false)}
      >
        {renderPlanner("detail")}
      </StudyDetailWindow>
      {subjectEditorPortal}
    </>
  );
};
