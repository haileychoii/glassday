import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  GraduationCap,
  Hash,
  HeartPulse,
  NotebookPen,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";

import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";
import type {
  JournalEntries,
  JournalEntry,
  JournalFieldKey,
  JournalTask,
} from "../../types/journal";
import {
  addDays,
  collectJournalTagItems,
  collectJournalTags,
  createJournalTask,
  createTagClip,
  extractTagsFromText,
  getDoneTaskCount,
  getFieldLabel,
  getJournalCompletion,
  moodEmojis,
  moodLabels,
  normalizeJournalEntry,
  normalizeTag,
  toLocalDateInput,
} from "./journal/journalUtils";

const scoreLabels = [
  { key: "energy", label: "Energy" },
  { key: "focus", label: "Focus" },
  { key: "sleepiness", label: "Sleepy" },
  { key: "stress", label: "Stress" },
] as const;

type SelectionState = {
  field: JournalFieldKey;
  start: number;
  end: number;
  text: string;
} | null;

const fieldPlaceholders: Record<JournalFieldKey, string> = {
  workDone:
    "예: #업무 Treaty/CL 검토, LCF 확인, ER Group 데이터 정리, SQL/Excel 검증...",
  learned:
    "예: #IFRS17 재보험 계약 구조, #SOAFM force of interest, #NCS 빠른 계산 팁...",
  careerNote:
    "예: #자소서소재 문제 발견, 개선, 협업, 검증, 자동화 등 나중에 쓸 만한 포인트",
  oneLineReview: "예: #회고 오늘은 검증 로직을 더 구조적으로 이해했다.",
};

export const DailyJournalWidget = () => {
  const today = toLocalDateInput();

  const [selectedDate, setSelectedDate] = useState(today);
  const [tagInput, setTagInput] = useState("업무");
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [selection, setSelection] = useState<SelectionState>(null);

  const workDoneRef = useRef<HTMLTextAreaElement | null>(null);
  const learnedRef = useRef<HTMLTextAreaElement | null>(null);
  const careerNoteRef = useRef<HTMLTextAreaElement | null>(null);
  const reviewRef = useRef<HTMLInputElement | null>(null);

  const { value: storedEntries, setValue: setEntries } =
    useLocalStorage<JournalEntries>("glassday.journal.entries.v1", {});

  const entries =
    storedEntries && typeof storedEntries === "object" ? storedEntries : {};

  const entry = useMemo<JournalEntry>(() => {
    return normalizeJournalEntry(entries[selectedDate], selectedDate);
  }, [entries, selectedDate]);

  const completion = getJournalCompletion(entry);
  const doneToday = getDoneTaskCount(entry.todayTodos);

  const allTags = useMemo(() => collectJournalTags(entries), [entries]);

  const tagItems = useMemo(
    () => collectJournalTagItems(entries, selectedTag),
    [entries, selectedTag]
  );

  const currentDateTags = useMemo(() => {
    const tags = [
      ...extractTagsFromText(entry.workDone),
      ...extractTagsFromText(entry.learned),
      ...extractTagsFromText(entry.careerNote),
      ...extractTagsFromText(entry.oneLineReview),
      ...(entry.tagClips ?? []).map((clip) => clip.tag),
    ].filter(Boolean);

    return [...new Set(tags)];
  }, [entry]);

  const visibleTags = selectedTag ? [selectedTag] : allTags.slice(0, 14);

  const updateEntry = (patch: Partial<JournalEntry>) => {
    setEntries((prev) => {
      const safePrev = prev && typeof prev === "object" ? prev : {};
      const current = normalizeJournalEntry(safePrev[selectedDate], selectedDate);

      return {
        ...safePrev,
        [selectedDate]: {
          ...current,
          ...patch,
          updatedAt: Date.now(),
        },
      };
    });
  };

  const updateTaskList = (
    listName: "todayTodos" | "tomorrowTodos",
    nextTasks: JournalTask[]
  ) => {
    updateEntry({
      [listName]: nextTasks,
    } as Partial<JournalEntry>);
  };

  const addTask = (listName: "todayTodos" | "tomorrowTodos") => {
    updateTaskList(listName, [
      ...entry[listName],
      createJournalTask("New task"),
    ]);
  };

  const updateTask = (
    listName: "todayTodos" | "tomorrowTodos",
    taskId: string,
    patch: Partial<JournalTask>
  ) => {
    updateTaskList(
      listName,
      entry[listName].map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...patch,
            }
          : task
      )
    );
  };

  const removeTask = (
    listName: "todayTodos" | "tomorrowTodos",
    taskId: string
  ) => {
    updateTaskList(
      listName,
      entry[listName].filter((task) => task.id !== taskId)
    );
  };

  const captureSelection = (
    field: JournalFieldKey,
    element: HTMLTextAreaElement | HTMLInputElement
  ) => {
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    const text = element.value.slice(start, end);

    if (!text.trim() || start === end) {
      setSelection(null);
      return;
    }

    setSelection({
      field,
      start,
      end,
      text,
    });
  };

  const applyTagToSelection = () => {
    const tag = normalizeTag(tagInput);

    if (!tag || !selection?.text.trim()) return;

    const newClip = createTagClip({
      tag,
      text: selection.text,
      field: selection.field,
      date: selectedDate,
    });

    updateEntry({
      tagClips: [...(entry.tagClips ?? []), newClip],
    });

    setSelectedTag(tag);
  };

  const insertTagAtCursor = (field: JournalFieldKey) => {
    const tag = normalizeTag(tagInput);

    if (!tag) return;

    const refs: Record<
      JournalFieldKey,
      HTMLTextAreaElement | HTMLInputElement | null
    > = {
      workDone: workDoneRef.current,
      learned: learnedRef.current,
      careerNote: careerNoteRef.current,
      oneLineReview: reviewRef.current,
    };

    const element = refs[field];
    if (!element) return;

    const currentValue = String(entry[field] ?? "");
    const start = element.selectionStart ?? currentValue.length;
    const end = element.selectionEnd ?? currentValue.length;

    const before = currentValue.slice(0, start);
    const after = currentValue.slice(end);

    const prefix =
      before.length === 0 || before.endsWith(" ") || before.endsWith("\n")
        ? ""
        : " ";

    const suffix =
      after.length === 0 || after.startsWith(" ") || after.startsWith("\n")
        ? ""
        : " ";

    const inserted = `${before}${prefix}#${tag}${suffix}${after}`;

    updateEntry({
      [field]: inserted,
    } as Partial<JournalEntry>);

    setSelectedTag(tag);

    window.setTimeout(() => {
      element.focus();
      const nextCursor = before.length + prefix.length + tag.length + 1 + suffix.length;
      element.setSelectionRange(nextCursor, nextCursor);
    }, 0);
  };

  const removeTagClip = (clipId: string) => {
    updateEntry({
      tagClips: (entry.tagClips ?? []).filter((clip) => clip.id !== clipId),
    });
  };

  const renderTaskList = (
    listName: "todayTodos" | "tomorrowTodos",
    title: string,
    icon: ReactNode
  ) => {
    const tasks = entry[listName];

    return (
      <section className="journal-section journal-task-section">
        <div className="journal-section-title">
          {icon}
          <span>{title}</span>

          <button
            type="button"
            onClick={() => addTask(listName)}
            className="journal-mini-add"
            title="Add task"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <div className="journal-task-list">
          {tasks.length === 0 ? (
            <div className="journal-task-empty">아직 등록된 할 일이 없어.</div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={cn("journal-task", task.done && "is-done")}
              >
                <button
                  type="button"
                  onClick={() =>
                    updateTask(listName, task.id, {
                      done: !task.done,
                    })
                  }
                  className="journal-task-check"
                  title={task.done ? "Mark undone" : "Mark done"}
                >
                  {task.done ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                </button>

                <input
                  value={task.text}
                  onChange={(event) =>
                    updateTask(listName, task.id, {
                      text: event.target.value,
                    })
                  }
                  spellCheck={false}
                  placeholder="할 일 입력"
                />

                <button
                  type="button"
                  onClick={() => removeTask(listName, task.id)}
                  className="journal-task-delete"
                  title="Delete task"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    );
  };

  const renderTextareaSection = ({
    field,
    title,
    icon,
    refObject,
  }: {
    field: Exclude<JournalFieldKey, "oneLineReview">;
    title: string;
    icon: ReactNode;
    refObject: React.RefObject<HTMLTextAreaElement | null>;
  }) => {
    return (
      <section className="journal-section journal-text-section">
        <div className="journal-section-title">
          {icon}
          <span>{title}</span>

          <button
            type="button"
            onClick={() => insertTagAtCursor(field)}
            className="journal-mini-add"
            title="Insert hashtag"
          >
            <Hash className="w-3 h-3" />
          </button>
        </div>

        <textarea
          ref={refObject}
          value={String(entry[field] ?? "")}
          onChange={(event) =>
            updateEntry({
              [field]: event.target.value,
            } as Partial<JournalEntry>)
          }
          onSelect={(event: ChangeEvent<HTMLTextAreaElement>) =>
            captureSelection(field, event.currentTarget)
          }
          onMouseUp={(event) => captureSelection(field, event.currentTarget)}
          onKeyUp={(event) => captureSelection(field, event.currentTarget)}
          spellCheck={false}
          placeholder={fieldPlaceholders[field]}
        />
      </section>
    );
  };

  return (
    <GlassCard
      title="Daily Journal"
      subtitle={`${selectedDate} · ${completion}% logged`}
      icon={<NotebookPen className="w-4 h-4" />}
      actions={
        <button
          type="button"
          onClick={() => setSelectedDate(today)}
          className="glass-button h-8 px-3 text-xs"
        >
          Today
        </button>
      }
    >
      <div className="daily-journal">
        <section className="journal-hero">
          <div>
            <div className="journal-kicker">Work Log</div>
            <div className="journal-main">
              {moodEmojis[entry.mood]} {moodLabels[entry.mood]}
            </div>
            <div className="journal-sub">
              {doneToday}/{entry.todayTodos.length} tasks · {completion}% filled
            </div>
          </div>

          <div className="journal-progress-ring">
            <span>{completion}%</span>
          </div>
        </section>

        <section className="journal-date-row">
          <button
            type="button"
            onClick={() => setSelectedDate((prev) => addDays(prev, -1))}
            className="journal-date-button"
            title="Previous day"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="journal-date-input"
          />

          <button
            type="button"
            onClick={() => setSelectedDate((prev) => addDays(prev, 1))}
            className="journal-date-button"
            title="Next day"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </section>

        <section className="journal-tag-tools">
          <div className="journal-tag-input-wrap">
            <Tag className="w-3.5 h-3.5" />
            <input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              spellCheck={false}
              placeholder="업무, IFRS17, 자소서소재..."
            />
          </div>

          <button
            type="button"
            onClick={applyTagToSelection}
            disabled={!selection?.text.trim()}
            className="journal-tag-apply-button"
          >
            선택 영역에 #{normalizeTag(tagInput) || "tag"} 적용
          </button>

          <div className="journal-selection-preview">
            {selection?.text.trim()
              ? `선택됨: ${selection.text.slice(0, 34)}${
                  selection.text.length > 34 ? "..." : ""
                }`
              : "텍스트를 드래그로 선택하면 태그 클립으로 저장 가능"}
          </div>
        </section>

        {currentDateTags.length > 0 && (
          <section className="journal-current-tags">
            {currentDateTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setSelectedTag((prev) => (prev === tag ? undefined : tag))
                }
                className={cn(
                  "journal-tag-chip",
                  selectedTag === tag && "is-active"
                )}
              >
                #{tag}
              </button>
            ))}
          </section>
        )}

        <div className="journal-two-column">
          {renderTaskList(
            "todayTodos",
            "오늘 할 일",
            <Check className="w-3.5 h-3.5" />
          )}

          {renderTaskList(
            "tomorrowTodos",
            "내일 할 일",
            <CalendarDays className="w-3.5 h-3.5" />
          )}
        </div>

        <div className="journal-two-column">
          {renderTextareaSection({
            field: "workDone",
            title: "회사에서 한 일",
            icon: <BriefcaseBusiness className="w-3.5 h-3.5" />,
            refObject: workDoneRef,
          })}

          {renderTextareaSection({
            field: "learned",
            title: "오늘 배운 것",
            icon: <GraduationCap className="w-3.5 h-3.5" />,
            refObject: learnedRef,
          })}
        </div>

        {renderTextareaSection({
          field: "careerNote",
          title: "자소서/커리어 소재",
          icon: <Sparkles className="w-3.5 h-3.5" />,
          refObject: careerNoteRef,
        })}

        <section className="journal-section journal-condition-section">
          <div className="journal-section-title">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>기분 / 컨디션</span>
          </div>

          <div className="journal-mood-row">
            {Object.entries(moodLabels).map(([mood, label]) => (
              <button
                key={mood}
                type="button"
                onClick={() =>
                  updateEntry({
                    mood: mood as JournalEntry["mood"],
                  })
                }
                className={cn(
                  "journal-mood-button",
                  entry.mood === mood && "is-active"
                )}
              >
                <span>{moodEmojis[mood as JournalEntry["mood"]]}</span>
                {label}
              </button>
            ))}
          </div>

          <div className="journal-score-grid">
            {scoreLabels.map((item) => (
              <label key={item.key} className="journal-score-item">
                <span>{item.label}</span>

                <input
                  type="range"
                  min={1}
                  max={5}
                  value={entry[item.key]}
                  onChange={(event) =>
                    updateEntry({
                      [item.key]: Number(event.target.value),
                    } as Partial<JournalEntry>)
                  }
                />

                <strong>{entry[item.key]}</strong>
              </label>
            ))}
          </div>
        </section>

        <section className="journal-section journal-review-section">
          <div className="journal-section-title">
            <NotebookPen className="w-3.5 h-3.5" />
            <span>한 줄 회고</span>

            <button
              type="button"
              onClick={() => insertTagAtCursor("oneLineReview")}
              className="journal-mini-add"
              title="Insert hashtag"
            >
              <Hash className="w-3 h-3" />
            </button>
          </div>

          <input
            ref={reviewRef}
            value={entry.oneLineReview}
            onChange={(event) =>
              updateEntry({
                oneLineReview: event.target.value,
              })
            }
            onSelect={(event: ChangeEvent<HTMLInputElement>) =>
              captureSelection("oneLineReview", event.currentTarget)
            }
            onMouseUp={(event) =>
              captureSelection("oneLineReview", event.currentTarget)
            }
            onKeyUp={(event) =>
              captureSelection("oneLineReview", event.currentTarget)
            }
            spellCheck={false}
            placeholder={fieldPlaceholders.oneLineReview}
          />
        </section>

        <section className="journal-section journal-tag-library">
          <div className="journal-section-title">
            <Search className="w-3.5 h-3.5" />
            <span>Hashtag Library</span>

            {selectedTag && (
              <button
                type="button"
                onClick={() => setSelectedTag(undefined)}
                className="journal-clear-tag"
              >
                전체 보기
              </button>
            )}
          </div>

          <div className="journal-tag-filter-row">
            {visibleTags.length === 0 ? (
              <span className="journal-tag-empty">아직 저장된 태그 없음</span>
            ) : (
              visibleTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setSelectedTag((prev) => (prev === tag ? undefined : tag))
                  }
                  className={cn(
                    "journal-tag-chip",
                    selectedTag === tag && "is-active"
                  )}
                >
                  #{tag}
                </button>
              ))
            )}
          </div>

          <div className="journal-tag-result-list">
            {tagItems.length === 0 ? (
              <div className="journal-tag-empty-card">
                #업무 처럼 직접 쓰거나, 텍스트 일부를 선택해서 태그 클립으로
                저장해봐.
              </div>
            ) : (
              tagItems.slice(0, 14).map((item) => (
                <article key={item.id} className="journal-tag-result">
                  <div className="journal-tag-result-top">
                    <span>#{item.tag}</span>
                    <small>
                      {item.date} · {getFieldLabel(item.field)}
                    </small>
                  </div>

                  <p>{item.text}</p>

                  {item.source === "clip" && item.date === selectedDate && (
                    <button
                      type="button"
                      onClick={() => removeTagClip(item.id)}
                      className="journal-tag-result-delete"
                      title="Delete clip"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </GlassCard>
  );
};