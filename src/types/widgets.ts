export type WidgetType =
  | "today"
  | "calendar"
  | "memo"
  | "study"
  | "career"
  | "health"
  | "money"
  | "mood";

export interface WidgetConfig {
  id: WidgetType;
  title: string;
}