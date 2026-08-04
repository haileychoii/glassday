/**
 * ============================================================
 * [Domain Types] Study 10-minute Planner + Pomodoro
 * ============================================================
 *
 * Consumers:
 * - src/components/widgets/StudyWidget.tsx 및 study/*
 * - src/components/widgets/TimerWidget.tsx, usePomodoroTimer.ts
 *
 * Persistence:
 * - glassday.study.planner.v2가 날짜별 timeline/task/note/goal을 저장한다.
 * - legacy types는 v1 record/task migration을 위해 유지한다.
 *
 * Figma Mapping:
 * - StudyPlannerSubject = Subject Chip/Timeline Cell Variant
 * - StudyDayData = 날짜별 Planner Content Frame state
 * - StudyActiveTimer = Running Timer Variant
 * - StudyPlannerTask = Todo Row Component
 *
 * subject id는 timeline block에 저장되는 durable value이므로 label/color를 바꿔도 유지한다.
 * ============================================================
 */
export type StudyPlannerSubjectId =
  | "economics"
  | "ncs"
  | "accounting"
  | "actuarial"
  | "english"
  | "other";

export type StudyPlannerSubject = {
  id: StudyPlannerSubjectId;
  label: string;
  shortLabel: string;
  color: string;
};

export type StudyPlannerTask = {
  id: string;
  subjectId: StudyPlannerSubjectId;
  text: string;
  estimatedMinutes: number;
  done: boolean;
  createdAt: number;
};

export type StudyLegacyRecordSummary = {
  id: string;
  subjectId: StudyPlannerSubjectId;
  minutes: number;
  problems: number;
  note: string;
};

export type StudyDayData = {
  /** 10분 slot key -> subject id. 칠한 Timeline Cell의 실제 저장값이다. */
  blocks: Record<string, StudyPlannerSubjectId>;
  tasks: StudyPlannerTask[];
  note: string;
  goalMinutes: number;
  legacyRecords?: StudyLegacyRecordSummary[];
  updatedAt: number;
};

export type StudyActiveTimer = {
  date: string;
  subjectId: StudyPlannerSubjectId;
  startedAt: number;
};

export type StudyPlannerStorage = {
  version: 2;
  days: Record<string, StudyDayData>;
  activeTimer: StudyActiveTimer | null;
};

/* Legacy manual-record domain
   Kept only so v1 records/tasks can be migrated without deleting user data.
   새 플래너 UI에서는 아래 레거시 ID를 새 타임라인 블록에 직접 쓰지 않습니다. */
export type StudySubjectId =
  | StudyPlannerSubjectId
  | "soa-fm"
  | "essay"
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
