/**
 * ============================================================================
 * Glassday / Mobile Calendar UI (mobile-web only)
 * ============================================================================
 *
 * [이 파일은 어느 화면을 고치나요?]
 * - 휴대전화 브라우저의 Calendar 위젯을 '요약 카드 + 모바일 전체 화면'으로 표시합니다.
 * - 기존 PC 달력의 Day/Week/Month 화면을 작게 축소하는 방식이 아닙니다.
 * - 수정 범위: 이 컴포넌트가 렌더링되는 MobileDashboard의 calendar 슬롯뿐입니다.
 *
 * [연결되는 다른 파일]
 * 1. src/components/mobile/MobileDashboard.tsx
 *    - widgetId === "calendar"일 때 <MobileCalendarCard />를 표시합니다.
 * 2. src/context/DashboardDataContext.tsx
 *    - calendarEvents를 읽고, addCalendarEvent로 새 일정을 생성합니다.
 *    - Calendar / Career가 공유하는 원본 데이터이므로 별도 저장소를 만들지 않습니다.
 * 3. src/components/widgets/CalendarWidget.tsx
 *    - 이벤트 상세 편집, Career 연동, 이벤트 삭제 로직의 기존 소유자입니다.
 *    - WidgetRenderer가 동일한 CalendarWidget을 계속 마운트한 상태에서,
 *      openCalendarEvent()를 호출하여 기존 편집 창을 엽니다.
 * 4. src/components/widgets/WidgetRenderer.tsx
 *    - 실제 CalendarWidget 인스턴스를 계속 유지하므로 데이터/상태가 끊기지 않습니다.
 *    - MobileCalendarCard 안에서 CalendarWidget을 두 번째로 렌더링하지 않습니다.
 * 5. src/components/widgets/calendar/calendarUtils.ts
 *    - 날짜 계산, 여러 날에 걸친 일정 판정, 일정 정렬 등을 공용으로 사용합니다.
 * 6. src/styles/mobile-calendar.css
 *    - 오직 모바일 셸과 이번 모바일 카드/화면만 스타일링합니다.
 *
 * [기존 데이터 보호]
 * - 읽는 키: DashboardDataContext가 사용하는 glassday.calendar.events.v1
 * - Career 연결: 같은 Context의 기존 로직 그대로 사용합니다.
 * - 변경하지 않는 것: 데스크톱 Grid 좌표, CalendarWidget.tsx, Supabase 저장 키.
 *
 * [주의: 새 일정 생성]
 * - 기존 CalendarWidget과 마찬가지로 '새 일정'을 누르는 즉시 New Event가
 *   저장되고 편집창이 열립니다. 저장 없이 취소하는 초안 방식이 아닙니다.
 * - 원치 않는 새 일정을 만들었다면 편집창에서 삭제해야 합니다.
 * ============================================================================
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
} from "lucide-react";

import { useDashboardData } from "../../context/DashboardDataContext";
import { getEventColor } from "../../constants/colors";
import { openCalendarEvent } from "../../constants/widgetNavigation";
import type { CalendarEvent } from "../../types/dashboard";
import {
  addDays,
  eventTouchesDate,
  eventTouchesRange,
  formatEventTime,
  getMonthDates,
  getWeekDates,
  getWeekdayLabel,
  parseDate,
  sortEvents,
  toLocalDateInput,
} from "../widgets/calendar/calendarUtils";

// CSS는 이 컴포넌트를 모바일에서 사용할 때만 번들에 포함합니다.
// src/styles/index.css나 PC 전용 theme 파일은 수정하지 않습니다.
import "../../styles/mobile-calendar.css";

/** '월간 / 주간 / 일정'은 렌더링 방식이며 저장 데이터 형식은 바꾸지 않습니다. */
type MobileCalendarView = "month" | "week" | "agenda";

const MOBILE_VIEWS: ReadonlyArray<{ id: MobileCalendarView; label: string }> = [
  { id: "month", label: "월간" },
  { id: "week", label: "주간" },
  { id: "agenda", label: "일정" },
];

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

/** 숫자 문자열이 아니라 로컬 날짜로 처리해 UTC 타임존 날짜 밀림을 방지합니다. */
const displayMonth = (date: string) =>
  new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(
    parseDate(date),
  );

const displaySelectedDate = (date: string) => {
  const parsed = parseDate(date);
  return `${parsed.getMonth() + 1}월 ${parsed.getDate()}일 (${getWeekdayLabel(date)})`;
};

/**
 * Month step: 1월 31일 + 1개월을 단순 Date.setMonth로 처리하면 3월로 넘어갈
 * 수 있습니다. 대상 월의 마지막 일로 clamp해서 월간 내비게이션을 안정적으로 만듭니다.
 */
const shiftMonthClamped = (dateKey: string, amount: number) => {
  const origin = parseDate(dateKey);
  const targetMonthFirst = new Date(
    origin.getFullYear(),
    origin.getMonth() + amount,
    1,
  );
  const endOfTargetMonth = new Date(
    targetMonthFirst.getFullYear(),
    targetMonthFirst.getMonth() + 1,
    0,
  );
  targetMonthFirst.setDate(Math.min(origin.getDate(), endOfTargetMonth.getDate()));
  return toLocalDateInput(targetMonthFirst);
};

/** 반복 일정을 하루마다 표시할 수 있도록 공통 유틸리티의 범위 판정을 사용합니다. */
const eventsOnDate = (events: CalendarEvent[], date: string) =>
  events.filter((event) => eventTouchesDate(event, date));

/** 한 개의 일정 행을 카드와 전체 화면에서 같이 사용합니다. */
const EventRow = ({
  event,
  onOpen,
}: {
  event: CalendarEvent;
  onOpen: (event: CalendarEvent) => void;
}) => (
  <button
    type="button"
    className="mobile-calendar-event"
    onClick={() => onOpen(event)}
    style={{ "--mobile-calendar-event-color": getEventColor(event) } as CSSProperties}
    aria-label={`${event.title}, ${formatEventTime(event)}, 일정 상세 열기`}
  >
    <span className="mobile-calendar-event__accent" aria-hidden="true" />
    <span className="mobile-calendar-event__content">
      <span className="mobile-calendar-event__title">
        {event.title}
        {event.source === "career" && (
          <span className="mobile-calendar-event__career">Career</span>
        )}
      </span>
      <span className="mobile-calendar-event__meta">
        <Clock3 size={13} aria-hidden="true" /> {formatEventTime(event)}
      </span>
      {event.location && (
        <span className="mobile-calendar-event__meta">
          <MapPin size={13} aria-hidden="true" /> {event.location}
        </span>
      )}
    </span>
    <ChevronRight size={17} className="mobile-calendar-event__chevron" aria-hidden="true" />
  </button>
);

export const MobileCalendarCard = () => {
  // 기존 데이터 Context 한 개만 사용합니다. 여기에서 별도 localStorage를 쓰지 않습니다.
  const { calendarEvents, addCalendarEvent } = useDashboardData();
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateInput());
  const [view, setView] = useState<MobileCalendarView>("month");
  const [detailOpen, setDetailOpen] = useState(false);
  const [pendingNewEventId, setPendingNewEventId] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const detailTitleId = useId();

  // 기본 제공 일정과 Career 일정이 모두 들어오므로 날짜별 필터 전에 정렬합니다.
  const sortedEvents = useMemo(() => sortEvents(calendarEvents), [calendarEvents]);
  const today = toLocalDateInput();
  const selectedDayEvents = useMemo(
    () => eventsOnDate(sortedEvents, selectedDate),
    [sortedEvents, selectedDate],
  );
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const monthInfo = useMemo(() => getMonthDates(selectedDate), [selectedDate]);
  const monthCount = useMemo(
    () => sortedEvents.filter((event) =>
      eventTouchesRange(event, monthInfo.firstDate, monthInfo.lastDate),
    ).length,
    [sortedEvents, monthInfo.firstDate, monthInfo.lastDate],
  );

  // 상세 화면의 '일정' 탭은 선택한 날짜부터 14일 간의 일정을 그룹으로 보여줍니다.
  const agendaDates = useMemo(
    () => Array.from({ length: 14 }, (_, offset) => addDays(selectedDate, offset)),
    [selectedDate],
  );

  /**
   * 원본 CalendarWidget에 이미 OPEN_CALENDAR_EVENT 리스너가 있습니다.
   * 이 이벤트를 통해 기존 편집 창을 열어 데이터 저장/삭제 로직을 재사용합니다.
   * 새로운 모바일용 이벤트 편집기를 중복 구현하지 않는 핵심 연결 지점입니다.
   */
  const openExistingEvent = (event: CalendarEvent) => {
    setDetailOpen(true);
    openCalendarEvent({ eventId: event.id });
  };

  /**
   * 새 이벤트는 DashboardDataContext를 통해 추가합니다.
   * Context의 React 갱신이 끝난 뒤 기존 CalendarWidget이 새 id를 볼 수 있도록
   * 효과(effect) + requestAnimationFrame으로 편집 창을 엽니다.
   */
  const createEvent = () => {
    const newEvent = addCalendarEvent({
      title: "New Event",
      startDate: selectedDate,
      endDate: selectedDate,
      startTime: "09:00",
      endTime: "10:00",
      source: "manual",
    });
    setDetailOpen(true);
    setPendingNewEventId(newEvent.id);
  };

  useEffect(() => {
    if (!pendingNewEventId) return;
    if (!sortedEvents.some((event) => event.id === pendingNewEventId)) return;

    // CalendarWidget의 useEffect 리스너가 최신 calendarEvents를 받아야 하므로
    // 같은 commit 안에서 즉시 dispatch하지 않고 다음 프레임에 전달합니다.
    const frame = window.requestAnimationFrame(() => {
      openCalendarEvent({ eventId: pendingNewEventId });
      setPendingNewEventId(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pendingNewEventId, sortedEvents]);

  /**
   * Portal을 document.body에 렌더링합니다.
   * 이유: MobileLayout의 .mobile-main은 overflow:auto이므로 그 안에서만
   * 전체 화면을 그리면 잘릴 수 있습니다. createPortal로 그 문제를 막습니다.
   * 열릴 때 body 스크롤을 고정하고, 닫을 때 포커스와 스크롤 상태를 복원합니다.
   */
  useEffect(() => {
    if (!detailOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      // CalendarWidget의 이벤트 편집창이 위에 떠 있으면 그 창을 방해하지 않습니다.
      if (document.querySelector(".calendar-floating-window")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setDetailOpen(false);
        return;
      }
      // 외부 헤더/하단 내비게이션에 탭 포커스가 넘어가지 않도록 제한합니다.
      if (event.key !== "Tab") return;
      const panel = document.querySelector<HTMLElement>(".mobile-calendar-detail");
      if (!panel) return;
      const targets = Array.from(panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )).filter((el) => el.getClientRects().length > 0);
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      else triggerRef.current?.focus({ preventScroll: true });
    };
  }, [detailOpen]);

  // 월간 모드에서는 월 이동, 주간에서는 주 이동, 일정 목록에서는 하루씩 이동합니다.
  const navigate = (step: -1 | 1) => {
    setSelectedDate((date) => {
      if (view === "month") return shiftMonthClamped(date, step);
      if (view === "week") return addDays(date, step * 7);
      return addDays(date, step);
    });
  };

  /** 단일 날짜 리스트의 공통 Empty State. */
  const renderSelectedDay = (limit?: number) => {
    const rows = limit ? selectedDayEvents.slice(0, limit) : selectedDayEvents;
    return (
      <div className="mobile-calendar-agenda">
        {rows.length === 0 ? (
          <p className="mobile-calendar-empty">선택한 날짜에 등록된 일정이 없어요.</p>
        ) : rows.map((event) => (
          <EventRow event={event} key={event.id} onOpen={openExistingEvent} />
        ))}
        {limit && selectedDayEvents.length > limit && (
          <button
            type="button"
            className="mobile-calendar-more"
            onClick={() => setDetailOpen(true)}
          >
            나머지 {selectedDayEvents.length - limit}개 일정 보기
            <ArrowUpRight size={15} aria-hidden="true" />
          </button>
        )}
      </div>
    );
  };

  /** 모바일 카드는 7일 날짜 스트립으로 사용자가 바로 다른 날짜를 선택합니다. */
  const renderWeekStrip = (dates: string[]) => (
    <div className="mobile-calendar-week-strip" role="group" aria-label="날짜 선택">
      {dates.map((date) => {
        const selected = date === selectedDate;
        const isToday = date === today;
        const count = eventsOnDate(sortedEvents, date).length;
        return (
          <button
            type="button"
            key={date}
            onClick={() => setSelectedDate(date)}
            className={`mobile-calendar-week-day${selected ? " is-selected" : ""}${isToday ? " is-today" : ""}`}
            aria-pressed={selected}
            aria-label={`${date}, ${count}개 일정`}
          >
            <span>{getWeekdayLabel(date)}</span>
            <strong>{parseDate(date).getDate()}</strong>
            <i className={count ? "has-event" : ""} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );

  /**
   * 42일 월간 그리드. 날짜 버튼은 일정 편집기가 아니라 '날짜 선택'만 수행합니다.
   * 여러 날에 걸친 일정 역시 eventTouchesDate가 해당 날에 표시해 줍니다.
   */
  const renderMonthGrid = () => (
    <div className="mobile-calendar-month">
      <div className="mobile-calendar-month__weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="mobile-calendar-month__grid" role="group" aria-label="월간 날짜 선택">
        {monthInfo.dates.map((date) => {
          const count = eventsOnDate(sortedEvents, date).length;
          const selected = date === selectedDate;
          const outsideMonth = !date.startsWith(monthInfo.currentMonth);
          const isToday = date === today;
          return (
            <button
              type="button"
              key={date}
              className={`mobile-calendar-month__day${selected ? " is-selected" : ""}${outsideMonth ? " is-other-month" : ""}${isToday ? " is-today" : ""}`}
              onClick={() => setSelectedDate(date)}
              aria-pressed={selected}
              aria-label={`${date}, ${count}개 일정`}
            >
              <span>{parseDate(date).getDate()}</span>
              <span className="mobile-calendar-month__dots" aria-hidden="true">
                {Array.from({ length: Math.min(count, 3) }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* [모바일 홈/워크스페이스의 Calendar 카드]
          상위 MobileDashboard가 위젯 높이를 auto로 변경해 이 카드의 크기를 내용에 맞춥니다. */}
      <section className="mobile-calendar-card" aria-label="모바일 캘린더 요약">
        <header className="mobile-calendar-card__header">
          <span className="mobile-calendar-card__label">
            <CalendarDays size={17} aria-hidden="true" /> Calendar
          </span>
          <button
            type="button"
            className="mobile-calendar-card__open"
            ref={triggerRef}
            onClick={() => setDetailOpen(true)}
          >
            전체 보기 <ArrowUpRight size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="mobile-calendar-card__summary">
          <div>
            <strong>{displaySelectedDate(selectedDate)}</strong>
            <span>이번 달 등록 일정 {monthCount}개</span>
          </div>
          <button type="button" className="mobile-calendar-add" onClick={createEvent}
            aria-label={`${selectedDate}에 새 일정 추가`}>
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>

        {renderWeekStrip(weekDates)}

        <div className="mobile-calendar-card__agenda-heading">
          <strong>선택한 날짜의 일정</strong>
          <span>{selectedDayEvents.length}개</span>
        </div>
        {renderSelectedDay(3)}
      </section>

      {/* [모바일 캘린더 전체 화면]
          MobileLayout 안이 아닌 document.body에 Portal로 띄웁니다.
          CalendarWidget의 PC 레이아웃이나 FloatingWindow 위치 저장값을 수정하지 않습니다. */}
      {detailOpen && createPortal(
        <section className="mobile-calendar-detail" role="dialog" aria-modal="true"
          aria-labelledby={detailTitleId}>
          <header className="mobile-calendar-detail__header">
            <button type="button" ref={closeRef} className="mobile-calendar-detail__back"
              onClick={() => setDetailOpen(false)} aria-label="캘린더 상세 닫기">
              <ChevronLeft size={21} aria-hidden="true" /> 뒤로
            </button>
            <h2 id={detailTitleId}>Calendar</h2>
            <button type="button" className="mobile-calendar-detail__add" onClick={createEvent}
              aria-label="선택한 날짜에 일정 추가">
              <Plus size={22} aria-hidden="true" />
            </button>
          </header>

          <div className="mobile-calendar-detail__scroll">
            {/* 뷰 전환은 데이터 변경이 아니라 같은 날짜를 다른 방식으로 표현하는 동작입니다. */}
            <nav className="mobile-calendar-view-switch" aria-label="캘린더 보기 방식">
              {MOBILE_VIEWS.map((item) => (
                <button key={item.id} type="button" onClick={() => setView(item.id)}
                  aria-pressed={view === item.id}
                  className={view === item.id ? "is-selected" : ""}>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="mobile-calendar-period-nav">
              <button type="button" onClick={() => navigate(-1)} aria-label="이전 기간">
                <ChevronLeft size={21} aria-hidden="true" />
              </button>
              <div>
                <strong>{displayMonth(selectedDate)}</strong>
                <span>{displaySelectedDate(selectedDate)}</span>
              </div>
              <button type="button" onClick={() => setSelectedDate(toLocalDateInput())}
                className="mobile-calendar-period-nav__today">오늘</button>
              <button type="button" onClick={() => navigate(1)} aria-label="다음 기간">
                <ChevronRight size={21} aria-hidden="true" />
              </button>
            </div>

            {/* 월간: 42칸 날짜 그리드 + 선택일 일정 목록 */}
            {view === "month" && renderMonthGrid()}

            {/* 주간: 7일을 터치로 선택하고 해당 주 날짜별 목록 표시 */}
            {view === "week" && renderWeekStrip(weekDates)}

            <div className="mobile-calendar-detail__list-heading">
              <strong>{view === "agenda" ? "다가오는 14일" : view === "week" ? "이번 주 일정" : displaySelectedDate(selectedDate)}</strong>
              {view === "month" && <span>{selectedDayEvents.length}개</span>}
            </div>

            {view === "month" ? renderSelectedDay() : (
              <div className="mobile-calendar-date-groups">
                {(view === "week" ? weekDates : agendaDates).map((date) => {
                  const events = eventsOnDate(sortedEvents, date);
                  // 일정 탭은 비어 있는 날짜를 생략해 불필요한 스크롤을 줄입니다.
                  if (view === "agenda" && events.length === 0) return null;
                  return (
                    <section key={date} className="mobile-calendar-date-group">
                      <div className="mobile-calendar-date-group__heading">
                        <strong>{displaySelectedDate(date)}</strong>
                        <small>{events.length}개</small>
                      </div>
                      {events.length ? events.map((event) => (
                        <EventRow key={`${date}:${event.id}`} event={event} onOpen={openExistingEvent} />
                      )) : <p className="mobile-calendar-empty">일정 없음</p>}
                    </section>
                  );
                })}
                {view === "agenda" && !sortedEvents.some((event) =>
                  eventTouchesRange(event, agendaDates[0], agendaDates[agendaDates.length - 1])) && (
                  <p className="mobile-calendar-empty">선택한 날짜 이후 14일간 등록된 일정이 없어요.</p>
                )}
              </div>
            )}
          </div>
        </section>,
        document.body,
      )}
    </>
  );
};
