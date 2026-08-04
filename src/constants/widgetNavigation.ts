/**
 * ============================================================
 * [UI Event Bus] Cross-widget Navigation Requests
 * ============================================================
 *
 * 역할:
 * - Context로 직접 결합하지 않고 TodayFocus 등에서 다른 Widget/tab/detail을 연다.
 *
 * Listener 연결:
 * - OPEN_WIDGET_EVENT: src/App.tsx가 tab을 전환한다.
 * - OPEN_CALENDAR_EVENT: src/components/widgets/CalendarWidget.tsx
 * - OPEN_MEMO_EVENT: src/components/widgets/MemoWidget.tsx
 *
 * Figma Mapping:
 * - Today Focus item의 Navigate interaction과 Calendar/Memo의 Selected Detail Variant다.
 *
 * 수정 영향:
 * - WidgetId는 src/constants/widgets.ts와 DashboardGrid renderer key에 존재해야 한다.
 * ============================================================
 */
import type { WidgetId } from "../types/workspace";

export const OPEN_WIDGET_EVENT = "glassday:open-widget";
export const OPEN_CALENDAR_EVENT = "glassday:open-calendar-event";
export const OPEN_MEMO_EVENT = "glassday:open-memo-note";

export type OpenWidgetDetail = {
  /** App이 활성화할 Widget registry key. */
  widgetId: WidgetId;
  /** 같은 Widget이 여러 tab에 있을 때 우선 열 tab id. */
  preferredTabId?: string;
};

export type OpenCalendarEventDetail = {
  eventId: string;
};

export type OpenMemoEventDetail = {
  noteId: string;
};

export const openWidget = (detail: OpenWidgetDetail) => {
  window.dispatchEvent(new CustomEvent<OpenWidgetDetail>(OPEN_WIDGET_EVENT, { detail }));
};

export const openCalendarEvent = (detail: OpenCalendarEventDetail) => {
  window.dispatchEvent(
    new CustomEvent<OpenCalendarEventDetail>(OPEN_CALENDAR_EVENT, { detail })
  );
};

export const openMemoNote = (detail: OpenMemoEventDetail) => {
  window.dispatchEvent(
    new CustomEvent<OpenMemoEventDetail>(OPEN_MEMO_EVENT, { detail })
  );
};
