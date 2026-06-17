import { useMemo, useState } from "react";
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

const toLocalDateInput = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDate = (value: string) => {
  return new Date(`${value}T00:00:00`);
};

const addDays = (value: string, amount: number) => {
  const date = parseDate(value);
  date.setDate(date.getDate() + amount);

  return toLocalDateInput(date);
};

const getWeekDates = (value: string) => {
  const date = parseDate(value);
  const day = date.getDay();

  const mondayOffset = day === 0 ? -6 : 1 - day;

  return Array.from({ length: 7 }).map((_, index) => {
    const next = new Date(date);
    next.setDate(date.getDate() + mondayOffset + index);

    return toLocalDateInput(next);
  });
};

const getMonthDates = (value: string) => {
  const date = parseDate(value);
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDate = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0);

  const startDay = firstDate.getDay();
  const gridStart = new Date(firstDate);
  gridStart.setDate(firstDate.getDate() - startDay);

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

const eventTouchesDate = (event: CalendarEvent, date: string) => {
  return event.startDate <= date && event.endDate >= date;
};

const eventTouchesRange = (
  event: CalendarEvent,
  rangeStart: string,
  rangeEnd: string
) => {
  return event.startDate <= rangeEnd && event.endDate >= rangeStart;
};

const formatEventTime = (event: CalendarEvent) => {
  if (event.startDate === event.endDate) {
    return `${event.startTime}–${event.endTime}`;
  }

  return `${event.startDate} ${event.startTime} → ${event.endDate} ${event.endTime}`;
};

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

const sortEvents = (events: CalendarEvent[]) => {
  return [...events].sort((a, b) => {
    const aValue = `${a.startDate} ${a.startTime}`;
    const bValue = `${b.startDate} ${b.startTime}`;

    return aValue.localeCompare(bValue);
  });
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

  const editingEvent =
    editingId
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

  const monthInfo = useMemo(() => getMonthDates(selectedDate), [selectedDate]);

  const goPrev = () => {
    if (view === "day") {
      setSelectedDate((prev) => addDays(prev, -1));
      return;
    }

    if (view === "week") {
      setSelectedDate((prev) => addDays(prev, -7));
      return;
    }

    const date = parseDate(selectedDate);
    date.setMonth(date.getMonth() - 1);
    setSelectedDate(toLocalDateInput(date));
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

    const date = parseDate(selectedDate);
    date.setMonth(date.getMonth() + 1);
    setSelectedDate(toLocalDateInput(date));
  };

  const createManualEvent = () => {
    const newEvent = addCalendarEvent();

    updateCalendarEvent(newEvent.id, {
      startDate: selectedDate,
      startTime: "09:00",
      endDate: selectedDate,
      endTime: "10:00",
      source: "manual",
    });

    setEditingId(newEvent.id);
  };

  const updateEditingEvent = (patch: Partial<CalendarEvent>) => {
    if (!editingEvent) return;

    updateCalendarEvent(editingEvent.id, patch);
  };

  const dayEventsByDate = (date: string) => {
    return visibleEvents.filter((event) => eventTouchesDate(event, date));
  };

  return (
    <>
      <GlassCard
        title="Calendar"
        subtitle="Manual events + career application windows"
        icon={<CalendarDays className="w-4 h-4" />}
        actions={
          <button
            type="button"
            onClick={createManualEvent}
            className="h-8 w-8 rounded-full bg-white/35 border border-white/50 flex items-center justify-center hover:bg-white/55 transition"
            title="Add event"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        }
      >
        <div className="h-full flex flex-col gap-3">
          <div className="calendar-widget-toolbar">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goPrev}
                className="calendar-nav-button"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="calendar-date-input"
              />

              <button
                type="button"
                onClick={goNext}
                className="calendar-nav-button"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="calendar-view-toggle">
              {(["day", "week", "month"] as CalendarView[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setView(item)}
                  className={cn(
                    "calendar-view-button",
                    view === item && "is-active"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="calendar-current-label">
            {formatHeaderLabel(selectedDate, view)}
          </div>

          {view === "month" ? (
            <div className="calendar-month-grid">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="calendar-month-weekday">
                  {day}
                </div>
              ))}

              {monthInfo.dates.map((date) => {
                const events = dayEventsByDate(date);
                const isToday = date === toLocalDateInput();
                const isCurrentMonth =
                  date.slice(0, 7) === monthInfo.currentMonth;

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date);
                      setView("day");
                    }}
                    className={cn(
                      "calendar-month-cell",
                      !isCurrentMonth && "is-muted",
                      isToday && "is-today"
                    )}
                  >
                    <div className="calendar-month-day-number">
                      {Number(date.slice(-2))}
                    </div>

                    <div className="calendar-month-events">
                      {events.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "calendar-month-event-chip",
                            event.source === "career" && "is-career"
                          )}
                        >
                          {event.title}
                        </div>
                      ))}

                      {events.length > 2 && (
                        <div className="calendar-month-more">
                          +{events.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="calendar-event-list">
              {visibleEvents.length === 0 && (
                <div className="calendar-empty-state">
                  No events in this {view}.
                </div>
              )}

              {visibleEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setEditingId(event.id)}
                  className="calendar-event-item"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="calendar-event-title">
                        {event.title}
                      </span>

                      {event.source === "career" && (
                        <span className="calendar-career-badge">Career</span>
                      )}

                      {event.googleSyncStatus === "pending" && (
                        <span className="calendar-pending-badge">Pending</span>
                      )}
                    </div>

                    <div className="calendar-event-time">
                      {formatEventTime(event)}
                    </div>

                    {event.location && (
                      <div className="calendar-event-location">
                        {event.location}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="calendar-google-preview">
            <div>
              <div className="text-xs font-semibold">Google Calendar Sync</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                UI ready · OAuth connection later
              </div>
            </div>

            <button type="button" className="calendar-google-button">
              Connect later
            </button>
          </div>
        </div>
      </GlassCard>

      {editingEvent && (
        <div className="calendar-modal-backdrop">
          <div className="calendar-modal-window">
            <div className="calendar-modal-header">
              <div>
                <div className="text-sm font-semibold">
                  {editingEvent.source === "career"
                    ? "Career Application Window"
                    : "Calendar Event"}
                </div>

                <div className="text-xs text-muted-foreground mt-1">
                  {editingEvent.source === "career"
                    ? "Changes here will update Career Widget too."
                    : "Manual dashboard event."}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="h-8 w-8 rounded-full bg-white/35 border border-white/50 flex items-center justify-center hover:bg-white/55 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="calendar-modal-body">
              <label className="calendar-field">
                <span>Title</span>
                <input
                  value={editingEvent.title}
                  disabled={editingEvent.source === "career"}
                  onChange={(e) =>
                    updateEditingEvent({
                      title: e.target.value,
                    })
                  }
                  spellCheck={false}
                />
              </label>

              <div className="calendar-detail-grid">
                <label className="calendar-field">
                  <span>Start Date</span>
                  <input
                    type="date"
                    value={editingEvent.startDate}
                    onChange={(e) =>
                      updateEditingEvent({
                        startDate: e.target.value,
                      })
                    }
                  />
                </label>

                <label className="calendar-field">
                  <span>Start Time</span>
                  <input
                    type="time"
                    value={editingEvent.startTime}
                    onChange={(e) =>
                      updateEditingEvent({
                        startTime: e.target.value,
                      })
                    }
                  />
                </label>

                <label className="calendar-field">
                  <span>End Date</span>
                  <input
                    type="date"
                    value={editingEvent.endDate}
                    onChange={(e) =>
                      updateEditingEvent({
                        endDate: e.target.value,
                      })
                    }
                  />
                </label>

                <label className="calendar-field">
                  <span>End Time</span>
                  <input
                    type="time"
                    value={editingEvent.endTime}
                    onChange={(e) =>
                      updateEditingEvent({
                        endTime: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label className="calendar-field">
                <span>Location</span>
                <input
                  value={editingEvent.location}
                  onChange={(e) =>
                    updateEditingEvent({
                      location: e.target.value,
                    })
                  }
                  spellCheck={false}
                  placeholder="Optional"
                />
              </label>

              <label className="calendar-field">
                <span>Memo</span>
                <textarea
                  value={editingEvent.notes}
                  onChange={(e) =>
                    updateEditingEvent({
                      notes: e.target.value,
                    })
                  }
                  spellCheck={false}
                  placeholder="Notes"
                />
              </label>

              <div className="calendar-modal-actions">
                {editingEvent.source === "manual" ? (
                  <button
                    type="button"
                    onClick={() => {
                      removeCalendarEvent(editingEvent.id);
                      setEditingId(null);
                    }}
                    className="calendar-danger-button"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete event
                  </button>
                ) : (
                  <div className="calendar-managed-note">
                    <Lock className="w-3.5 h-3.5" />
                    Managed by Career Widget · Date/time edits sync both ways
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="calendar-done-button"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
