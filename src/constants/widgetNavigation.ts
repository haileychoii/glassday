import type { WidgetId } from "../types/workspace";

export const OPEN_WIDGET_EVENT = "glassday:open-widget";
export const OPEN_CALENDAR_EVENT = "glassday:open-calendar-event";
export const OPEN_MEMO_EVENT = "glassday:open-memo-note";

export type OpenWidgetDetail = {
  widgetId: WidgetId;
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
