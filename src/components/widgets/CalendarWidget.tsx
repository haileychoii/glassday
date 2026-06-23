import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { GlassCard } from "../glass/GlassCard";
import { cn } from "../../lib/utils";
import { useDashboardData } from "../../context/DashboardDataContext";
import type { CalendarEvent, CalendarView } from "../../types/dashboard";
import { getRandomPastelEventColor } from "../../constants/colors";
import { EventColorPicker } from "./calendar/EventColorPicker";
import { MonthCalendar } from "./calendar/MonthCalendar";
import { WeekTimeline } from "./calendar/WeekTimeline";
import {
  addDays,
  addMonths,
  eventTouchesDate,
  eventTouchesRange,
  formatEventTime,
  getMonthDates,
  getWeekDates,
  sortEvents,
  toLocalDateInput,
} from "./calendar/calendarUtils";

const formatHeaderLabel = (selectedDate: string, view: CalendarView) => {
  if (view === "day") {
    return selectedDate;
  }

  if (view === "week") {
    const weekDates = getWeekDates(selectedDate);
    return `${weekDates[0]} → ${weekDates[6]}`;
  }

  return selectedDate.slice(0, 7);
};

export const CalendarWidget = () => {
  const {
    calendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    removeCalendarEvent,
  } = useDashboardData();

  const [view, setView] = useState<CalendarView>("day");
  const [selectedDate, setSelectedDate] = useState(toLocalDateInput());
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingEvent = editingId
    ? calendarEvents.find((event) => event.id === editingId) ?? null
    : null;

  const visibleEvents = useMemo(() => {
    const sorted = sortEvents(calendarEvents);

    if (view === "day") {
      return sorted.filter((event) => eventTouchesDate(event, selectedDate));
    }

    if (view === "week") {
      const weekDates = getWeekDates(selectedDate);

      return sorted.filter((event) =>
        eventTouchesRange(event, weekDates[0], weekDates[6])
      );
    }

    const monthInfo = getMonthDates(selectedDate);

    return sorted.filter((event) =>
      eventTouchesRange(event, monthInfo.firstDate, monthInfo.lastDate)
    );
  }, [calendarEvents, selectedDate, view]);

  const dayEvents = visibleEvents.filter((event) =>
    eventTouchesDate(event, selectedDate)
  );

  const goPrev = () => {
    if (view === "day") {
      setSelectedDate((prev) => addDays(prev, -1));
      return;
    }

    if (view === "week") {
      setSelectedDate((prev) => addDays(prev, -7));
      return;
    }

    setSelectedDate((prev) => addMonths(prev, -1));
  };

  const goNext = () => {
    if (view === "day") {
      setSelectedDate((prev) => addDays(prev, 1));
      return;
    }

    if (view === "week") {
      setSelectedDate((prev) => addDays(prev, 7));
      return;
    }

    setSelectedDate((prev) => addMonths(prev, 1));
  };

  const createManualEvent = () => {
    const newEvent = addCalendarEvent();

    updateCalendarEvent(newEvent.id, {
     