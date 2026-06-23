export type JournalMood =
  | "great"
  | "good"
  | "normal"
  | "tired"
  | "stressed"
  | "low";

export type JournalTask = {
  id: string;
  text: string;
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