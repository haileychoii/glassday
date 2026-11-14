
/**
 * ============================================================
 * GLASSDAY — DAILY JOURNAL WIDGET
 * File: src/components/widgets/DailyJournalWidget.tsx
 *
 * [연결 구조]
 * App.tsx
 *  └─ WidgetRenderer.tsx
 *      └─ WidgetSlot.tsx
 *          └─ DailyJournalWidget.tsx
 *              └─ GlassCard.tsx
 *
 * [관련 파일]
 * - types/journal.ts
 * - widgets/journal/journalUtils.ts
 * - styles/widgets/journal.css
 * - styles/mobile-journal.css
 * - styles/mobile-finish.css
 *
 * [기능]
 * 1. 날짜별 Journal 불러오기 및 저장
 * 2. Today / Tomorrow 체크리스트
 * 3. Progress, Tasks, Clips 요약
 * 4. Energy / Focus / Sleepy / Stress 점수
 * 5. Condition, Work Log, Learned, Career Material
 * 6. Hashtag Clips, Reflection, Hashtag Library
 * 7. 모바일 Summary 접기/펼치기
 *
 * [레이아웃 정책]
 * - 모바일: Summary는 기본적으로 접힌 상태
 * - PC: Summary는 CSS로 항상 표시
 * - 저장 데이터 구조와 기존 Storage Key는 변경하지 않음
 * - 기존 CSS 클래스명을 최대한 유지해 테마 호환성 확보
 * ============================================================
 */

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
  X,
} from "lucide-react";

import { useEffect, useId, useMemo, useState } from "react";

import { GlassCard } from "../glass/GlassCard";

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

/**
 * 조건에 맞는 클래스만 결합하는 공통 도우미.
 * Today/Tomorrow task의 완료 및 삭제 상태에 사용.
 */
const cx = (
  ...classes: Array<string | false | null | undefined>
) => classes.filter(Boolean).join(" ");

/**
 * Daily Journal 메인 컴포넌트.
 *
 * PC와 모바일에서 동일한 데이터 및 위젯 인스턴스를 사용한다.
 * 화면 모양만 CSS가 구분한다.
 */
export const DailyJournalWidget = () => {

  // ============================================================
  // 01. JOURNAL DATA STATE
  // ============================================================

  /** 저장된 날짜별 기록 */
  const [entries, setEntries] = useState<JournalEntry[]>(
    () => loadJournalEntries()
  );

  /** 현재 보고 있는 날짜 */
  const [selectedDate, setSelectedDate] = useState(todayString());

  /** 새 할 일 입력 */
  const [newTaskText, setNewTaskText] = useState("");

  /** 내일 할 일 입력 */
  const [newTomorrowTaskText, setNewTomorrowTaskText] = useState("");

  /** 클립 입력 */
  const [clipText, setClipText] = useState("");
  const [clipTag, setClipTag] = useState("#자소서소재");

  /** 삭제 확인 중인 체크리스트 항목 */
  const [pendingDeleteTaskId, setPendingDeleteTaskId] =
    useState<string | null>(null);

  /**
   * 모바일 Summary 접기/펼치기.
   *
   * false: 모바일에서는 접힌 상태로 시작.
   * true: 모바일에서 Progress / Tasks / Clips / Scores 표시.
   *
   * PC에서는 CSS가 Summary를 항상 보이게 한다.
   * 별도 저장하지 않는 일시적인 UI 상태다.
   */
  const [summaryOpen, setSummaryOpen] = useState(false);

  /**
   * Summary 버튼과 콘텐츠를 접근성 속성으로 연결.
   * useId는 반드시 컴포넌트 내부에서 호출한다.
   */
  const summaryPanelId = useId();

  // ============================================================
  // 02. ACTIVE ENTRY / DERIVED VALUES
  // ============================================================

  /** 선택한 날짜에 해당하는 JournalEntry */
  const entry = useMemo(
    () => getOrCreateJournalEntry(entries, selectedDate),
    [entries, selectedDate]
  );

  /** 데이터 변경 시 기존 저장 함수로 기록 */
  useEffect(() => {
    saveJournalEntries(entries);
  }, [entries]);

  /** 요약 표시용 계산값 */
  const progress = getJournalProgress(entry);
  const doneTaskCount = getDoneTodayTaskCount(entry);
  const hashtags = getEntryHashtags(entry);
  const hashtagLibrary = collectHashtagLibrary(entries);

  // ============================================================
  // 03. DATA UPDATE HELPERS
  // ============================================================

  /**
   * 선택한 날짜의 일부 필드만 변경한다.
   *
   * 기존 journalUtils의 updateJournalEntry를 그대로 사용.
   * Storage Key나 데이터 형태는 변경하지 않는다.
   */
  const updateEntry = (patch: Partial<JournalEntry>) => {
    setEntries((prev) =>
      updateJournalEntry(prev, selectedDate, patch)
    );
  };

  /**
   * Energy / Focus / Sleepy / Stress 점수 조절.
   * 점수는 기존 범위인 1~5를 유지한다.
   */
  const adjustScore = (
    key: "energy" | "focus" | "sleepy" | "stress",
    delta: number
  ) => {
    const nextValue = Math.min(
      5,
      Math.max(1, entry[key] + delta)
    );

    updateEntry({
      [key]: nextValue,
    } as Partial<JournalEntry>);
  };

  /**
   * Today / Tomorrow 체크리스트 항목 업데이트.
   *
   * 완료 토글과 텍스트 수정에 공통 사용.
   */
  const updateTask = (
    key: "todayTasks" | "tomorrowTasks",
    taskId: string,
    patch: Partial<JournalTask>
  ) => {
    updateEntry({
      [key]: entry[key].map((task) =>
        task.id === taskId
          ? { ...task, ...patch }
          : task
      ),
    } as Partial<JournalEntry>);
  };

  /** 체크리스트 항목 삭제 */
  const deleteTask = (
    key: "todayTasks" | "tomorrowTasks",
    taskId: string
  ) => {
    updateEntry({
      [key]: entry[key].filter(
        (task) => task.id !== taskId
      ),
    } as Partial<JournalEntry>);

    setPendingDeleteTaskId(null);
  };

  /** Today / Tomorrow 새 할 일 추가 */
  const addTask = (
    key: "todayTasks" | "tomorrowTasks",
    text: string
  ) => {
    const trimmed = text.trim();

    if (!trimmed) return;

    updateEntry({
      [key]: [
        ...entry[key],
        createJournalTask(trimmed),
      ],
    } as Partial<JournalEntry>);
  };

  /** 새 해시태그 클립 저장 */
  const addClip = () => {
    const text = clipText.trim();

    if (!text) return;

    const nextEntry = createClipFromSelection({
      entry,
      tag: clipTag,
      text,
      source: "daily-journal",
    });

    setEntries((prev) =>
      updateJournalEntry(prev, selectedDate, nextEntry)
    );

    setClipText("");
  };

  /** 저장한 클립 삭제 */
  const deleteClip = (clipId: string) => {
    updateEntry({
      clips: entry.clips.filter(
        (clip) => clip.id !== clipId
      ),
    });
  };

  /**
   * 업무/학습/자소서/회고 텍스트에 해시태그 추가.
   * 기존 journalUtils의 중복 태그 처리 방식을 유지한다.
   */
  const applyTagToField = (
    field:
      | "workLog"
      | "learned"
      | "careerMaterial"
      | "memo"
      | "reflection",
    tag: string
  ) => {
    updateEntry({
      [field]: applyHashtagToText(entry[field], tag),
    } as Partial<JournalEntry>);
  };

  // ============================================================
  // 04. TASK LIST RENDERER
  // ============================================================

  /**
   * Today와 Tomorrow에서 공유하는 체크리스트 UI.
   *
   * journal-task-item 클래스는 widgets/journal.css와 연결된다.
   * 별도의 컴포넌트나 불필요한 래퍼를 만들지 않는다.
   */
  const renderTaskList = (
    key: "todayTasks" | "tomorrowTasks",
    tasks: JournalTask[]
  ) => (
    <div className="journal-task-list">
      {tasks.length === 0 ? (
        <div className="journal-empty-box">
          아직 체크리스트가 비어 있어.
        </div>
      ) : (
        tasks.map((task) => {
          const isDeletePending =
            pendingDeleteTaskId === task.id;

          return (
            <article
              key={task.id}
              className={cx(
                "journal-task-item",
                task.done && "is-done",
                isDeletePending && "is-delete-pending"
              )}
            >
              {/* 완료 여부 변경 */}
              <button
                type="button"
                className="journal-task-check"
                aria-label={
                  task.done
                    ? "Mark task incomplete"
                    : "Mark task done"
                }
                onClick={() =>
                  updateTask(key, task.id, {
                    done: !task.done,
                  })
                }
              >
                {task.done && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>

              {/* 할 일 텍스트 편집 */}
              <input
                value={task.text}
                aria-label="Edit task"
                onChange={(event) =>
                  updateTask(key, task.id, {
                    text: event.target.value,
                  })
                }
              />

              {/* 실수로 삭제하지 않도록 확인 단계 유지 */}
              {isDeletePending ? (
                <div className="journal-task-delete-confirm">
                  <button
                    type="button"
                    onClick={() =>
                      deleteTask(key, task.id)
                    }
                    aria-label="Delete task"
                  >
                    <Check className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPendingDeleteTaskId(null)
                    }
                    aria-label="Cancel delete"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="journal-task-delete-select"
                  onClick={() =>
                    setPendingDeleteTaskId(task.id)
                  }
                  aria-label="Select task for delete"
                />
              )}
            </article>
          );
        })
      )}
    </div>
  );

  // ============================================================
  // 05. JOURNAL WIDGET UI
  // ============================================================

  return (
    <GlassCard
      className="daily-journal-widget"
      title="Daily Journal"
      subtitle={`${entry.date} · ${progress}% filled`}
      icon={<BookOpen className="w-4 h-4" />}
      actions={
        /*
         * 날짜 탐색은 기존 GlassCard의 actions를 재사용한다.
         * 모바일 헤더의 크기/배치는 mobile-journal.css에서 담당한다.
         */
        <div className="journal-date-nav">
          <button
            type="button"
            aria-label="Previous journal date"
            onClick={() =>
              setSelectedDate((prev) =>
                addDaysToDateString(prev, -1)
              )
            }
          >
            ←
          </button>

          <input
            type="date"
            value={selectedDate}
            aria-label="Select journal date"
            onChange={(event) =>
              setSelectedDate(event.target.value)
            }
          />

          <button
            type="button"
            aria-label="Next journal date"
            onClick={() =>
              setSelectedDate((prev) =>
                addDaysToDateString(prev, 1)
              )
            }
          >
            →
          </button>
        </div>
      }
    >
      <div className="journal-content">

        {/* ==================================================
            06. SUMMARY TOGGLE
            모바일에서만 표시되는 접기/펼치기 버튼.
            PC에서는 CSS로 숨긴다.
           ================================================== */}

        <button
          type="button"
          className="journal-summary-toggle"
          aria-expanded={summaryOpen}
          aria-controls={summaryPanelId}
          onClick={() =>
            setSummaryOpen((prev) => !prev)
          }
        >
          <span>Summary</span>

          <span>
            {progress}% · Tasks{" "}
            {doneTaskCount}/{entry.todayTasks.length}
            {" · "}
            {summaryOpen ? "접기 −" : "펼치기 +"}
          </span>
        </button>

        {/* ==================================================
            07. SUMMARY CONTENT
            기존 3개 지표 + 4개 Condition 점수 유지.

            모바일:
              data-mobile-open="false" → CSS로 숨김.
              data-mobile-open="true"  → 펼침.

            PC:
              data 속성과 관계없이 항상 표시.
           ================================================== */}

        <div
          id={summaryPanelId}
          className="journal-summary-row"
          data-mobile-open={
            summaryOpen ? "true" : "false"
          }
        >
          {/* 진행률 */}
          <div className="journal-summary-card">
            <span>Progress</span>
            <strong>{progress}%</strong>
          </div>

          {/* 완료한 할 일 / 총 할 일 */}
          <div className="journal-summary-card">
            <span>Tasks</span>
            <strong>
              {doneTaskCount}/{entry.todayTasks.length}
            </strong>
          </div>

          {/* 저장된 클립 개수 */}
          <div className="journal-summary-card">
            <span>Clips</span>
            <strong>{entry.clips.length}</strong>
          </div>

          {/* 컨디션 점수: 기존 데이터와 계산 방식 유지 */}
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
                <div
                  key={key}
                  className={`journal-score-inline score-${key}`}
                >
                  <small>{label}</small>

                  <div className="journal-score-stepper">
                    <button
                      type="button"
                      onClick={() =>
                        adjustScore(key, -1)
                      }
                      aria-label={`${label} down`}
                    >
                      -
                    </button>

                    <b>{value}</b>

                    <button
                      type="button"
                      onClick={() =>
                        adjustScore(key, 1)
                      }
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

        {/* ==================================================
            08. JOURNAL CONTENT
            Today / Tomorrow / Work Log / Learned 등

            모바일은 mobile-journal.css에서
            Summary와 기록이 함께 스크롤되도록 설정한다.
           ================================================== */}

        <div className="journal-main-scroll">

          {/* --------------------------------------------------
              TODAY TASKS
             -------------------------------------------------- */}

          <section className="journal-section">
            <div className="journal-section-title">
              <ClipboardList className="w-3.5 h-3.5" />
              Today Tasks
            </div>

            <div className="journal-add-row">
              <input
                value={newTaskText}
                placeholder="오늘 할 일"
                onChange={(event) =>
                  setNewTaskText(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addTask("todayTasks", newTaskText);
                    setNewTaskText("");
                  }
                }}
              />

              <button
                type="button"
                aria-label="Add today task"
                onClick={() => {
                  addTask("todayTasks", newTaskText);
                  setNewTaskText("");
                }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {renderTaskList(
              "todayTasks",
              entry.todayTasks
            )}
          </section>

          {/* --------------------------------------------------
              TOMORROW TASKS
             -------------------------------------------------- */}

          <section className="journal-section">
            <div className="journal-section-title">
              <CalendarDays className="w-3.5 h-3.5" />
              Tomorrow
            </div>

            <div className="journal-add-row">
              <input
                value={newTomorrowTaskText}
                placeholder="내일 할 일"
                onChange={(event) =>
                  setNewTomorrowTaskText(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addTask(
                      "tomorrowTasks",
                      newTomorrowTaskText
                    );
                    setNewTomorrowTaskText("");
                  }
                }}
              />

              <button
                type="button"
                aria-label="Add tomorrow task"
                onClick={() => {
                  addTask(
                    "tomorrowTasks",
                    newTomorrowTaskText
                  );
                  setNewTomorrowTaskText("");
                }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {renderTaskList(
              "tomorrowTasks",
              entry.tomorrowTasks
            )}
          </section>

          {/* --------------------------------------------------
              CONDITION
              오늘의 상태 선택 (기존 JournalMood 타입)
             -------------------------------------------------- */}

          <section className="journal-section">
            <div className="journal-section-title">
              <Sparkles className="w-3.5 h-3.5" />
              Condition
            </div>

            <select
              className="journal-mood-select"
              value={entry.condition}
              onChange={(event) =>
                updateEntry({
                  condition:
                    event.target.value as JournalMood,
                })
              }
            >
              {journalMoodOptions.map((mood) => (
                <option key={mood} value={mood}>
                  {journalMoodLabels[mood]}
                </option>
              ))}
            </select>
          </section>

          {/* --------------------------------------------------
              WORK LOG
              업무 기록 및 태그
             -------------------------------------------------- */}

          <section className="journal-section">
            <div className="journal-section-title">
              <BriefcaseBusiness className="w-3.5 h-3.5" />
              Work Log
            </div>

            <textarea
              value={entry.workLog}
              placeholder="오늘 한 업무 / 회사에서 처리한 일"
              onChange={(event) =>
                updateEntry({
                  workLog: event.target.value,
                })
              }
            />

            <div className="journal-tag-tools">
              <button
                type="button"
                onClick={() =>
                  applyTagToField("workLog", "#업무")
                }
              >
                #업무
              </button>

              <button
                type="button"
                onClick={() =>
                  applyTagToField("workLog", "#성과")
                }
              >
                #성과
              </button>
            </div>
          </section>

          {/* --------------------------------------------------
              LEARNED
              학습 기록 및 태그
             -------------------------------------------------- */}

          <section className="journal-section">
            <div className="journal-section-title">
              <BookOpen className="w-3.5 h-3.5" />
              Learned
            </div>

            <textarea
              value={entry.learned}
              placeholder="오늘 배운 것 / 공부하면서 알게 된 것"
              onChange={(event) =>
                updateEntry({
                  learned: event.target.value,
                })
              }
            />

            <div className="journal-tag-tools">
              <button
                type="button"
                onClick={() =>
                  applyTagToField("learned", "#공부")
                }
              >
                #공부
              </button>

              <button
                type="button"
                onClick={() =>
                  applyTagToField("learned", "#개념")
                }
              >
                #개념
              </button>
            </div>
          </section>

          {/* --------------------------------------------------
              CAREER MATERIAL
              자기소개서/면접용 경험 기록
             -------------------------------------------------- */}

          <section className="journal-section">
            <div className="journal-section-title">
              <BriefcaseBusiness className="w-3.5 h-3.5" />
              Career Material
            </div>

            <textarea
              value={entry.careerMaterial}
              placeholder="자소서 소재 / 면접 답변으로 쓸 만한 경험"
              onChange={(event) =>
                updateEntry({
                  careerMaterial: event.target.value,
                })
              }
            />

            <div className="journal-tag-tools">
              <button
                type="button"
                onClick={() =>
                  applyTagToField(
                    "careerMaterial",
                    "#자소서소재"
                  )
                }
              >
                #자소서소재
              </button>

              <button
                type="button"
                onClick={() =>
                  applyTagToField(
                    "careerMaterial",
                    "#면접소재"
                  )
                }
              >
                #면접소재
              </button>
            </div>
          </section>

          {/* --------------------------------------------------
              CLIP TO HASHTAG LIBRARY
              문장/소재를 태그와 함께 저장
             -------------------------------------------------- */}

          <section className="journal-section">
            <div className="journal-section-title">
              <Hash className="w-3.5 h-3.5" />
              Clip to Hashtag Library
            </div>

            <div className="journal-clip-row">
              <input
                value={clipTag}
                placeholder="#자소서소재"
                onChange={(event) =>
                  setClipTag(event.target.value)
                }
              />

              <button
                type="button"
                onClick={addClip}
              >
                Save Clip
              </button>
            </div>

            <textarea
              value={clipText}
              placeholder="모아둘 문장이나 소재를 적고 태그로 저장"
              onChange={(event) =>
                setClipText(event.target.value)
              }
            />

            <div className="journal-clip-list">
              {entry.clips.length === 0 ? (
                <div className="journal-empty-box">
                  아직 저장한 클립이 없어.
                </div>
              ) : (
                entry.clips.map(
                  (clip: JournalClip) => (
                    <article
                      key={clip.id}
                      className="journal-clip-item"
                    >
                      <div>
                        <strong>{clip.tag}</strong>
                        <span>{clip.text}</span>
                      </div>

                      <button
                        type="button"
                        aria-label="Delete clip"
                        onClick={() =>
                          deleteClip(clip.id)
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </article>
                  )
                )
              )}
            </div>
          </section>

          {/* --------------------------------------------------
              REFLECTION
              하루 회고
             -------------------------------------------------- */}

          <section className="journal-section">
            <div className="journal-section-title">
              <Sparkles className="w-3.5 h-3.5" />
              Reflection
            </div>

            <textarea
              value={entry.reflection}
              placeholder="오늘의 한 줄 회고"
              onChange={(event) =>
                updateEntry({
                  reflection: event.target.value,
                })
              }
            />

            <div className="journal-tag-tools">
              <button
                type="button"
                onClick={() =>
                  applyTagToField(
                    "reflection",
                    "#회고"
                  )
                }
              >
                #회고
              </button>
            </div>
          </section>

          {/* --------------------------------------------------
              HASHTAGS
              날짜별 태그 + 기존 라이브러리 목록
             -------------------------------------------------- */}

          <section className="journal-section">
            <div className="journal-section-title">
              <Hash className="w-3.5 h-3.5" />
              Hashtags
            </div>

            <div className="journal-hashtag-row">
              {hashtags.length === 0 ? (
                <span className="journal-muted">
                  No hashtags yet
                </span>
              ) : (
                hashtags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))
              )}
            </div>

            <div className="journal-library-list">
              {hashtagLibrary
                .slice(0, 8)
                .map((group) => (
                  <div
                    key={group.tag}
                    className="journal-library-item"
                  >
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
