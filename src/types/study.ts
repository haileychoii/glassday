export type StudySubjectId =
  | "actuarial"
  | "soa-fm"
  | "ncs"
  | "essay"
  | "english"
  | "custom";

export type StudySubject = {
  id: StudySubjectId;
  label: string;
  shortLabel: string;
  color: string;
  dailyGoalMinutes: number;
};

export type StudyRecord = {
  id: string;
  date: string;
  subjectId: StudySubjectId;
  minutes: number;
  problems: number;
  note: string;
  createdAt: number;
};

export type StudyTask = {
  id: string;
  date: string;
  subjectId: StudySubjectId;
  text: string;
  estimatedMinutes?: number;
  done: boolean;
  createdAt: number;
};

export type StudyPomodoroMode = "focus" | "short-break" | "long-break";

export type StudyPomodoroState = {
  mode: StudyPomodoroMode;
  remainingSeconds: number;
  isRunning: boolean;
  endsAt: number | null;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
  completedFocusSessions: number;
};
