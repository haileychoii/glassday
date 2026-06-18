import type { CalendarEvent } from "../../../types/dashboard";
import { getEventColor } from "../../../constants/colors";
import { cn } from "../../../lib/utils";
import {
  clamp,
  eventTouchesDate,
  getMinutesFromTime,
  getShortDateLabel,
  getWeekDates,
  getWeekdayLabel,
  toLocalDateInput,
} from "./calendarUtils";

type WeekTimelineProps = {
  selectedDate: string;
  events: CalendarEvent[];
  onSelectDate: (date: string) => void;
  onOpenEvent: (eventId: string) => void;
};

const START_HOUR = 7;
const END_HOUR = 24;
const HOUR_HEIGHT = 54;

const hours = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, index) => START_HOUR + index
);

const getEventPosition = (event: CalendarEvent, date: string) => {
  const startMinutes =
    event.startDate < date ? START_HOUR * 60 : getMinutesFromTime(event.startTime);
  const endMinutes =
    event.endDate > date ? END_HOUR * 60 : getMinutesFromTime(event.endTime);

  const dayStart = START_HOUR * 60;
  const dayEnd = END_HOUR * 60;

  const topMinutes = clamp(startMinutes - dayStart, 0, dayEnd - dayStart);
  const durationMinutes = clamp(endMinutes - startMinutes, 30, dayEnd - dayStart);

  return {
    top: (topMinutes / 60) * HOUR_HEIGHT,
    height: Math.max(32, (durationMinutes / 60) * HOUR_HEIGHT),
  };
};

export const WeekTimeline = ({
  selectedDate,
  events,
  onSelectDate,
  onOpenEvent,
}: WeekTimelineProps) => {
  const weekDates = getWeekDates(selectedDate);
  const today = toLocalDateInput();

  return (
    <div className="calendar-week-timeline">
      <div className="calendar-week-header">
        <div className="calendar-week-time-spacer" />

        {weekDates.map((date) => (
          <button
            key={date}
            type="button"
            onClick={() => onSelectDate(date)}
            className={cn(
              "calendar-week-day-header",
              date === selectedDate && "is-selected",
              date === today && "is-today"
            )}
          >
            <span>{getWeekdayLabel(date)}</span>
            <strong>{getShortDateLabel(date)}</strong>
          </button>
        ))}
      </div>

      <div className="calendar-week-scroll">
        <div className="calendar-week-grid">
          <div className="calendar-week-times">
            {hours.map((hour) => (
              <div key={hour} className="calendar-week-time">
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          <div className="calendar-week-days">
            {weekDates.map((date) => {
              const dayEvents = events.filter((event) =>
                eventTouchesDate(event, date)
              );

              return (
                <div
                  key={date}
                  className={cn(
                    "calendar-week-day-column",
                    date === selectedDate && "is-selected"
                  )}
                >
                  {hours.map((hour) => (
                    <div key={hour} className="calendar-week-hour-line" />
                  ))}

                  {dayEvents.map((event) => {
                    const position = getEventPosition(event, date);
                    const color = getEventColor(event);

                    return (
                      <button
                        key={`${event.id}-${date}`}
                        type="button"
                        onClick={() => onOpenEvent(event.id)}
                        className={cn(
                          "calendar-week-event",
                          event.source === "career" && "is-career",
                          event.source === "manual" && "is-manual"
                        )}
                        style={{
                          top: position.top,
                          height: position.height,
                          background: `linear-gradient(135deg, ${color}e6, ${color}88)`,
                        }}
                        title={event.title}
                      >
                        <strong>{event.title}</strong>
                        <span>
                          {event.startDate === event.endDate
                            ? `${event.startTime}–${event.endTime}`
                            : `${event.startDate} → ${event.endDate}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};