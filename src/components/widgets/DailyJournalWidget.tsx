import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ClipboardList,
  Hash,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  loadJournalEntries,
  saveJournalEntries,
  todayString,
  updateJournalEntry,
} from "./journal/journalUtils";

const cx = (...classes: Array<string | false | null | undefined>) => {
  return classes.filter(Boolean).join(" ");
};

export const DailyJournalWidget = () => {
  const [entries, setEntries] = useState<JournalEntry[]>(() =>
    loadJournalEntries()
  );
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [newTaskText, setNewTaskText] = useState("");
  const [newTomorrowTaskText, setNewTomorrowTaskText] = useState("");
  const [clipText, setClipText] = useState("");
  const [clipTag, setClipTag] = useState("#자소서소재");

  const entry = useMemo(() => {
    return getOrCreateJournalEntry(entries, selectedDate);
  }, [entries, selectedDate]);

  useEffect(() => {
    saveJournalEntries(entries);
  }, [entries]);

  const progress = getJournalProgress(entry);
  const doneTaskCount = getDoneTodayTaskCount(entry);
  const hashtags = getEntryHashtags(entry);
  const hashtagLibrary = collectHashtagLibrary(entries);

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
          tasks.map((task) => (
            <article
              key={task.id}
              className={cx("journal-task-item", task.done && "is-done")}
            >
              <button
                type="button"
                onClick={() =>
                  updateTask(key, task.id, {
                    done: !task.done,
                  })
                }
                className="journal-task-check"
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

              <button
                type="button"
                onClick={() => deleteTask(key, task.id)}
                className="journal-task-delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </article>
          ))
        )}
      </div>
    );
  };

  return (
    <section className="glass-card daily-journal-widget">
      <div className="journal-header">
        <div className="journal-title-group">
          <div className="glass-card-icon">
            <BookOpen className="w-4 h-4" />
          </div>

          <div>
            <h3>Daily Journal</h3>
            <p>
              {entry.date} · {progress}% filled
            </p>
          </div>
        </div>

        <div className="journal-date-nav">
          <button
            type="button"
            onClick={() =>
              setSelectedDate((prev) => addDaysToDateString(prev, -1))
            }
          >
            ←
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />

          <button
            type="button"
            onClick={() =>
              setSelectedDate((prev) => addDaysToDateString(prev, 1))
            }
          >
            →
          </button>
        </div>
      </div>

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
    </section>
  );
};
