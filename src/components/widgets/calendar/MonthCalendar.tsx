import { useMemo, useState } from "react";
import type { CalendarEvent } from "../../../types/dashboard";
import { getEventColor } from "../../../constants/colors";
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
} from "react";
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
  laneIndex: number;
  isStart: boolean;
  isEnd: boolean;
};

type HoverPreview = {
  event: CalendarEvent;
  x: number;
  y: number;
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

const doesSegmentTouchColumn = (segment: RangeSegment, column: number) => {
  return column >= segment.startColumn && column < segment.endColumn;
};

const getPreviewPosition = (preview: HoverPreview) => {
  if (typeof window === "undefined") {
    return {
      left: preview.x + 14,
      top: preview.y + 14,
    };
  }

  return {
    left: Math.min(preview.x + 14, window.innerWidth - 320),
    top: Math.min(preview.y + 14, window.innerHeight - 180),
  };
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
  const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);

  const baseDate = selectedDate ?? currentDate ?? toDateString(new Date());

  const weeks = useMemo(() => getCalendarWeeks(baseDate), [baseDate]);

  const rangeSegments = useMemo<RangeSegment[]>(() => {
    const segments: RangeSegment[] = [];

    weeks.forEach((week, weekIndex) => {
      const weekStart = week[0].date;
      const weekEnd = week[6].date;

      const overlappingEvents = events
        .filter(isRangeEvent)
        .filter((event) => doesEventOverlapRange(event, weekStart, weekEnd))
        .sort((a, b) => {
          if (a.startDate !== b.startDate) {
            return a.startDate.localeCompare(b.startDate);
          }

          return b.endDate.localeCompare(a.endDate);
        });

      const laneEnds: number[] = [];

      overlappingEvents.forEach((event) => {
        const startIndex = week.findIndex(
          (day) => day.date === event.startDate
        );
        const endIndex = week.findIndex((day) => day.date === event.endDate);

        const safeStartIndex =
          startIndex === -1
            ? event.startDate < weekStart
              ? 0
              : 6
            : startIndex;

        const safeEndIndex =
          endIndex === -1 ? (event.endDate > weekEnd ? 6 : 0) : endIndex;

        const startColumn = safeStartIndex + 1;
        const endColumn = safeEndIndex + 2;

        let laneIndex = laneEnds.findIndex(
          (laneEndColumn) => laneEndColumn <= startColumn
        );

        if (laneIndex === -1) {
          laneIndex = laneEnds.length;
          laneEnds.push(endColumn);
        } else {
          laneEnds[laneIndex] = endColumn;
        }

        segments.push({
          ...event,
          weekIndex,
          startColumn,
          endColumn,
          laneIndex,
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

  const showPreview = (
    event: CalendarEvent,
    mouseEvent: ReactMouseEvent<HTMLElement>
  ) => {
    setHoverPreview({
      event,
      x: mouseEvent.clientX,
      y: mouseEvent.clientY,
    });
  };

  const movePreview = (
    event: CalendarEvent,
    mouseEvent: ReactMouseEvent<HTMLElement>
  ) => {
    setHoverPreview({
      event,
      x: mouseEvent.clientX,
      y: mouseEvent.clientY,
    });
  };

  return (
    <div className="calendar-month-board">
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

          const rangeLaneCount =
            weekRangeSegments.length === 0
              ? 0
              : Math.max(
                  ...weekRangeSegments.map((segment) => segment.laneIndex + 1)
                );

          const weekStyle = {
            "--range-lanes": String(rangeLaneCount),
          } as CSSProperties;

          return (
            <div
              key={week[0].date}
              className="calendar-month-week-row"
              style={weekStyle}
            >
              {week.map((day, dayIndex) => {
                const dayColumn = dayIndex + 1;

                const daySingleEvents = singleDayEvents.filter(
                  (event) => event.startDate === day.date
                );

                const dayRangeCount = weekRangeSegments.filter((segment) =>
                  doesSegmentTouchColumn(segment, dayColumn)
                ).length;

                const dayEventCount = daySingleEvents.length + dayRangeCount;

                return (
                  <div
                    key={day.date}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleDateSelect(day.date)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleDateSelect(day.date);
                      }
                    }}
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

                      {dayEventCount > 0 && (
                        <span className="calendar-month-count">
                          {dayEventCount}
                        </span>
                      )}
                    </div>

                    <div className="calendar-month-single-events">
                      {daySingleEvents.slice(0, 3).map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          className={[
                            "calendar-month-single-chip",
                            event.source === "career" ? "is-career" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          style={
                            {
                              "--event-color": getEventColor(event),
                              background: getEventColor(event),
                            } as React.CSSProperties
                          }
                          onMouseEnter={(mouseEvent) =>
                            showPreview(event, mouseEvent)
                          }
                          onMouseMove={(mouseEvent) =>
                            movePreview(event, mouseEvent)
                          }
                          onMouseLeave={() => setHoverPreview(null)}
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
                  </div>
                );
              })}

              <div className="calendar-month-range-layer">
                {weekRangeSegments.map((event) => {

                  const hasSingleOverlap = singleDayEvents.some(
                    (singleEvent) =>
                      singleEvent.startDate >= week[event.startColumn - 1].date &&
                      singleEvent.startDate <= week[event.endColumn - 2].date
                  );

                  const shouldShowTitle =
                    event.isStart || event.startColumn === 1;

                  return (
                    <button
                      key={`${event.id}-${weekIndex}`}
                      type="button"
                      className={[
                        "calendar-range-chip",
                        "is-soft-range",
                        hasSingleOverlap ? "has-single-overlap" : "",
                        event.isStart ? "is-start" : "is-middle",
                        event.isEnd ? "is-end" : "",
                        event.isStart && event.isEnd ? "is-start-end" : "",
                        event.source === "career" ? "is-career" : "",
                      ]
                      .filter(Boolean)
                      .join(" ")}


                      style={
                        {
    gridColumn: `${event.startColumn} / ${event.endColumn}`,
    gridRow: `${event.laneIndex + 1}`,
    "--event-color": getEventColor(event),
    background: getEventColor(event),
  } as CSSProperties
}
                      onMouseEnter={(mouseEvent) =>
                        showPreview(event, mouseEvent)
                      }
                      onMouseMove={(mouseEvent) =>
                        movePreview(event, mouseEvent)
                      }
                      onMouseLeave={() => setHoverPreview(null)}
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        handleEventClick(event);
                      }}
                      title={`${event.title} · ${event.startDate} → ${event.endDate}`}
                    >
                      {shouldShowTitle ? event.title : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {hoverPreview && (
        <div
          className="calendar-month-event-preview"
          style={getPreviewPosition(hoverPreview)}
        >
          <div className="calendar-month-event-preview-title">
            {hoverPreview.event.title}
          </div>

          <div className="calendar-month-event-preview-time">
            {hoverPreview.event.startDate} {hoverPreview.event.startTime} →{" "}
            {hoverPreview.event.endDate} {hoverPreview.event.endTime}
          </div>

          {hoverPreview.event.location && (
            <div className="calendar-month-event-preview-line">
              {hoverPreview.event.location}
            </div>
          )}

          {hoverPreview.event.source === "career" && (
            <div className="calendar-month-event-preview-badge">
              Career Application
            </div>
          )}

          {hoverPreview.event.notes && (
            <div className="calendar-month-event-preview-notes">
              {hoverPreview.event.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};