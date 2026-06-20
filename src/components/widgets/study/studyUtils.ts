import type { StudyRecord, StudySubjectId, StudyTask } from "../../../types/study";

export const toLocalDateInput = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const parseDate = (value: string) => {
  return new Date(`${value}T00:00:00`);
};

export const addDays = (value: string, amount: number) => {
  const date = parseDate(value);
  date.setDate(date.getDate() + amount);

  return toLocalDateInput(date);
};

export const getWeekDates = (value: string) => {
  const date = parseDate(value);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  return Array.from({ length: 7 }).map((_, index) => {
    const next = new Date(date);
    next.setDate(date.getDate() + mondayOffset + index);

    return toLocalDateInput(next);
  });
};

export const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const getSubjectMinutes = (
  records: StudyRecord[],
  subjectId: StudySubjectId,
  date: string
) => {
  return records
    .filter((record) => record.date === date && record.subjectId === subjectId)
    .reduce((sum, record) => sum + record.minutes, 0);
};

export const getSubjectProblems = (
  records: StudyRecord[],
  subjectId: StudySubjectId,
  date: string
) => {
  return records
    .filter((record) => record.date === date && record.subjectId === subjectId)
    .reduce((sum, record) => sum + record.problems, 0);
};

export const getTotalMinutesByDate = (records: StudyRecord[], date: string) => {
  return records
    .filter((record) => record.date === date)
    .reduce((sum, record) => sum + record.minutes, 0);
};

export const getTotalProblemsByDate = (records: StudyRecord[], date: string) => {
  return records
    .filter((record) => record.date === date)
    .reduce((sum, record) => sum + record.problems, 0);
};

export const getTasksByDate = (tasks: StudyTask[], date: string) => {
  return tasks.filter((task) => task.date === date);
};

export const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours <= 0) return `${rest}m`;
  if (rest <= 0) return `${hours}h`;

  return `${hours}h ${rest}m`;
};