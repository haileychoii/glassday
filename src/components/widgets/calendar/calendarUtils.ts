/**
 * ============================================================
 * [Calendar Utilities] Date Range + Event Placement
 * ============================================================
 * Consumers: CalendarWidget, MonthCalendar, WeekTimeline
 * 역할: local date 계산, week/month cell 생성, event range 판정과 정렬을 담당한다.
 * 결과가 Day Cell, Week Column, Event label 배치를 결정하므로 timezone 변경 시
 * 저장된 CalendarEvent 날짜 해석 전체를 함께 확인한다.
 * ============================================================
 */
import type { CalendarEvent } from "../../../types/dashboard";

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

export const addMonths = (value: string, amount: number) => {
  const date = parseDate(value);
  date.setMonth(date.getMonth() + amount);

  return toLocalDateInput(date);
};

export const getWeekDates = (value: string) => {
  const date = parseDate(value);
  const day = date.getDay();

  // Monday first. Sunday becomes last day.
  const mondayOffset = day === 0 ? -6 : 1 - day;

  return Array.from({ length: 7 }).map((_, index) => {
    const next = new Date(date);
    next.setDate(date.getDate() + mondayOffset + index);

    return toLocalDateInput(next);
  });
};

export const getMonthDates = (value: string) => {
  const date = parseDate(value);
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDate = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0);

  const startDay = firstDate.getDay();
  const mondayFirstStartOffset = startDay === 0 ? -6 : 1 - startDay;

  const gridStart = new Date(firstDate);
  gridStart.setDate(firstDate.getDate() + mondayFirstStartOffset);

  const dates: string[] = [];

  for (let i = 0; i < 42; i += 1) {
    const next = new Date(gridStart);
    next.setDate(gridStart.getDate() + i);
    dates.push(toLocalDateInput(next));
  }

  return {
    dates,
    currentMonth: `${year}-${String(month + 1).padStart(2, "0")}`,
    firstDate: toLocalDateInput(firstDate),
    lastDate: toLocalDateInput(lastDate),
  };
};

export const chunkWeeks = (dates: string[]) => {
  const weeks: string[][] = [];

  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }

  return weeks;
};

export const eventTouchesDate = (event: CalendarEvent, date: string) => {
  return event.startDate <= date && event.endDate >= date;
};

export const eventTouchesRange = (
  event: CalendarEvent,
  rangeStart: string,
  rangeEnd: string
) => {
  return event.startDate <= rangeEnd && event.endDate >= rangeStart;
};

export const sortEvents = (events: CalendarEvent[]) => {
  return [...events].sort((a, b) => {
    const aValue = `${a.startDate} ${a.startTime}`;
    const bValue = `${b.startDate} ${b.startTime}`;

    return aValue.localeCompare(bValue);
  });
};

export const formatEventTime = (event: CalendarEvent) => {
  if (event.startDate === event.endDate) {
    return `${event.startTime}–${event.endTime}`;
  }

  return `${event.startDate} ${event.startTime} → ${event.endDate} ${event.endTime}`;
};

export const getWeekdayLabel = (date: string) => {
  const labels = ["일", "월", "화", "수", "목", "금", "토"];
  return labels[parseDate(date).getDay()];
};

export const getShortDateLabel = (date: string) => {
  const parsed = parseDate(date);
  return `${parsed.getMonth() + 1}/${parsed.getDate()}`;
};

export const getMinutesFromTime = (time: string) => {
  const [hour = "0", minute = "0"] = time.split(":");

  return Number(hour) * 60 + Number(minute);
};

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};
