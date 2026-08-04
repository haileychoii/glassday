/**
 * ============================================================
 * [Domain Types] Active Daily Journal Model
 * ============================================================
 *
 * Consumer: src/components/widgets/DailyJournalWidget.tsx 및 journalUtils
 * Persistence: glassday.journal.entries.v1
 *
 * Figma Mapping:
 * - JournalEntry = 날짜별 Journal Screen state
 * - todayTasks/tomorrowTasks = Task Row Component list
 * - energy/focus/sleepy/stress = Condition Stepper Variant
 * - clips = Saved Clip Row list
 *
 * 날짜를 바꾸면 이 model 한 record 전체가 교체되어 Summary와 section이 함께 갱신된다.
 * ============================================================
 */
export type JournalMood =
  | "great"
  | "good"
  | "normal"
  | "tired"
  | "stressed"
  | "low";

export type JournalTask = {
  /** Task Row key. */
  id: string;
  /** Task Row의 editable label. */
  text: string;
  /** Checkbox 및 Completed visual state. */
  done: boolean;
};

export type JournalClip = {
  id: string;
  tag: string;
  text: string;
  source: string;
  date: string;
  createdAt: string;
};

export type JournalEntry = {
  id: string;
  date: string;

  todayTasks: JournalTask[];
  tomorrowTasks: JournalTask[];

  workLog: string;
  learned: string;
  careerMaterial: string;
  memo: string;

  condition: JournalMood;

  energy: number;
  focus: number;
  sleepy: number;
  stress: number;

  reflection: string;
  clips: JournalClip[];
};

export type JournalHashtagGroup = {
  tag: string;
  clips: JournalClip[];
  count: number;
};
