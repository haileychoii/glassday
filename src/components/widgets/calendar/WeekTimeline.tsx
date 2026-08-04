/**
 * ============================================================
 * [Figma Mapping] Calendar / Week Timeline
 * ============================================================
 * Parent: src/components/widgets/CalendarWidget.tsx의 Week Variant
 * Data/Types: CalendarEvent, calendarUtils
 * Style: src/styles/widgets/calendar.css의 calendar-week-* selector
 * Figma 구조: Time Rail + Day Columns + Positioned Event Blocks
 * Variants: Weekday/Weekend, Today, Selected Day, Overlapping Event
 * 좁은 container에서는 timeline 자체가 내부 scroll 영역이 된다.
 * ============================================================
 */
import { useMemo } from "react";
import type { CalendarEvent } from "../../../types/dashboard";

type WeekTimelineProps = {
  events: CalendarEvent[];

  /**
   * 주 시작일. 없으면 selectedDate/currentDate 기준으로 그 주 월요일 계산.
   * 예: "2026-06-15"
   */
  weekStartDate?: string;

  /**
   * 선택 날짜. 예: "2026-06-21"
   */
  selectedDate?: string;

  /**
   * CalendarWidget에서 currentDate라는 이름으로 넘기고 있으면 이것도 받음.
   */
  currentDate?: string;

  /**
   * 날짜 클릭 시
   */
  onSelectDate?: (date: string) => void;
  onDateSelect?: (date: string) => void;

  /**
   * Event click callbacks. onSelectEvent remains as a typed legacy alias.
   */
  onSelectEvent?: (event: CalendarEvent) => void;
  onEventClick?: (event: CalendarEvent) => void;
};

type WeekDay = {
  date: string;
  dayLabel: string;
  dateLabel: string;
  isToday: boolean;
  isSelected: boolean;
};

type RangeBar = CalendarEvent & {
  startColumn: number;
  endColumn: number;
};

const START_HOUR = 7;
const END_HOUR = 25;
const HOUR_HEIGHT = 54;

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

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

const getMonday = (dateString: string) => {
  const date = parseDate(dateString);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateString(date);
};

const getTimeMinutes = (time: string) => {
  if (!time) return START_HOUR * 60;

  const [hourRaw, minuteRaw] = time.split(":").map(Number);
  const hour = Number.isFinite(hourRaw) ? hourRaw : START_HOUR;
  const minute = Number.isFinite(minuteRaw) ? minuteRaw : 0;

  return hour * 60 + minute;
};

const getEventTop = (event: CalendarEvent) => {
  const minutes = getTimeMinutes(event.startTime);
  const clamped = Math.max(START_HOUR * 60, minutes);
  return ((clamped - START_HOUR * 60) / 60) * HOUR_HEIGHT;
};

const getEventHeight = (event: CalendarEvent) => {
  const start = getTimeMinutes(event.startTime);
  const end = getTimeMinutes(event.endTime);
  const duration = Math.max(30, end - start);

  return Math.max(34, (duration / 60) * HOUR_HEIGHT);
};

const isRangeEvent = (event: CalendarEvent) => {
  return event.startDate !== event.endDate;
};

const isDateInWeek = (date: string, weekStart: string, weekEnd: string) => {
  return date >= weekStart && date <= weekEnd;
};

const doesEventOverlapWeek = (
  event: CalendarEvent,
  weekStart: string,
  weekEnd: string
) => {
  return event.startDate <= weekEnd && event.endDate >= weekStart;
};

const getEventColor = (event: CalendarEvent) => {
  if (event.color) return event.color;

  if (event.source === "career") {
    return "linear-gradient(135deg, hsl(248 100% 94% / 0.9), hsl(220 100% 96% / 0.82))";
  }

  return "linear-gradient(135deg, hsl(210 100% 94% / 0.9), hsl(220 100% 97% / 0.84))";
};

/** 주간 event를 시간 좌표로 변환해 day column에 배치하는 Calendar child component. */
export const WeekTimeline = ({
  events,
  weekStartDate,
  selectedDate,
  currentDate,
  onSelectDate,
  onDateSelect,
  onSelectEvent,
  onEventClick,
}: WeekTimelineProps) => {
  const baseDate = selectedDate ?? currentDate ?? toDateString(new Date());
  const weekStart = weekStartDate ?? getMonday(baseDate);
  const weekEnd = addDays(weekStart, 6);
  const todayString = toDateString(new Date());

  const weekDays = useMemo<WeekDay[]>(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      const parsed = parseDate(date);

      return {
        date,
        dayLabel: weekdayLabels[parsed.getDay()],
        dateLabel: `${parsed.getMonth() + 1}/${parsed.getDate()}`,
        isToday: date === todayString,
        isSelected: date === baseDate,
      };
    });
  }, [weekStart, todayString, baseDate]);

  const rangeEvents = useMemo<RangeBar[]>(() => {
    return events
      .filter((event) => isRangeEvent(event))
      .filter((event) => doesEventOverlapWeek(event, weekStart, weekEnd))
      .map((event) => {
        const rawStartIndex = weekDays.findIndex(
          (day) => day.date === event.startDate
        );
        const rawEndIndex = weekDays.findIndex(
          (day) => day.date === event.endDate
        );

        const startIndex =
          rawStartIndex === -1
            ? event.startDate < weekStart
              ? 0
              : 6
            : rawStartIndex;

        const endIndex =
          rawEndIndex === -1 ? (event.endDate > weekEnd ? 6 : 0) : rawEndIndex;

        return {
          ...event,
          startColumn: startIndex + 1,
          endColumn: endIndex + 2,
        };
      });
  }, [events, weekDays, weekStart, weekEnd]);

  const timedEvents = useMemo(() => {
    return events
      .filter((event) => !isRangeEvent(event))
      .filter((event) => isDateInWeek(event.startDate, weekStart, weekEnd));
  }, [events, weekStart, weekEnd]);

  const handleDateSelect = (date: string) => {
    onSelectDate?.(date);
    onDateSelect?.(date);
  };

  const handleEventClick = (event: CalendarEvent) => {
    /* One user action must open one detail window. */
    (onEventClick ?? onSelectEvent)?.(event);
  };

  const hourLabels = useMemo(() => {
    return Array.from({ length: END_HOUR - START_HOUR }, (_, index) => {
      const hour = START_HOUR + index;
      return `${pad2(hour)}:00`;
    });
  }, []);

  return (
    <div className="calendar-week-timeline">
      <div className="calendar-week-header">
        <div className="calendar-week-time-spacer" />

        {weekDays.map((day) => (
          <button
            key={day.date}
            type="button"
            onClick={() => handleDateSelect(day.date)}
            className={[
              "calendar-week-day-header",
              day.isToday ? "is-today" : "",
              day.isSelected ? "is-selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span>{day.dayLabel}</span>
            <strong>{day.dateLabel}</strong>
          </button>
        ))}
      </div>

      <div className="calendar-week-all-day">
        <div className="calendar-week-all-day-label">All-day</div>

        <div className="calendar-week-all-day-grid">
          {rangeEvents.length === 0 ? (
            <div className="calendar-week-all-day-empty">No range events</div>
          ) : (
            rangeEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                className={[
                  "calendar-week-range-bar",
                  event.source === "career" ? "is-career" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  gridColumn: `${event.startColumn} / ${event.endColumn}`,
                  background: getEventColor(event),
                }}
                onClick={() => handleEventClick(event)}
                title={`${event.title} · ${event.startDate} → ${event.endDate}`}
              >
                {event.title}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="calendar-week-scroll">
        <div className="calendar-week-grid">
          <div className="calendar-week-times">
            {hourLabels.map((label) => (
              <div key={label} className="calendar-week-time">
                {label}
              </div>
            ))}
          </div>

          <div className="calendar-week-days">
            {weekDays.map((day) => {
              const dayEvents = timedEvents.filter(
                (event) => event.startDate === day.date
              );

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => handleDateSelect(day.date)}
                  className={[
                    "calendar-week-day-column",
                    day.isSelected ? "is-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {hourLabels.map((label) => (
                    <div key={label} className="calendar-week-hour-line" />
                  ))}

                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      className={[
                        "calendar-week-event",
                        event.source === "career" ? "is-career" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{
                        top: getEventTop(event),
                        height: getEventHeight(event),
                        background: getEventColor(event),
                      }}
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        handleEventClick(event);
                      }}
                      title={`${event.title} · ${event.startTime}-${event.endTime}`}
                    >
                      <strong>{event.title}</strong>
                      <span>
                        {event.startTime}
                        {event.endTime ? `–${event.endTime}` : ""}
                      </span>
                    </button>
                  ))}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
