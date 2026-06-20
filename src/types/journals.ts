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