import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Lock,
  Pencil,
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

const eventTouchesDate = (event: CalendarEvent, date: string) => {
  return event.startDate <= date && event.endDate >= date;
};

const eventTouchesMonth = (event: CalendarEvent, date: string) => {
  const month = date.slice(0, 7);
  return event.startDate.slice(0, 7) <= month && event.endDate.slice(0, 7) >= month;
};

const formatEventTime = (event: CalendarEvent) => {
  if (event.startDate === event.endDate) {
    return `${event.startTime}–${event.endTime}`;
  }

  return `${event.startDate} ${event.startTime} → ${event.endDate} ${event.endTime}`;
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
    editingId ? calendarEvents.find((event) => event.id === editingId) ?? null : null;

  const visibleEvents = useMemo(() => {
    const sorted = [...calendarEvents].sort((a, b) => {
      const aValue = `${a.startDate} ${a.startTime}`;
      const bValue = `${b.startDate} ${b.startTime}`;
      return aValue.localeCompare(bValue);
    });

    if (view === "day") {
      return sorted.filter((event) => eventTouchesDate(event, selectedDate));
    }

    if (view === "week") {
      const weekDates = getWeekDates(selectedDate);
      return sorted.filter((event) =>
        weekDates.some((date) => eventTouchesDate(event, date))
      );
    }

    return sorted.filter((event) => eventTouchesMonth(event, selectedDate));
  }, [calendarEvents, selectedDate, view]);

  const goPrev = () => {
    if (view === "day") setSelectedDate((prev) => addDays(prev, -1));
    if (view === "week") setSelectedDate((prev) => addDays(prev, -7));

    if (view === "month") {
      const date = parseDate(selectedDate);
      date.setMonth(date.getMonth() - 1);
      setSelectedDate(toLocalDateInput(date));
    }
  };

  const goNext = () => {
    if (view === "day") setSelectedDate((prev) => addDays(prev, 1));
    if (view === "week") setSelectedDate((prev) => addDays(prev, 7));

    if (view === "month") {
      const date = parseDate(selectedDate);
      date.setMonth(date.getMonth() + 1);
      setSelectedDate(toLocalDateInput(date));
    }
  };

  const createManualEvent = () => {
    const newEvent = addCalendarEvent();

    updateCalendarEvent(newEvent.id, {
      startDate: selectedDate,
      endDate: selectedDate,
    });

    setEditingId(newEvent.id);
  };

  return (
    <>
      <GlassCard
        title="Calendar"
        subtitle="Manual events + career deadlines"
        icon={<CalendarDays className="w-4 h-4" />}
        actions={
          <button
            type="button"
            onClick={createManualEvent}
            className="h-8 w-8 rounded-full bg-white/35 border border-white/50 flex items-center justify-center hover:bg-white/55 transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        }
      >
        <div className="h-full flex flex-col gap-3">
          <div className="calendar-widget-toolbar">
            <div className="flex items-center gap-1">
              <button type="button" onClick={goPrev} className="calendar-nav-button">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="calendar-date-input"
              />

              <button type="button" onClick={goNext} className="calendar-nav-button">
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
                    <span className="calendar-event-title">{event.title}</span>

                    {event.source === "career" && (
                      <span className="calendar-career-badge">Career</span>
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
                    ? "Career Calendar Event"
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
                    updateCalendarEvent(editingEvent.id, {
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
                      updateCalendarEvent(editingEvent.id, {
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
                      updateCalendarEvent(editingEvent.id, {
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
                      updateCalendarEvent(editingEvent.id, {
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
                      updateCalendarEvent(editingEvent.id, {
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
                    updateCalendarEvent(editingEvent.id, {
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
                    updateCalendarEvent(editingEvent.id, {
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
                    Managed by Career Widget. Date/time edits are synced both ways.
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