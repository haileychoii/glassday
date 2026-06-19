import type { Layouts } from "react-grid-layout";

export type WidgetId =
  | "today"
  | "alerts"
  | "journal"
  | "calendar"
  | "memo"
  | "study"
  | "career"
  | "health"
  | "money"
  | "mood";

export type DashboardTabId = string;

export type DashboardTab = {
  id: DashboardTabId;
  label: string;
  icon: string;
  widgetIds: WidgetId[];
  layouts: Layouts;
  locked?: boolean;
};

export type WidgetMeta = {
  id: WidgetId;
  label: string;
  description: string;
  category: "home" | "career" | "study" | "memo" | "life" | "money";
};