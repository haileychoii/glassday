import { useMemo } from "react";
import type { CalendarEvent } from "../../../types/dashboard";

type MonthCalendarProps = {
  events: CalendarEvent[];
  selectedDate?: string;
  currentDate?: string;
  onSelectDate?: (date: string) => void;
  onDateSelect?: (date: string) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
  onEventClick?: (event: CalendarEvent) => void;
};

type MonthDay = {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
};

type WeekRow = MonthDay[];

type RangeSegment = CalendarEvent & {
  weekIndex: number;
  startColumn: number;
  endColumn: number;
  isStart: boolean;
  isEnd: boolean;
};

const weekdayLabels = ["월", "화", "수", "목", "금", "토", "일"];

const pad2 = (value: number) => String(value).padStart(2, "0");

const toDateString = (date: Date) => {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
};

const parseDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

const addDays = (dateString: string, amount: number) => {
  const date = parseDate(dateString);
  date.setDate(date.getDate() + amount);
  return toDateString(date);
};

const getMonthStart = (dateString: string) => {
  const date = parseDate(dateString);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-01`;
};

const getCalendarStart = (monthStart: string) => {
  const date = parseDate(monthStart);
  const day = date.getDay();
  const mondayBasedDay = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - mondayBasedDay);
  return toDateString(date);
};

const getCalendarWeeks = (baseDate: string): WeekRow[] => {
  const monthStart = getMonthStart(baseDate);
  const calendarStart = getCalendarStart(monthStart);
  const currentMonth = parseDate(monthStart).getMonth();
  const today = toDateString(new Date());

  return Array.from({ length: 6 }, (_, weekIndex) => {
    return Array.from({ length: 7 }, (_, dayIndex) => {
      const date = addDays(calendarStart, weekIndex * 7 + dayIndex);
      const parsed = parseDate(date);

      return {
        date,
        dayNumber: parsed.getDate(),
        isCurrentMonth: parsed.getMonth() === currentMonth,
        isToday: date === today,
        isSelected: date === baseDate,
      };
    });
  });
};

const isRangeEvent = (event: CalendarEvent) => {
  return event.startDate !== event.endDate;
};

const doesEventOverlapRange = (
  event: CalendarEvent,
  rangeStart: string,
  rangeEnd: string
) => {
  return event.startDate <= rangeEnd && event.endDate >= rangeStart;
};

const getEventColor = (event: CalendarEvent) => {
  if (event.color) return event.color;

  if (event.source === "career") {
    return "linear-gradient(135deg, hsl(248 100% 94% / 0.95), hsl(220 100% 96% / 0.84))";
  }

  return "linear-gradient(135deg, hsl(210 100% 94% / 0.95), hsl(220 100% 97% / 0.86))";
};

export const MonthCalendar = ({
  events,
  selectedDate,
  currentDate,
  onSelectDate,
  onDateSelect,
  onSelectEvent,
  onEventClick,
}: MonthCalendarProps) => {
  const baseDate = selectedDate ?? currentDate ?? toDateString(new Date());

  const weeks = useMemo(() => getCalendarWeeks(baseDate), [baseDate]);

  const monthLabel = useMemo(() => {
    const parsed = parseDate(baseDate);
    return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}`;
  }, [baseDate]);

  const rangeSegments = useMemo<RangeSegment[]>(() => {
    const segments: RangeSegment[] = [];

    weeks.forEach((week, weekIndex) => {
      const weekStart = week[0].date;
      const weekEnd = week[6].date;

      events
        .filter(isRangeEvent)
        .filter((event) => doesEventOverlapRange(event, weekStart, weekEnd))
        .forEach((event) => {
          const startIndex = week.findIndex((day) => day.date === event.startDate);
          const endIndex = week.findIndex((day) => day.date === event.endDate);

          const safeStartIndex =
            startIndex === -1 ? (event.startDate < weekStart ? 0 : 6) : startIndex;

          const safeEndIndex =
            endIndex === -1 ? (event.endDate > weekEnd ? 6 : 0) : endIndex;

          segments.push({
            ...event,
            weekIndex,
            startColumn: safeStartIndex + 1,
            endColumn: safeEndIndex + 2,
            isStart: event.startDate >= weekStart && event.startDate <= weekEnd,
            isEnd: event.endDate >= weekStart && event.endDate <= weekEnd,
          });
        });
    });

    return segments;
  }, [events, weeks]);

  const singleDayEvents = useMemo(() => {
    return events.filter((event) => !isRangeEvent(event));
  }, [events]);

  const handleDateSelect = (date: string) => {
    onSelectDate?.(date);
    onDateSelect?.(date);
  };

  const handleEventClick = (event: CalendarEvent) => {
    onSelectEvent?.(event);
    onEventClick?.(event);
  };

  return (
    <div className="calendar-month-board">
      <div className="calendar-month-title-row">
        <strong>{monthLabel}</strong>
      </div>

      <div className="calendar-month-weekdays">
        {weekdayLabels.map((label) => (
          <div key={label} className="calendar-month-weekday">
            {label}
          </div>
        ))}
      </div>

      <div className="calendar-month-weeks">
        {weeks.map((week, weekIndex) => {
          const weekRangeSegments = rangeSegments.filter(
            (segment) => segment.weekIndex === weekIndex
          );

          return (
            <div key={week[0].date} className="calendar-month-week-row">
              {week.map((day) => {
                const daySingleEvents = singleDayEvents.filter(
                  (event) => event.startDate === day.date
                );

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => handleDateSelect(day.date)}
                    className={[
                      "calendar-month-day-cell",
                      !day.isCurrentMonth ? "is-muted" : "",
                      day.isToday ? "is-today" : "",
                      day.isSelected ? "is-selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="calendar-month-day-top">
                      <span>{day.dayNumber}</span>
                      {daySingleEvents.length + weekRangeSegments.length > 0 && (
                        <span className="calendar-month-count">
                          {daySingleEvents.length + weekRangeSegments.length}
                        </span>
                      )}
                    </div>

                    <div className="calendar-month-single-events">
                      {daySingleEvents.slice(0, 2).map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          className={[
                            "calendar-month-single-chip",
                            event.source === "career" ? "is-career" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          style={{ background: getEventColor(event) }}
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            handleEventClick(event);
                          }}
                          title={`${event.title} · ${event.startTime}-${event.endTime}`}
                        >
                          {event.title}
                        </button>
                      ))}
                    </div>
                  </button>
                );
              })}

              <div className="calendar-month-range-layer">
                {weekRangeSegments.map((event) => (
                  <button
                    key={`${event.id}-${weekIndex}`}
                    type="button"
                    className={[
                      "calendar-range-chip",
                      event.isStart ? "is-start" : "is-middle",
                      event.isEnd ? "is-end" : "",
                      event.isStart && event.isEnd ? "is-start-end" : "",
                      event.source === "career" ? "is-career" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{
                      gridColumn: `${event.startColumn} / ${event.endColumn}`,
                      background: getEventColor(event),
                    }}
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      handleEventClick(event);
                    }}
                    title={`${event.title} · ${event.startDate} → ${event.endDate}`}
                  >
                    {event.isStart ? event.title : ""}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};