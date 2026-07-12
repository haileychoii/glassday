import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Plus,
  Target,
  Trash2,
} from "lucide-react";

import { FloatingWindow } from "../../common/FloatingWindow";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { cn } from "../../../lib/utils";
import { defaultStudySubjects } from "../../../constants/study";
import type {
  StudyRecord,
  StudySubject,
  StudySubjectId,
  StudyTask,
} from "../../../types/study";
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
} from "./studyUtils";

type StudyDetailWindowProps = {
  open: boolean;
  onClose: () => void;
};

const getSubject = (subjects: StudySubject[], id: StudySubjectId) => {
  return subjects.find((subject) => subject.id === id) ?? subjects[0];
};

export const StudyDetailWindow = ({ open, onClose }: StudyDetailWindowProps) => {
  const today = toLocalDateInput();

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSubjectId, setSelectedSubjectId] =
    useState<StudySubjectId>("actuarial");

  const [minutesInput, setMinutesInput] = useState("30");
  const [problemsInput, setProblemsInput] = useState("0");
  const [noteInput, setNoteInput] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [taskEstimateInput, setTaskEstimateInput] = useState("25");

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

  const dayTotalMinutes = getTotalMinutesByDate(records, selectedDate);
  const dayTotalProblems = getTotalProblemsByDate(records, selectedDate);

  const dayGoalMinutes = subjects.reduce(
    (sum, subject) => sum + subject.dailyGoalMinutes,
    0
  );

  const dayProgress =
    dayGoalMinutes > 0
      ? Math.min(100, Math.round((dayTotalMinutes / dayGoalMinutes) * 100))
      : 0;

  const weekTotalMinutes = weekDates.reduce(
    (sum, date) => sum + getTotalMinutesByDate(records, date),
    0
  );
  const dayPlannedMinutes = getEstimatedMinutesByDate(tasks, selectedDate);
  const weekPlannedMinutes = weekDates.reduce(
    (sum, date) => sum + getEstimatedMinutesByDate(tasks, date),
    0
  );

  const completedTasks = selectedDateTasks.filter((task) => task.done).length;

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

  const removeRecord = (id: string) => {
    setRecords((prev) => prev.filter((record) => record.id !== id));
  };

  const addTask = () => {
    const text = taskInput.trim() || "New study task";
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

  const updateTask = (id: string, patch: Partial<StudyTask>) => {
    setTasks((prev) =>
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
    setTasks((prev) => prev.filter((task) => task.id !== id));
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
    <FloatingWindow
      open={open}
      title="Study Detail"
      subtitle={`${selectedDate} · ${formatMinutes(dayTotalMinutes)} / ${formatMinutes(
        dayGoalMinutes
      )}`}
      storageKey="glassday.study.detailWindow.rect.v1"
      defaultRect={{
        x: 148,
        y: 76,
        w: 1180,
        h: 780,
      }}
      minWidth={820}
      minHeight={560}
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            onClick={() => setSelectedDate(today)}
            className="glass-button h-8 px-3 text-xs"
          >
            Today
          </button>

          <button
            type="button"
            onClick={addTask}
            className="glass-button h-8 px-3 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Task
          </button>
        </>
      }
    >
      <div className="study-detail-window">
        <section className="study-detail-hero">
          <div>
            <div className="study-kicker">Study Detail</div>
            <div className="study-main">{formatMinutes(dayTotalMinutes)}</div>
            <div className="study-sub">
              {dayTotalProblems} problems · {completedTasks}/
              {selectedDateTasks.length} tasks · planned{" "}
              {formatMinutes(dayPlannedMinutes)} · week{" "}
              {formatMinutes(weekTotalMinutes)} / {formatMinutes(weekPlannedMinutes)}
            </div>
          </div>

          <div className="study-progress-ring">
            <span>{dayProgress}%</span>
          </div>
        </section>

        <section className="study-detail-date-row">
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

        <section className="study-detail-subjects">
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
                  "study-detail-subject-card",
                  selectedSubjectId === subject.id && "is-active"
                )}
              >
                <span
                  className="study-subject-color"
                  style={{ backgroundColor: subject.color }}
                />

                <div className="min-w-0 flex-1">
                  <strong>{subject.label}</strong>
                  <span>
                    {formatMinutes(minutes)} · {problems}Q · goal{" "}
                    {formatMinutes(subject.dailyGoalMinutes)}
                  </span>
                </div>

                <em>{progress}%</em>
              </button>
            );
          })}
        </section>

        <section className="study-detail-record-form">
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
                placeholder="e.g. force of interest, NCS ratio..."
              />
            </label>

            <button type="button" onClick={addStudyRecord}>
              Add
            </button>
          </div>
        </section>

        <section className="study-detail-week-panel">
          <div className="study-section-title">
            <BookOpenCheck className="w-3.5 h-3.5" />
            Weekly Timeline
          </div>

          <div className="study-detail-week-bars">
            {weekDates.map((date) => {
              const minutes = getTotalMinutesByDate(records, date);
              const height = Math.min(100, Math.max(8, minutes / 3));

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "study-detail-week-day",
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

        <section className="study-detail-goals">
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

        <section className="study-detail-tasks">
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

            <button type="button" onClick={addTask}>
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

        <section className="study-detail-records">
          <div className="study-section-title">Records</div>

          <div className="study-detail-record-list">
            {selectedDateRecords.length === 0 ? (
              <div className="study-empty">No records yet.</div>
            ) : (
              selectedDateRecords.map((record) => {
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
    </FloatingWindow>
  );
};
