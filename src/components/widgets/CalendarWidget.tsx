import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Lock,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { GlassCard } from "../glass/GlassCard";
import { cn } from "../../lib/utils";
import { useDashboardData } from "../../context/DashboardDataContext";
import type { CalendarEvent, CalendarView } from "../../types/dashboard";
import { getEventColor, getPastelColorById } from "../../constants/colors";
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

type DashboardDataWithCareerDetail = ReturnType<typeof useDashboardData> & {
  openCareerDetail?: (id: string) => void;
};

export const CalendarWidget = () => {
  const dashboardData = useDashboardData() as DashboardDataWithCareerDetail;

  const {
    calendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    removeCalendarEvent,
    openCareerDetail,
  } = dashboardData;

  const [view, setView] = useState<CalendarView>("day");
  const [selectedDate, setSelectedDate] = useState(toLocalDateInput());
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingEvent = editingId
    ? calendarEvents.find((event) => event.id === editingId) ?? null
    : null;

  const visibleEvents = useMemo(() => {
    const normalizedEvents = calendarEvents.map((event) => ({
      ...event,
      color: event.color || getPastelColorById(event.id),
    }));

    const sorted = sortEvents(normalizedEvents);

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
    const eventId = `manual-${Date.now()}`;

    const newEvent = addCalendarEvent({
      id: eventId,
      title: "New Event",
      startDate: selectedDate,
      startTime: "09:00",
      endDate: selectedDate,
      endTime: "10:00",
      source: "manual",
      color: getPastelColorById(eventId),
    });

    setEditingId(newEvent.id);
  };

  const updateEditingEvent = (patch: Partial<CalendarEvent>) => {
    if (!editingEvent) return;

    updateCalendarEvent(editingEvent.id, patch);
  };

  const openEvent = (event: CalendarEvent) => {
    if (event.source === "career") {
      const careerId = event.careerApplicationId ?? event.sourceId;

      if (careerId && openCareerDetail) {
        openCareerDetail(careerId);
        return;
      }
    }

    setEditingId(event.id);
  };

  const openCareerFromModal = () => {
    if (!editingEvent || editingEvent.source !== "career") return;

    const careerId = editingEvent.careerApplicationId ?? editingEvent.sourceId;

    if (!careerId || !openCareerDetail) return;

    setEditingId(null);
    openCareerDetail(careerId);
  };

  return (
    <>
      <GlassCard
        className="calendar-widget-card"
        title="Calendar"
        subtitle="Manual events + career application windows"
        // Keep the calendar title/subtitle explicit so theme-specific overrides
        // cannot accidentally wash out the header when the widget gets narrow.
        titleStyle={{ color: "hsl(var(--foreground) / 0.96)" }}
        subtitleStyle={{ color: "hsl(var(--muted-foreground) / 0.82)" }}
        icon={<CalendarDays className="w-4 h-4" />}
        actions={
          <button
            type="button"
            onClick={createManualEvent}
            className="glass-button h-8 w-8 flex items-center justify-center"
            title="Add event"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        }
      >
        <div className="calendar-widget-frame">
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
                onChange={(event) => setSelectedDate(event.target.value)}
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

          <div
            className={cn(
              "calendar-view-body",
              view === "month" && "calendar-view-body--month"
            )}
          >
            {view === "month" ? (
              <MonthCalendar
                selectedDate={selectedDate}
                events={visibleEvents}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                }}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                }}
                onEventClick={openEvent}
                onSelectEvent={openEvent}
              />
            ) : view === "week" ? (
              <WeekTimeline
                selectedDate={selectedDate}
                events={visibleEvents}
                onSelectDate={setSelectedDate}
                onEventClick={openEvent}
                onSelectEvent={openEvent}
              />
            ) : (
              <div className="calendar-event-list">
                {dayEvents.length === 0 && (
                  <div className="calendar-empty-state">No events today.</div>
                )}

                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => openEvent(event)}
                    className="calendar-event-item"
                    style={{
                      borderLeft: `6px solid ${getEventColor(event)}aa`,
                    }}
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

      {editingEvent &&
        createPortal(
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
                  className="glass-button h-8 w-8 flex items-center justify-center"
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
                    onChange={(event) =>
                      updateEditingEvent({
                        title: event.target.value,
                      })
                    }
                    spellCheck={false}
                  />
                </label>

                {editingEvent.source === "career" && (
                  <button
                    type="button"
                    onClick={openCareerFromModal}
                    className="calendar-open-career-button"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Career Detail
                  </button>
                )}

                <div className="calendar-detail-grid">
                  <label className="calendar-field">
                    <span>Start Date</span>
                    <input
                      type="date"
                      value={editingEvent.startDate}
                      onChange={(event) =>
                        updateEditingEvent({
                          startDate: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="calendar-field">
                    <span>Start Time</span>
                    <input
                      type="time"
                      value={editingEvent.startTime}
                      onChange={(event) =>
                        updateEditingEvent({
                          startTime: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="calendar-field">
                    <span>End Date</span>
                    <input
                      type="date"
                      value={editingEvent.endDate}
                      onChange={(event) =>
                        updateEditingEvent({
                          endDate: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="calendar-field">
                    <span>End Time</span>
                    <input
                      type="time"
                      value={editingEvent.endTime}
                      onChange={(event) =>
                        updateEditingEvent({
                          endTime: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                <label className="calendar-field">
                  <span>Location</span>
                  <input
                    value={editingEvent.location}
                    onChange={(event) =>
                      updateEditingEvent({
                        location: event.target.value,
                      })
                    }
                    spellCheck={false}
                    placeholder="Optional"
                  />
                </label>

                <div className="calendar-field">
                  <span>Event Color</span>
                  <EventColorPicker
                    value={editingEvent.color || getEventColor(editingEvent)}
                    onChange={(color) =>
                      updateEditingEvent({
                        color,
                      })
                    }
                  />
                </div>

                <label className="calendar-field">
                  <span>Memo</span>
                  <textarea
                    value={editingEvent.notes}
                    onChange={(event) =>
                      updateEditingEvent({
                        notes: event.target.value,
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
          </div>,
          document.body
        )}
    </>
  );
};
