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
import { useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { CalendarEvent } from "../../../types/dashboard";
import { getEventColor as getCalendarEventColor } from "../../../constants/colors";

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
  editMode?: boolean;
  selectedEventId?: string | null;
  onCreateBlock?: (draft: WeekBlockDraft) => void;
  onResizeEvent?: (event: CalendarEvent, draft: WeekBlockDraft) => void;
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
  laneIndex: number;
};

export type WeekBlockDraft = {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
};

type WeekDraftSelection = {
  startDate: string;
  startSlot: number;
  endDate: string;
  endSlot: number;
};

type WeekResizeSelection = WeekDraftSelection & {
  event: CalendarEvent;
};

type WeekOverflowPreview = {
  title: string;
  events: CalendarEvent[];
  x: number;
  y: number;
};

const START_HOUR = 7;
const END_HOUR = 25;
const HOUR_HEIGHT = 44;
const MAX_ALL_DAY_LANES = 2;
const MAX_TIMED_EVENTS_PER_DAY = 5;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = HOUR_HEIGHT / 2;

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

const getSlotCount = () => ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

const getSlotFromPointer = (
  event: ReactPointerEvent<HTMLElement>,
  element: HTMLElement
) => {
  const rect = element.getBoundingClientRect();
  const y = Math.min(Math.max(0, event.clientY - rect.top), rect.height);
  const slot = Math.floor(y / SLOT_HEIGHT);

  return Math.min(Math.max(0, slot), getSlotCount() - 1);
};

const slotToTime = (slot: number) => {
  const minutes = Math.min(START_HOUR * 60 + slot * SLOT_MINUTES, 23 * 60 + 59);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${pad2(hour)}:${pad2(minute)}`;
};

const timeToSlot = (time: string, mode: "start" | "end") => {
  const minutes = getTimeMinutes(time);
  const rawSlot = (minutes - START_HOUR * 60) / SLOT_MINUTES;
  const slot = mode === "end" ? Math.ceil(rawSlot) - 1 : Math.floor(rawSlot);

  return Math.min(Math.max(0, slot), getSlotCount() - 1);
};

const normalizeSelection = (
  selection: WeekDraftSelection | WeekResizeSelection
): WeekBlockDraft => {
  const startsBeforeEnd =
    selection.startDate < selection.endDate ||
    (selection.startDate === selection.endDate &&
      selection.startSlot <= selection.endSlot);
  const firstDate = startsBeforeEnd ? selection.startDate : selection.endDate;
  const lastDate = startsBeforeEnd ? selection.endDate : selection.startDate;
  const firstSlot = startsBeforeEnd ? selection.startSlot : selection.endSlot;
  const lastSlot = startsBeforeEnd ? selection.endSlot : selection.startSlot;
  const endSlot =
    firstDate === lastDate ? Math.max(firstSlot + 1, lastSlot + 1) : lastSlot + 1;

  return {
    startDate: firstDate,
    startTime: slotToTime(firstSlot),
    endDate: lastDate,
    endTime: slotToTime(endSlot),
  };
};

const getSelectionSegmentStyle = (
  selection: WeekDraftSelection | WeekResizeSelection,
  date: string
) => {
  const startsBeforeEnd =
    selection.startDate < selection.endDate ||
    (selection.startDate === selection.endDate &&
      selection.startSlot <= selection.endSlot);
  const firstDate = startsBeforeEnd ? selection.startDate : selection.endDate;
  const lastDate = startsBeforeEnd ? selection.endDate : selection.startDate;
  const firstSlot = startsBeforeEnd ? selection.startSlot : selection.endSlot;
  const lastSlot = startsBeforeEnd ? selection.endSlot : selection.startSlot;

  if (date < firstDate || date > lastDate) return null;

  const startSlot = date === firstDate ? firstSlot : 0;
  const endSlot = date === lastDate ? lastSlot : getSlotCount() - 1;

  return {
    top: startSlot * SLOT_HEIGHT,
    height: (Math.max(startSlot, endSlot) - startSlot + 1) * SLOT_HEIGHT,
  } as CSSProperties;
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
  editMode = false,
  selectedEventId = null,
  onCreateBlock,
  onResizeEvent,
}: WeekTimelineProps) => {
  const daysRef = useRef<HTMLDivElement | null>(null);
  const [draftSelection, setDraftSelection] =
    useState<WeekDraftSelection | null>(null);
  const [resizeSelection, setResizeSelection] =
    useState<WeekResizeSelection | null>(null);
  const [overflowPreview, setOverflowPreview] =
    useState<WeekOverflowPreview | null>(null);
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
    const laneEnds: number[] = [];

    return events
      .filter((event) => isRangeEvent(event))
      .filter((event) => doesEventOverlapWeek(event, weekStart, weekEnd))
      .sort((a, b) => {
        if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
        return b.endDate.localeCompare(a.endDate);
      })
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

        const startColumn = startIndex + 1;
        const endColumn = endIndex + 2;
        let laneIndex = laneEnds.findIndex(
          (laneEndColumn) => laneEndColumn <= startColumn
        );

        if (laneIndex === -1) {
          laneIndex = laneEnds.length;
          laneEnds.push(endColumn);
        } else {
          laneEnds[laneIndex] = endColumn;
        }

        return {
          ...event,
          startColumn,
          endColumn,
          laneIndex,
        };
      });
  }, [events, weekDays, weekStart, weekEnd]);

  const visibleRangeEvents = rangeEvents.filter(
    (event) => event.laneIndex < MAX_ALL_DAY_LANES
  );
  const hiddenRangeEvents = rangeEvents.filter(
    (event) => event.laneIndex >= MAX_ALL_DAY_LANES
  );

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

  const showOverflowPreview = (
    title: string,
    previewEvents: CalendarEvent[],
    pointerEvent: ReactPointerEvent<HTMLElement>
  ) => {
    setOverflowPreview({
      title,
      events: previewEvents,
      x: pointerEvent.clientX,
      y: pointerEvent.clientY,
    });
  };

  const getDateFromPointer = (pointerEvent: ReactPointerEvent<HTMLElement>) => {
    if (!daysRef.current) return null;

    const rect = daysRef.current.getBoundingClientRect();
    const dayWidth = rect.width / weekDays.length;
    const index = Math.min(
      Math.max(0, Math.floor((pointerEvent.clientX - rect.left) / dayWidth)),
      weekDays.length - 1
    );

    return weekDays[index]?.date ?? null;
  };

  const beginBlockSelection = (
    day: WeekDay,
    pointerEvent: ReactPointerEvent<HTMLButtonElement>
  ) => {
    if (!editMode || !onCreateBlock) {
      handleDateSelect(day.date);
      return;
    }

    /*
     * Weekly edit grid:
     * Pointer selection is snapped to 30-minute blocks only during quick draw.
     * The detail modal keeps native time inputs, so arbitrary minutes remain
     * editable after creation. / 블록 생성은 빠르게 잡기 위한 30분 단위이고,
     * 상세창에서는 11분 같은 세부 시간도 그대로 수정 가능하다.
     */
    pointerEvent.preventDefault();
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
    const slot = getSlotFromPointer(pointerEvent, pointerEvent.currentTarget);
    setDraftSelection({
      startDate: day.date,
      startSlot: slot,
      endDate: day.date,
      endSlot: slot,
    });
  };

  const updateBlockSelection = (
    day: WeekDay,
    pointerEvent: ReactPointerEvent<HTMLButtonElement>
  ) => {
    if (!draftSelection || !editMode) return;

    const slot = getSlotFromPointer(pointerEvent, pointerEvent.currentTarget);
    const pointerDate = getDateFromPointer(pointerEvent) ?? day.date;
    setDraftSelection((current) =>
      current
        ? {
            ...current,
            endDate: pointerDate,
            endSlot: slot,
          }
        : current
    );
  };

  const finishBlockSelection = () => {
    if (!draftSelection || !onCreateBlock) return;

    onCreateBlock(normalizeSelection(draftSelection));
    setDraftSelection(null);
  };

  const beginEventResize = (
    event: CalendarEvent,
    pointerEvent: ReactPointerEvent<HTMLSpanElement>
  ) => {
    if (!editMode || !onResizeEvent) return;

    pointerEvent.preventDefault();
    pointerEvent.stopPropagation();
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
    setResizeSelection({
      event,
      startDate: event.startDate,
      startSlot: timeToSlot(event.startTime, "start"),
      endDate: event.endDate,
      endSlot: timeToSlot(event.endTime, "end"),
    });
  };

  const updateEventResize = (
    pointerEvent: ReactPointerEvent<HTMLSpanElement>
  ) => {
    if (!resizeSelection || !editMode) return;

    pointerEvent.preventDefault();
    pointerEvent.stopPropagation();

    const targetColumn = pointerEvent.currentTarget.closest(
      ".calendar-week-day-column"
    );
    if (!(targetColumn instanceof HTMLElement)) return;

    const slot = getSlotFromPointer(pointerEvent, targetColumn);
    const pointerDate =
      getDateFromPointer(pointerEvent) ?? resizeSelection.endDate;

    setResizeSelection((current) =>
      current
        ? {
            ...current,
            endDate: pointerDate,
            endSlot: slot,
          }
        : current
    );
  };

  const finishEventResize = () => {
    if (!resizeSelection || !onResizeEvent) return;

    const draft = normalizeSelection(resizeSelection);
    const hasChanged =
      draft.startDate !== resizeSelection.event.startDate ||
      draft.startTime !== resizeSelection.event.startTime ||
      draft.endDate !== resizeSelection.event.endDate ||
      draft.endTime !== resizeSelection.event.endTime;

    setResizeSelection(null);

    if (!hasChanged) return;

    const ok = window.confirm(
      `${resizeSelection.event.title} 일정 시간을 ${draft.startDate} ${draft.startTime} → ${draft.endDate} ${draft.endTime}로 변경할까요?`
    );

    if (ok) {
      onResizeEvent(resizeSelection.event, draft);
    }
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
            <>
            {visibleRangeEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                className={[
                  "calendar-week-range-bar",
                  event.source === "career" ? "is-career" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={
                  {
                    /* Expose the event color to theme CSS while preserving the
                       inline fill used by modern themes. / Pixel Desk 색 복구용. */
                    "--event-color": getCalendarEventColor(event),
                    gridColumn: `${event.startColumn} / ${event.endColumn}`,
                    gridRow: `${event.laneIndex + 1}`,
                    background: getCalendarEventColor(event),
                  } as CSSProperties
                }
                onClick={() => handleEventClick(event)}
                title={`${event.title} · ${event.startDate} → ${event.endDate}`}
              >
                {event.title}
              </button>
            ))}

            {hiddenRangeEvents.length > 0 && (
              <button
                type="button"
                className="calendar-week-more-bar"
                style={{ gridColumn: "1 / -1", gridRow: MAX_ALL_DAY_LANES + 1 }}
                onPointerEnter={(pointerEvent) =>
                  showOverflowPreview(
                    `+${hiddenRangeEvents.length} range schedules`,
                    hiddenRangeEvents,
                    pointerEvent
                  )
                }
                onPointerMove={(pointerEvent) =>
                  showOverflowPreview(
                    `+${hiddenRangeEvents.length} range schedules`,
                    hiddenRangeEvents,
                    pointerEvent
                  )
                }
                onPointerDown={(pointerEvent) => pointerEvent.stopPropagation()}
              >
                +{hiddenRangeEvents.length}
              </button>
            )}
            </>
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

          <div className="calendar-week-days" ref={daysRef}>
            {weekDays.map((day) => {
              const dayEvents = timedEvents.filter(
                (event) => event.startDate === day.date
              );
              const visibleDayEvents = dayEvents.slice(
                0,
                MAX_TIMED_EVENTS_PER_DAY
              );
              const hiddenDayEvents = dayEvents.slice(MAX_TIMED_EVENTS_PER_DAY);

              return (
                <button
                  key={day.date}
                  type="button"
                  onPointerDown={(pointerEvent) =>
                    beginBlockSelection(day, pointerEvent)
                  }
                  onPointerMove={(pointerEvent) =>
                    updateBlockSelection(day, pointerEvent)
                  }
                  onPointerUp={finishBlockSelection}
                  onPointerCancel={() => setDraftSelection(null)}
                  className={[
                    "calendar-week-day-column",
                    day.isSelected ? "is-selected" : "",
                    editMode ? "is-editing" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {editMode && (
                    <div className="calendar-week-edit-grid" aria-hidden="true">
                      {Array.from({ length: getSlotCount() }, (_, slotIndex) => (
                        <span key={slotIndex} />
                      ))}
                    </div>
                  )}

                  {hourLabels.map((label) => (
                    <div key={label} className="calendar-week-hour-line" />
                  ))}

                  {visibleDayEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      className={[
                        "calendar-week-event",
                        event.source === "career" ? "is-career" : "",
                        selectedEventId === event.id ? "is-focused" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={
                        {
                          "--event-color": getCalendarEventColor(event),
                          top: getEventTop(event),
                          height: getEventHeight(event),
                          background: getCalendarEventColor(event),
                        } as CSSProperties
                      }
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        handleEventClick(event);
                      }}
                      onPointerDown={(pointerEvent) =>
                        pointerEvent.stopPropagation()
                      }
                      title={`${event.title} · ${event.startTime}-${event.endTime}`}
                    >
                      <strong>{event.title}</strong>
                      <span>
                        {event.startTime}
                        {event.endTime ? `–${event.endTime}` : ""}
                      </span>
                      {editMode && (
                        <span
                          className="calendar-week-event-resize-handle"
                          aria-hidden="true"
                          onPointerDown={(pointerEvent) =>
                            beginEventResize(event, pointerEvent)
                          }
                          onPointerMove={updateEventResize}
                          onPointerUp={finishEventResize}
                          onPointerCancel={() => setResizeSelection(null)}
                        />
                      )}
                    </button>
                  ))}

                  {draftSelection &&
                    getSelectionSegmentStyle(draftSelection, day.date) && (
                      <span
                        className="calendar-week-edit-selection"
                        style={
                          getSelectionSegmentStyle(draftSelection, day.date) ??
                          undefined
                        }
                      />
                    )}

                  {resizeSelection &&
                    getSelectionSegmentStyle(resizeSelection, day.date) && (
                      <span
                        className="calendar-week-edit-selection is-resizing"
                        style={
                          getSelectionSegmentStyle(resizeSelection, day.date) ??
                          undefined
                        }
                      />
                    )}

                  {hiddenDayEvents.length > 0 && (
                    <button
                      type="button"
                      className="calendar-week-more-timed"
                      onPointerEnter={(pointerEvent) =>
                        showOverflowPreview(
                          `+${hiddenDayEvents.length} timed schedules`,
                          hiddenDayEvents,
                          pointerEvent
                        )
                      }
                      onPointerMove={(pointerEvent) =>
                        showOverflowPreview(
                          `+${hiddenDayEvents.length} timed schedules`,
                          hiddenDayEvents,
                          pointerEvent
                        )
                      }
                      onClick={(clickEvent) => clickEvent.stopPropagation()}
                      onPointerDown={(pointerEvent) =>
                        pointerEvent.stopPropagation()
                      }
                    >
                      +{hiddenDayEvents.length}
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {overflowPreview && (
        <div
          className="calendar-overflow-preview"
          style={{
            left: Math.min(overflowPreview.x + 14, window.innerWidth - 320),
            top: Math.min(overflowPreview.y + 14, window.innerHeight - 190),
          }}
          onPointerLeave={() => setOverflowPreview(null)}
        >
          <strong>{overflowPreview.title}</strong>
          <div className="calendar-overflow-preview-list">
            {overflowPreview.events.map((event) => (
              <button
                key={event.id}
                type="button"
                className="calendar-overflow-preview-item"
                onClick={() => {
                  setOverflowPreview(null);
                  handleEventClick(event);
                }}
              >
                <strong>{event.title}</strong>
                <span>
                  {event.startDate} {event.startTime} → {event.endDate}{" "}
                  {event.endTime}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
