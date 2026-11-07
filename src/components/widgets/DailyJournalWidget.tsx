/**
 * ============================================================
 * [Figma Mapping] Dashboard / Daily Journal Widget
 * ============================================================
 *
 * 화면 역할: 날짜별 task, condition score, work log, reflection, hashtag clip을 기록한다.
 * Renderer: DashboardGrid (WidgetId: journal)
 * Types/Storage: src/types/journal.ts, journalUtils, glassday.journal.entries.v1
 * Style: src/styles/widgets/journal.css + responsive/theme overrides
 *
 * Figma 구조: Header + Date Navigation, Summary Metrics, Condition Stepper,
 * Scroll Body(Today/Tomorrow/Text/Clip sections)
 * Variants: Empty / Partially Filled / Completed / Compact
 * ============================================================
 */
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ClipboardList,
  Hash,
  Maximize2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";

import { GlassCard } from "../glass/GlassCard";
import { FloatingWindow } from "../common/FloatingWindow";
import type {
  JournalClip,
  JournalEntry,
  JournalMood,
  JournalTask,
} from "../../types/journal";
import {
  addDaysToDateString,
  applyHashtagToText,
  collectHashtagLibrary,
  createClipFromSelection,
  createJournalTask,
  getDoneTodayTaskCount,
  getEntryHashtags,
  getJournalProgress,
  getOrCreateJournalEntry,
  journalMoodLabels,
  journalMoodOptions,
  JOURNAL_STORAGE_KEY,
  normalizeJournalEntry,
  todayString,
  updateJournalEntry,
} from "./journal/journalUtils";

const cx = (...classes: Array<string | false | null | undefined>) => {
  return classes.filter(Boolean).join(" ");
};

type DailyJournalWidgetProps = {
  /** Dashboard는 compact, FloatingWindow 안에서는 detail 전체 편집기를 사용한다. */
  presentation?: "compact" | "detail";
  /** compact에서 선택한 날짜를 detail 창에 그대로 전달한다. */
  initialDate?: string;
};

/** 날짜를 기준으로 JournalEntry를 편집하고 derived summary를 계산하는 Widget. */
export const DailyJournalWidget = ({
  presentation = "compact",
  initialDate,
}: DailyJournalWidgetProps = {}) => {
  // Share the same persistence bridge as other widgets. Normalization remains in
  // journalUtils.ts; no mount-time save can overwrite a newly restored snapshot.
  // 한국어: 초기 표시에는 저장하지 않고, 입력할 때만 저장하며 복원·초기화를 바로 반영한다.
  const { value: storedEntries, setValue: setEntries } = useLocalStorage<JournalEntry[]>(
    JOURNAL_STORAGE_KEY, []
  );
  // Wrap the normalizer because its second parameter is an optional fallback date,
  // while Array.map passes a numeric index as its second callback argument.
  // 한국어: map의 index가 날짜 인자로 잘못 전달되지 않도록 값만 명시적으로 넘긴다.
  const entries = useMemo(
    () => storedEntries.map((storedEntry) => normalizeJournalEntry(storedEntry)),
    [storedEntries]
  );
  const [selectedDate, setSelectedDate] = useState(
    initialDate ?? todayString()
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTomorrowTaskText, setNewTomorrowTaskText] = useState("");
  const [clipText, setClipText] = useState("");
  const [clipTag, setClipTag] = useState("#자소서소재");
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState<string | null>(
    null
  );

  // Derived active entry for the selected day.
  const entry = useMemo(() => {
    return getOrCreateJournalEntry(entries, selectedDate);
  }, [entries, selectedDate]);

  const progress = getJournalProgress(entry);
  const doneTaskCount = getDoneTodayTaskCount(entry);
  const hashtags = getEntryHashtags(entry);
  const hashtagLibrary = collectHashtagLibrary(entries);

  // Lightweight helpers keep JSX readable and make later field additions safer.
  const adjustScore = (
    key: "energy" | "focus" | "sleepy" | "stress",
    delta: number
  ) => {
    const nextValue = Math.min(5, Math.max(1, entry[key] + delta));

    updateEntry({
      [key]: nextValue,
    } as Partial<JournalEntry>);
  };

  const updateEntry = (patch: Partial<JournalEntry>) => {
    setEntries((prev) => updateJournalEntry(prev, selectedDate, patch));
  };

  const updateTask = (
    key: "todayTasks" | "tomorrowTasks",
    taskId: string,
    patch: Partial<JournalTask>
  ) => {
    updateEntry({
      [key]: entry[key].map((task) =>
        task.id === taskId ? { ...task, ...patch } : task
      ),
    } as Partial<JournalEntry>);
  };

  const deleteTask = (
    key: "todayTasks" | "tomorrowTasks",
    taskId: string
  ) => {
    updateEntry({
      [key]: entry[key].filter((task) => task.id !== taskId),
    } as Partial<JournalEntry>);
    setPendingDeleteTaskId(null);
  };

  const addTask = (key: "todayTasks" | "tomorrowTasks", text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    updateEntry({
      [key]: [...entry[key], createJournalTask(trimmed)],
    } as Partial<JournalEntry>);
  };

  const addClip = () => {
    const text = clipText.trim();
    if (!text) return;

    const nextEntry = createClipFromSelection({
      entry,
      tag: clipTag,
      text,
      source: "daily-journal",
    });

    setEntries((prev) => updateJournalEntry(prev, selectedDate, nextEntry));
    setClipText("");
  };

  const deleteClip = (clipId: string) => {
    updateEntry({
      clips: entry.clips.filter((clip) => clip.id !== clipId),
    });
  };

  const applyTagToField = (
    field: "workLog" | "learned" | "careerMaterial" | "memo" | "reflection",
    tag: string
  ) => {
    updateEntry({
      [field]: applyHashtagToText(entry[field], tag),
    } as Partial<JournalEntry>);
  };

  const renderTaskList = (
    key: "todayTasks" | "tomorrowTasks",
    tasks: JournalTask[]
  ) => {
    return (
      <div className="journal-task-list">
        {tasks.length === 0 ? (
          <div className="journal-empty-box">아직 체크리스트가 비어 있어.</div>
        ) : (
          tasks.map((task) => {
            const isDeletePending = pendingDeleteTaskId === task.id;

            return (
              <article
                key={task.id}
                className={cx(
                  "journal-task-item",
                  task.done && "is-done",
                  isDeletePending && "is-delete-pending"
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    updateTask(key, task.id, {
                      done: !task.done,
                    })
                  }
                  className="journal-task-check"
                  aria-label={task.done ? "Mark task incomplete" : "Mark task done"}
                >
                  {task.done && <Check className="w-3.5 h-3.5" />}
                </button>

                <input
                  value={task.text}
                  onChange={(event) =>
                    updateTask(key, task.id, {
                      text: event.target.value,
                    })
                  }
                />

                {isDeletePending ? (
                  <div className="journal-task-delete-confirm">
                    <button
                      type="button"
                      onClick={() => deleteTask(key, task.id)}
                      aria-label="Delete task"
                    >
                      <Check className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setPendingDeleteTaskId(null)}
                      aria-label="Cancel delete"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPendingDeleteTaskId(task.id)}
                    className="journal-task-delete-select"
                    aria-label="Select task for delete"
                  />
                )}
              </article>
            );
          })
        )}
      </div>
    );
  };

  if (presentation === "compact") {
    const compactTasks = entry.todayTasks.slice(0, 3);
    const reflectionPreview =
      entry.reflection.trim() || entry.memo.trim() || "오늘의 한 줄을 남겨보세요.";

    return (
      <>
        <GlassCard
          className="daily-journal-widget journal-compact-widget"
          title="Daily Journal"
          subtitle={`${entry.date} · ${progress}% filled`}
          icon={<BookOpen className="w-4 h-4" />}
          actions={
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className="glass-button journal-expand-button"
              title="일기 전체 편집"
              aria-label="Open full journal editor"
            >
              <Maximize2 aria-hidden="true" />
            </button>
          }
        >
          {/* Compact summary / 작은 대시보드 요약
              Existing JournalEntry is edited directly, so task checks here and
              the full editor below always stay in sync. / 별도 요약 데이터를 만들지 않는다. */}
          <div className="journal-compact-content">
            <div className="journal-compact-metrics">
              <div>
                <span>Progress</span>
                <strong>{progress}%</strong>
              </div>
              <div>
                <span>Tasks</span>
                <strong>{doneTaskCount}/{entry.todayTasks.length}</strong>
              </div>
              <div>
                <span>Mood</span>
                <strong>{journalMoodLabels[entry.condition]}</strong>
              </div>
            </div>

            <section className="journal-compact-section">
              <div className="journal-compact-section-title">
                <ClipboardList aria-hidden="true" />
                <span>Today</span>
              </div>

              <div className="journal-compact-tasks">
                {compactTasks.length === 0 ? (
                  <button
                    type="button"
                    className="journal-compact-empty"
                    onClick={() => setDetailOpen(true)}
                  >
                    오늘 할 일을 추가해 보세요.
                  </button>
                ) : (
                  compactTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      className={cx(
                        "journal-compact-task",
                        task.done && "is-done"
                      )}
                      onClick={() =>
                        updateTask("todayTasks", task.id, { done: !task.done })
                      }
                      aria-label={`${task.text} ${task.done ? "완료 취소" : "완료"}`}
                    >
                      <span className="journal-compact-check">
                        {task.done && <Check aria-hidden="true" />}
                      </span>
                      <span>{task.text}</span>
                    </button>
                  ))
                )}
              </div>
            </section>

            <button
              type="button"
              className="journal-compact-reflection"
              onClick={() => setDetailOpen(true)}
            >
              <Sparkles aria-hidden="true" />
              <span>{reflectionPreview}</span>
            </button>
          </div>
        </GlassCard>

        {/* Full editor / 전체 편집기
            FloatingWindow.tsx supplies save-on-close and responsive window bounds.
            The detail instance shares the same localStorage key via useLocalStorage. */}
        <FloatingWindow
          open={detailOpen}
          title="Daily Journal"
          subtitle={`${entry.date} · ${progress}% filled`}
          storageKey="glassday.journal.detailWindow.rect.v1"
          defaultRect={{ x: 120, y: 64, w: 760, h: 640 }}
          minWidth={380}
          minHeight={460}
          className="journal-detail-window"
          onClose={() => setDetailOpen(false)}
        >
          <DailyJournalWidget
            presentation="detail"
            initialDate={selectedDate}
          />
        </FloatingWindow>
      </>
    );
  }

  return (
    <GlassCard
      className="daily-journal-widget"
      title="Daily Journal"
      subtitle={`${entry.date} · ${progress}% filled`}
      icon={<BookOpen className="w-4 h-4" />}
      actions={
        <div className="journal-date-nav">
          <button
            type="button"
            onClick={() =>
              setSelectedDate((prev) => addDaysToDateString(prev, -1))
            }
            aria-label="Previous journal date"
          >
            ←
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            aria-label="Select journal date"
          />

          <button
            type="button"
            onClick={() =>
              setSelectedDate((prev) => addDaysToDateString(prev, 1))
            }
            aria-label="Next journal date"
          >
            →
          </button>
        </div>
      }
    >
      <div className="journal-content">
        {/* Figma Frame: Summary + Condition / Responsive Grid / 상단 고정 영역 */}
        <div className="journal-summary-row">
          <div className="journal-summary-card">
            <span>Progress</span>
            <strong>{progress}%</strong>
          </div>

          <div className="journal-summary-card">
            <span>Tasks</span>
            <strong>
              {doneTaskCount}/{entry.todayTasks.length}
            </strong>
          </div>

          <div className="journal-summary-card">
            <span>Clips</span>
            <strong>{entry.clips.length}</strong>
          </div>

          <div className="journal-summary-card journal-score-strip-card">
            <span>Condition</span>
            <div className="journal-score-strip">
              {(
                [
                  ["Energy", "energy", entry.energy],
                  ["Focus", "focus", entry.focus],
                  ["Sleepy", "sleepy", entry.sleepy],
                  ["Stress", "stress", entry.stress],
                ] as const
              ).map(([label, key, value]) => (
                <div key={key} className={`journal-score-inline score-${key}`}>
                  <small>{label}</small>
                  <div className="journal-score-stepper">
                    <button
                      type="button"
                      onClick={() => adjustScore(key, -1)}
                      aria-label={`${label} down`}
                    >
                      -
                    </button>
                    <b>{value}</b>
                    <button
                      type="button"
                      onClick={() => adjustScore(key, 1)}
                      aria-label={`${label} up`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Container: 날짜별 Journal section만 스크롤되고 Header/Summary는 유지된다. */}
        <div className="journal-main-scroll">
          <section className="journal-section">
            <div className="journal-section-title">
              <ClipboardList className="w-3.5 h-3.5" />
              Today Tasks
            </div>

            <div className="journal-add-row">
              <input
                value={newTaskText}
                onChange={(event) => setNewTaskText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addTask("todayTasks", newTaskText);
                    setNewTaskText("");
                  }
                }}
                placeholder="오늘 할 일"
              />

              <button
                type="button"
                onClick={() => {
                  addTask("todayTasks", newTaskText);
                  setNewTaskText("");
                }}
                aria-label="Add today task"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {renderTaskList("todayTasks", entry.todayTasks)}
          </section>

          <section className="journal-section">
            <div className="journal-section-title">
              <CalendarDays className="w-3.5 h-3.5" />
              Tomorrow
            </div>

            <div className="journal-add-row">
              <input
                value={newTomorrowTaskText}
                onChange={(event) => setNewTomorrowTaskText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addTask("tomorrowTasks", newTomorrowTaskText);
                    setNewTomorrowTaskText("");
                  }
                }}
                placeholder="내일 할 일"
              />

              <button
                type="button"
                onClick={() => {
                  addTask("tomorrowTasks", newTomorrowTaskText);
                  setNewTomorrowTaskText("");
                }}
                aria-label="Add tomorrow task"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {renderTaskList("tomorrowTasks", entry.tomorrowTasks)}
          </section>

          <section className="journal-section">
            <div className="journal-section-title">
              <Sparkles className="w-3.5 h-3.5" />
              Condition
            </div>

            <select
              value={entry.condition}
              onChange={(event) =>
                updateEntry({
                  condition: event.target.value as JournalMood,
                })
              }
              className="journal-mood-select"
            >
              {journalMoodOptions.map((mood) => (
                <option key={mood} value={mood}>
                  {journalMoodLabels[mood]}
                </option>
              ))}
            </select>
          </section>

          <section className="journal-section">
            <div className="journal-section-title">
              <BriefcaseBusiness className="w-3.5 h-3.5" />
              Work Log
            </div>

            <textarea
              value={entry.workLog}
              onChange={(event) =>
                updateEntry({
                  workLog: event.target.value,
                })
              }
              placeholder="오늘 한 업무 / 회사에서 처리한 일"
            />

            <div className="journal-tag-tools">
              <button type="button" onClick={() => applyTagToField("workLog", "#업무")}>
                #업무
              </button>
              <button type="button" onClick={() => applyTagToField("workLog", "#성과")}>
                #성과
              </button>
            </div>
          </section>

          <section className="journal-section">
            <div className="journal-section-title">
              <BookOpen className="w-3.5 h-3.5" />
              Learned
            </div>

            <textarea
              value={entry.learned}
              onChange={(event) =>
                updateEntry({
                  learned: event.target.value,
                })
              }
              placeholder="오늘 배운 것 / 공부하면서 알게 된 것"
            />

            <div className="journal-tag-tools">
              <button type="button" onClick={() => applyTagToField("learned", "#공부")}>
                #공부
              </button>
              <button type="button" onClick={() => applyTagToField("learned", "#개념")}>
                #개념
              </button>
            </div>
          </section>

          <section className="journal-section">
            <div className="journal-section-title">
              <BriefcaseBusiness className="w-3.5 h-3.5" />
              Career Material
            </div>

            <textarea
              value={entry.careerMaterial}
              onChange={(event) =>
                updateEntry({
                  careerMaterial: event.target.value,
                })
              }
              placeholder="자소서 소재 / 면접 답변으로 쓸 만한 경험"
            />

            <div className="journal-tag-tools">
              <button
                type="button"
                onClick={() => applyTagToField("careerMaterial", "#자소서소재")}
              >
                #자소서소재
              </button>
              <button
                type="button"
                onClick={() => applyTagToField("careerMaterial", "#면접소재")}
              >
                #면접소재
              </button>
            </div>
          </section>

          <section className="journal-section">
            <div className="journal-section-title">
              <Hash className="w-3.5 h-3.5" />
              Clip to Hashtag Library
            </div>

            <div className="journal-clip-row">
              <input
                value={clipTag}
                onChange={(event) => setClipTag(event.target.value)}
                placeholder="#자소서소재"
              />

              <button type="button" onClick={addClip}>
                Save Clip
              </button>
            </div>

            <textarea
              value={clipText}
              onChange={(event) => setClipText(event.target.value)}
              placeholder="모아둘 문장이나 소재를 적고 태그로 저장"
            />

            <div className="journal-clip-list">
              {entry.clips.length === 0 ? (
                <div className="journal-empty-box">아직 저장한 클립이 없어.</div>
              ) : (
                entry.clips.map((clip: JournalClip) => (
                  <article key={clip.id} className="journal-clip-item">
                    <div>
                      <strong>{clip.tag}</strong>
                      <span>{clip.text}</span>
                    </div>

                    <button type="button" onClick={() => deleteClip(clip.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="journal-section">
            <div className="journal-section-title">
              <Sparkles className="w-3.5 h-3.5" />
              Reflection
            </div>

            <textarea
              value={entry.reflection}
              onChange={(event) =>
                updateEntry({
                  reflection: event.target.value,
                })
              }
              placeholder="오늘의 한 줄 회고"
            />

            <div className="journal-tag-tools">
              <button
                type="button"
                onClick={() => applyTagToField("reflection", "#회고")}
              >
                #회고
              </button>
            </div>
          </section>

          <section className="journal-section">
            <div className="journal-section-title">
              <Hash className="w-3.5 h-3.5" />
              Hashtags
            </div>

            <div className="journal-hashtag-row">
              {hashtags.length === 0 ? (
                <span className="journal-muted">No hashtags yet</span>
              ) : (
                hashtags.map((tag) => <span key={tag}>{tag}</span>)
              )}
            </div>

            <div className="journal-library-list">
              {hashtagLibrary.slice(0, 8).map((group) => (
                <div key={group.tag} className="journal-library-item">
                  <strong>{group.tag}</strong>
                  <span>{group.count}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </GlassCard>
  );
};
