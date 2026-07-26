import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Maximize2,
  Plus,
  Target,
  Trash2,
} from "lucide-react";

import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";
import { defaultStudySubjects } from "../../constants/study";
import type {
  StudyRecord,
  StudySubject,
  StudySubjectId,
  StudyTask,
} from "../../types/study";
import {
  addDays,
  createId,
  formatMinutes,
  getEstimatedMinutesByDate,
  getSubjectMinutes,
  getSubjectProblems,
  getTasksByDate,
  getTotalMinutesByDate,
  getTotalProblemsByDate,
  getWeekDates,
  toLocalDateInput,
} from "./study/studyUtils";
import { StudyDetailWindow } from "./study/StudyDetailWindow";
import { usePomodoroTimer } from "./timer/usePomodoroTimer";

const getSubject = (subjects: StudySubject[], id: StudySubjectId) => {
  return subjects.find((subject) => subject.id === id) ?? subjects[0];
};

/* Study widget structure:
   1) local input state controls the quick dashboard form only
   2) persisted subjects/records/tasks are shared with the detail window
   3) derived totals keep the compact card readable without extra storage
   4) the dashboard card stays summary-first; deeper editing opens the detail window
   Pomodoro timing lives in the separate Timer widget, but this card still reads
   the timer state so the study summary can mention the active focus length. */
export const StudyWidget = () => {
  const today = toLocalDateInput();

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSubjectId, setSelectedSubjectId] =
    useState<StudySubjectId>("actuarial");
  const [minutesInput, setMinutesInput] = useState("30");
  const [problemsInput, setProblemsInput] = useState("0");
  const [noteInput, setNoteInput] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [taskEstimateInput, setTaskEstimateInput] = useState("25");
  const [detailOpen, setDetailOpen] = useState(false);

  const { value: subjects, setValue: setSubjects } = useLocalStorage<
    StudySubject[]
  >("glassday.study.subjects.v1", defaultStudySubjects);

  const { value: records, setValue: setRecords } = useLocalStorage<
    StudyRecord[]
  >("glassday.study.records.v1", []);

  const { value: tasks, setValue: setTasks } = useLocalStorage<StudyTask[]>(
    "glassday.study.tasks.v1",
    []
  );
  const { pomodoro, remainingSeconds, activeLabel } = usePomodoroTimer();

  // Selected subject drives quick-entry defaults and the subject cards below.
  const selectedSubject = getSubject(subjects, selectedSubjectId);

  const selectedDateTasks = useMemo(
    () => getTasksByDate(tasks, selectedDate),
    [tasks, selectedDate]
  );

  const selectedDateRecords = useMemo(
    () => records.filter((record) => record.date === selectedDate),
    [records, selectedDate]
  );

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const todayTotalMinutes = getTotalMinutesByDate(records, selectedDate);
  const todayTotalProblems = getTotalProblemsByDate(records, selectedDate);

  const todayGoalMinutes = subjects.reduce(
    (sum, subject) => sum + subject.dailyGoalMinutes,
    0
  );

  const todayProgress =
    todayGoalMinutes > 0
      ? Math.min(100, Math.round((todayTotalMinutes / todayGoalMinutes) * 100))
      : 0;

  const completedTasks = selectedDateTasks.filter((task) => task.done).length;

  const weekTotalMinutes = weekDates.reduce(
    (sum, date) => sum + getTotalMinutesByDate(records, date),
    0
  );

  const todayPlannedMinutes = getEstimatedMinutesByDate(tasks, selectedDate);
  const weekPlannedMinutes = weekDates.reduce(
    (sum, date) => sum + getEstimatedMinutesByDate(tasks, date),
    0
  );

  // Quick capture for manual study input from the dashboard surface.
  const addStudyRecord = () => {
    const minutes = Math.max(0, Number(minutesInput) || 0);
    const problems = Math.max(0, Number(problemsInput) || 0);

    if (minutes <= 0 && problems <= 0 && !noteInput.trim()) return;

    const newRecord: StudyRecord = {
      id: createId("study-record"),
      date: selectedDate,
      subjectId: selectedSubjectId,
      minutes,
      problems,
      note: noteInput.trim(),
      createdAt: Date.now(),
    };

    setRecords((prev) => [newRecord, ...prev]);

    setMinutesInput("30");
    setProblemsInput("0");
    setNoteInput("");
  };

  const removeRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((record) => record.id !== recordId));
  };

  const addTask = (prefillText?: string) => {
    const text = prefillText?.trim() || taskInput.trim() || "New study task";
    const estimatedMinutes = Math.max(0, Number(taskEstimateInput) || 0);

    const newTask: StudyTask = {
      id: createId("study-task"),
      date: selectedDate,
      subjectId: selectedSubjectId,
      text,
      estimatedMinutes,
      done: false,
      createdAt: Date.now(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setTaskInput("");
    setTaskEstimateInput(String(Math.max(15, estimatedMinutes || 25)));
  };

  const updateTask = (taskId: string, patch: Partial<StudyTask>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...patch,
            }
          : task
      )
    );
  };

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const updateSubjectGoal = (subjectId: StudySubjectId, goal: number) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              dailyGoalMinutes: Math.max(0, goal),
            }
          : subject
      )
    );
  };

  return (
    <>
      <GlassCard
        className="study-widget"
        title="Study Planner"
        subtitle={`${formatMinutes(todayTotalMinutes)} / ${formatMinutes(
          todayGoalMinutes
        )} · ${todayProgress}%`}
        icon={<BookOpenCheck className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className="glass-button h-8 w-8 flex items-center justify-center"
              title="Open detail window"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => addTask()}
              className="glass-button h-8 w-8 flex items-center justify-center"
              title="Add study task"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      >
        {/* Dashboard surface:
            keep this layout compact and scrollable inside the grid item.
            Long record/task editing belongs in StudyDetailWindow so the widget
            does not become a full page squeezed into a small dashboard card. */}
        <div className="study-planner">
          <section className="study-hero">
            <div>
              <div className="study-kicker">Today Study</div>
              <div className="study-main">{formatMinutes(todayTotalMinutes)}</div>
              <div className="study-sub">
                {todayTotalProblems} problems · {completedTasks}/
                {selectedDateTasks.length} tasks · planned{" "}
                {formatMinutes(todayPlannedMinutes)} · week{" "}
                {formatMinutes(weekTotalMinutes)} · timer{" "}
                {pomodoro.isRunning ? "running" : activeLabel.toLowerCase()}{" "}
                {Math.ceil(remainingSeconds / 60)}m
              </div>
            </div>

            <div className="study-progress-ring">
              <span>{todayProgress}%</span>
            </div>
          </section>

          <section className="study-date-row">
            <button
              type="button"
              onClick={() => setSelectedDate((prev) => addDays(prev, -1))}
              className="study-date-button"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="study-date-input"
            />

            <button
              type="button"
              onClick={() => setSelectedDate((prev) => addDays(prev, 1))}
              className="study-date-button"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </section>

          <section className="study-subject-grid">
            {subjects.map((subject) => {
              const minutes = getSubjectMinutes(records, subject.id, selectedDate);
              const problems = getSubjectProblems(records, subject.id, selectedDate);

              const progress =
                subject.dailyGoalMinutes > 0
                  ? Math.min(
                      100,
                      Math.round((minutes / subject.dailyGoalMinutes) * 100)
                    )
                  : 0;

              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(subject.id)}
                  className={cn(
                    "study-subject-card",
                    selectedSubjectId === subject.id && "is-active"
                  )}
                >
                  <span
                    className="study-subject-color"
                    style={{ backgroundColor: subject.color }}
                  />

                  <div className="min-w-0">
                    <strong>{subject.shortLabel}</strong>
                    <span>
                      {formatMinutes(minutes)} · {problems}Q
                    </span>
                  </div>

                  <em>{progress}%</em>
                </button>
              );
            })}
          </section>

          <section className="study-input-panel">
            <div className="study-section-title">
              <Clock3 className="w-3.5 h-3.5" />
              Add Record · {selectedSubject.shortLabel}
            </div>

            <div className="study-record-form">
              <label>
                <span>Minutes</span>
                <input
                  type="number"
                  min={0}
                  value={minutesInput}
                  onChange={(event) => setMinutesInput(event.target.value)}
                />
              </label>

              <label>
                <span>Problems</span>
                <input
                  type="number"
                  min={0}
                  value={problemsInput}
                  onChange={(event) => setProblemsInput(event.target.value)}
                />
              </label>

              <label className="study-note-field">
                <span>Note</span>
                <input
                  value={noteInput}
                  onChange={(event) => setNoteInput(event.target.value)}
                  spellCheck={false}
                  placeholder="force of interest, NCS ratio..."
                />
              </label>

              <button type="button" onClick={addStudyRecord}>
                Add
              </button>
            </div>
          </section>

          <section className="study-week-panel">
            <div className="study-section-title">
              <BookOpenCheck className="w-3.5 h-3.5" />
              Weekly
            </div>

            <div className="study-week-bars">
              {weekDates.map((date) => {
                const minutes = getTotalMinutesByDate(records, date);
                const height = Math.min(100, Math.max(8, minutes / 3));

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "study-week-day",
                      selectedDate === date && "is-active"
                    )}
                  >
                    <div className="study-week-bar-track">
                      <div
                        className="study-week-bar"
                        style={{ height: `${height}%` }}
                      />
                    </div>

                    <strong>{formatMinutes(minutes)}</strong>
                    <span>{date.slice(5).replace("-", "/")}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="study-goal-panel">
            <div className="study-section-title">
              <Target className="w-3.5 h-3.5" />
              Daily Goals
            </div>

            <div className="study-goal-list">
              {subjects.map((subject) => (
                <label key={subject.id} className="study-goal-item">
                  <span>{subject.shortLabel}</span>

                  <input
                    type="number"
                    min={0}
                    value={subject.dailyGoalMinutes}
                    onChange={(event) =>
                      updateSubjectGoal(subject.id, Number(event.target.value))
                    }
                  />

                  <small>min</small>
                </label>
              ))}
            </div>
          </section>

          <section className="study-task-panel">
            <div className="study-section-title">
              <Check className="w-3.5 h-3.5" />
              Checklist
            </div>

            <div className="study-task-form">
              <input
                value={taskInput}
                onChange={(event) => setTaskInput(event.target.value)}
                placeholder="Add a focused study task"
                spellCheck={false}
              />

              <input
                type="number"
                min={0}
                value={taskEstimateInput}
                onChange={(event) => setTaskEstimateInput(event.target.value)}
                placeholder="25"
              />

              <button type="button" onClick={() => addTask()}>
                Add
              </button>
            </div>

            <div className="study-task-list">
              {selectedDateTasks.length === 0 ? (
                <div className="study-empty">No study tasks for this day.</div>
              ) : (
                selectedDateTasks.map((task) => {
                  const subject = getSubject(subjects, task.subjectId);

                  return (
                    <div
                      key={task.id}
                      className={cn("study-task", task.done && "is-done")}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          updateTask(task.id, {
                            done: !task.done,
                          })
                        }
                        className="study-task-check"
                      >
                        {task.done ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                      </button>

                      <span
                        className="study-task-dot"
                        style={{ backgroundColor: subject.color }}
                      />

                      <div className="study-task-copy">
                        <input
                          value={task.text}
                          onChange={(event) =>
                            updateTask(task.id, {
                              text: event.target.value,
                            })
                          }
                          spellCheck={false}
                        />

                        <div className="study-task-meta">
                          <span>{subject.shortLabel}</span>
                          {(task.estimatedMinutes ?? 0) > 0 ? (
                            <span>{formatMinutes(task.estimatedMinutes ?? 0)}</span>
                          ) : (
                            <span>Open estimate</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="study-task-delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="study-record-list-panel">
            <div className="study-section-title">Recent Records</div>

            <div className="study-record-list">
              {selectedDateRecords.length === 0 ? (
                <div className="study-empty">No records yet.</div>
              ) : (
                selectedDateRecords.slice(0, 6).map((record) => {
                  const subject = getSubject(subjects, record.subjectId);

                  return (
                    <article key={record.id} className="study-record-item">
                      <span
                        className="study-record-color"
                        style={{ backgroundColor: subject.color }}
                      />

                      <div className="min-w-0">
                        <strong>
                          {subject.shortLabel} · {formatMinutes(record.minutes)}
                        </strong>

                        <span>
                          {record.problems}Q
                          {record.note ? ` · ${record.note}` : ""}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeRecord(record.id)}
                        className="study-record-delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </GlassCard>

      <StudyDetailWindow
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
};
