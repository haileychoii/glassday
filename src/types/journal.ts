export type JournalMood =
  | "완전 좋음"
  | "괜찮음"
  | "보통"
  | "피곤함"
  | "스트레스"
  | "저조함";

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
  condition: JournalMood;
  energy: number;
  focus: number;
  sleepy: number;
  stress: number;
  reflection: string;
  clips: JournalClip[];
};