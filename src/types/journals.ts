/**
 * ============================================================
 * [Legacy Types] Previous Journal Record Shape
 * ============================================================
 *
 * 현재 연결 상태:
 * - 현재 src 내부 import가 없는 이전 Journal model이다.
 * - 실제 DailyJournalWidget은 src/types/journal.ts를 사용한다.
 *
 * 유지 이유:
 * - 과거 데이터 구조와 migration 조사 시 필드 대응을 확인하기 위해 남겨 둔다.
 * - 새 UI/저장 필드는 이 파일이 아니라 활성 journal.ts와 journalUtils를 수정한다.
 * ============================================================
 */
export type JournalMood =
  | "great"
  | "good"
  | "neutral"
  | "tired"
  | "stressed"
  | "low";

export type JournalTask = {
  id: string;
  text: string;
  done: boolean;
};

export type JournalFieldKey =
  | "workDone"
  | "learned"
  | "careerNote"
  | "oneLineReview";

export type JournalTagClip = {
  id: string;
  tag: string;
  text: string;
  field: JournalFieldKey;
  date: string;
  createdAt: number;
};

export type JournalEntry = {
  date: string;
  todayTodos: JournalTask[];
  tomorrowTodos: JournalTask[];
  workDone: string;
  learned: string;
  careerNote: string;
  mood: JournalMood;
  energy: number;
  focus: number;
  sleepiness: number;
  stress: number;
  oneLineReview: string;
  tagClips: JournalTagClip[];
  createdAt: number;
  updatedAt: number;
};

export type JournalEntries = Record<string, JournalEntry>;
