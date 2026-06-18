import type { CalendarEvent } from "../../../types/dashboard";
import { getEventColor } from "../../../constants/colors";
import { cn } from "../../../lib/utils";
import {
  chunkWeeks,
  eventTouchesDate,
  formatEventTime,
  getMonthDates,
  toLocalDateInput,
} from "./calendarUtils";

type MonthCalendarProps = {
  selectedDate: string;
  events: CalendarEvent[];
  onSelectDate: (date: string) => void;
  onOpenEvent: (eventId: string) => void;
};

const weekdays = ["월", "화", "수", "목", "금", "토", "일"];

const getMonthEventSegment = (
  event: CalendarEvent,
  date: string,
  weekDates: string[]
) => {
  const index = weekDates.indexOf(date);
  if (index === -1) return null;

  const isInRange = event.startDate <= date && event.endDate >= date;
  if (!isInRange) return null;

  const isStart = event.startDate === date || index === 0;
  const isEnd = event.endDate === date || index === 6;

  return {
    isStart,
    isEnd,
    isMiddle: !isStart && !isEnd,
  };
};

export const MonthCalendar = ({
  selectedDate,
  events,
  onSelectDate,
  onOpenEvent,
}: MonthCalendarProps) => {
  const monthInfo = getMonthDates(selectedDate);
  const monthWeeks = chunkWeeks(monthInfo.dates);

  return (
    <div className="calendar-month-board">
      <div className="calendar-month-weekdays">
        {weekdays.map((day) => (
          <div key={day} className="calendar-month-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-month-weeks">
        {monthWeeks.map((weekDates) => (
          <div key={weekDates.join("-")} className="calendar-month-week-row">
            {weekDates.map((date) => {
              const dateEvents = events.filter((event) =>
                eventTouchesDate(event, date)
              );

              const isToday = date === toLocalDateInput();
              const isSelected = date === selectedDate;
              const isCurrentMonth =
                date.slice(0, 7) === monthInfo.currentMonth;

              return (
                <div
                  key={date}
                  className={cn(
                    "calendar-month-day-cell",
                    !isCurrentMonth && "is-muted",
                    isToday && "is-today",
                    isSelected && "is-selected"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectDate(date)}
                    className="calendar-month-day-top"
                  >
                    <span>{Number(date.slice(-2))}</span>

                    {dateEvents.length > 0 && (
                      <span className="calendar-month-count">
                        {dateEvents.length}
                      </span>
                    )}
                  </button>

                  <div className="calendar-range-stack">
                    {dateEvents.slice(0, 4).map((event) => {
                      const segment = getMonthEventSegment(
                        event,
                        date,
                        weekDates
                      );

                      if (!segment) return null;

                      return (
                        <button
                          key={`${event.id}-${date}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEvent(event.id);
                          }}
                          className={cn(
                            "calendar-range-chip",
                            event.source === "career" && "is-career",
                            event.source === "manual" && "is-manual",
                            segment.isStart && "is-start",
                            segment.isEnd && "is-end",
                            segment.isMiddle && "is-middle"
                          )}
                          style={{
                            background: `linear-gradient(90deg, ${getEventColor(
                              event
                            )}cc, ${getEventColor(event)}66)`,
                          }}
                          title={`${event.title} · ${formatEventTime(event)}`}
                        >
                          {segment.isStart ? event.title : ""}
                        </button>
                      );
                    })}

                    {dateEvents.length > 4 && (
                      <div className="calendar-month-more">
                        +{dateEvents.length - 4} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};