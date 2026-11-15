/**
 * Glassday / Mobile Study Planner
 *
 * A mobile-first summary and a full-screen view of the EXISTING StudyWidget.
 * - Never writes a new study schema or desktop layout.
 * - Uses the same glassday.study.planner.v2 store as StudyWidget.
 * - WidgetSlot moves the existing widget instance into the detail view.
 * - Timeline, task and memo tabs only filter its existing sections.
 *
 * Dependencies: StudyWidget is still rendered by WidgetRenderer in App.tsx.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  ListTodo,
  NotebookPen,
} from "lucide-react";

import { STUDY_PLANNER_STORAGE_KEY } from "../../constants/study";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import type { StudyPlannerStorage } from "../../types/study";
import {
  createInitialStudyPlannerStorage,
  formatStudyMinutes,
  getStudyDay,
  getStudyPlannerTotalMinutes,
  normalizeStudyPlannerStorage,
  toLocalDateInput,
} from "../widgets/study/studyUtils";
import { WidgetSlot } from "../widgets/WidgetSlot";
import "../../styles/mobile-study.css";

type StudyView = "timeline" | "tasks" | "notes";

const VIEWS: ReadonlyArray<{
  id: StudyView;
  label: string;
  icon: typeof CalendarClock;
}> = [
  { id: "timeline", label: "시간표", icon: CalendarClock },
  { id: "tasks", label: "할 일", icon: ListTodo },
  { id: "notes", label: "메모", icon: NotebookPen },
];

export const MobileStudyCard = () => {
  const initialPlanner = useMemo(() => createInitialStudyPlannerStorage(), []);
  const { value: rawPlanner } = useLocalStorage<StudyPlannerStorage>(
    STUDY_PLANNER_STORAGE_KEY,
    initialPlanner,
  );
  const planner = useMemo(
    () => normalizeStudyPlannerStorage(rawPlanner),
    [rawPlanner],
  );
  const today = toLocalDateInput();
  const day = getStudyDay(planner, today);
  const minutes = getStudyPlannerTotalMinutes(day);
  const goal = Math.max(10, day.goalMinutes);
  const progress = Math.min(100, Math.round((minutes / goal) * 100));
  const done = day.tasks.filter((task) => task.done).length;
  const upcoming = day.tasks.filter((task) => !task.done).slice(0, 2);
  const isRecording = planner.activeTimer !== null;

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<StudyView>("timeline");
  const closeButton = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const open = (nextView: StudyView) => {
    setView(nextView);
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // The StudyWidget's own subject editor is a higher-level dialog.
        if (document.querySelector(".study10-subject-dialog-layer")) return;
        event.preventDefault();
        setIsOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = document.querySelector<HTMLElement>(".mobile-study-detail");
      if (!dialog) return;
      const tabbables = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      const first = tabbables[0];
      const last = tabbables[tabbables.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  return (
    <>
      <section className="mobile-study-card" aria-label="오늘의 공부 현황">
        <div className="mobile-study-card__heading">
          <span className="mobile-study-card__eyebrow">
            <BookOpenCheck size={15} aria-hidden="true" /> Study Planner
          </span>
          <button
            type="button"
            className="mobile-study-card__open"
            onClick={() => open("timeline")}
            aria-label="공부 플래너 자세히 보기"
          >
            전체 보기 <ArrowUpRight size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="mobile-study-card__metrics">
          <div className="mobile-study-card__metric mobile-study-card__metric--main">
            <span>오늘 공부</span>
            <strong>{formatStudyMinutes(minutes)}</strong>
            <small>
              <Clock3 size={13} aria-hidden="true" />
              목표 {formatStudyMinutes(goal)}
            </small>
          </div>
          <div className="mobile-study-card__metric">
            <span>완료한 할 일</span>
            <strong>{done}<em> / {day.tasks.length}</em></strong>
            <small>
              <CheckCircle2 size={13} aria-hidden="true" />
              {isRecording ? "타이머 기록 중" : `${progress}% 달성`}
            </small>
          </div>
        </div>

        <div className="mobile-study-card__progress">
          <div className="mobile-study-card__progress-caption">
            <span>Daily progress</span>
            <strong>{progress}%</strong>
          </div>
          <div
            className="mobile-study-card__progress-track"
            role="progressbar"
            aria-label="오늘의 공부 목표 달성률"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>

        {upcoming.length > 0 && (
          <div className="mobile-study-card__upcoming">
            <span>다음 할 일</span>
            {upcoming.map((task) => (
              <p key={task.id}>{task.text}</p>
            ))}
          </div>
        )}

        <div className="mobile-study-card__shortcuts" aria-label="공부 플래너 바로가기">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => open(id)}>
              <Icon size={16} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </section>

      {isOpen && createPortal(
        <div
          className="mobile-study-detail"
          data-study-view={view}
          role="dialog"
          aria-modal="true"
          aria-label="Study Planner 상세"
        >
          <header className="mobile-study-detail__header">
            <button
              type="button"
              className="mobile-study-detail__back"
              onClick={() => setIsOpen(false)}
              ref={closeButton}
              aria-label="공부 플래너 닫기"
            >
              <ChevronLeft size={22} aria-hidden="true" />
              <span>뒤로</span>
            </button>
            <div className="mobile-study-detail__heading">
              <strong>Study Planner</strong>
              <span>나의 학습 기록</span>
            </div>
            <div className="mobile-study-detail__header-end" aria-hidden="true" />
          </header>

          <nav className="mobile-study-detail__tabs" role="tablist" aria-label="플래너 화면">
            {VIEWS.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                id={`${panelId}-tab-${id}`}
                role="tab"
                aria-selected={view === id}
                aria-controls={`${panelId}-panel`}
                className={view === id ? "is-selected" : ""}
                onClick={() => setView(id)}
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>

          <div
            className="mobile-study-detail__scroll"
            role="tabpanel"
            id={`${panelId}-panel`}
            aria-labelledby={`${panelId}-tab-${view}`}
            tabIndex={0}
          >
            <div className="mobile-study-detail__host">
              <WidgetSlot widgetId="study" />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};
