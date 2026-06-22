export type WidgetId =
  | "today"
  | "todayMini"
  | "todayTasks"
  | "calendar"
  | "career"
  | "study"
  | "memo"
  | "journal"
  | "mood"
  | "health"
  | "money"
  | "wealth"
  | "topThree"
  | "schedule"
  | "alerts";

export type WidgetSize = "small" | "medium" | "large" | "wide" | "tall";

export type WidgetMeta = {
  id: WidgetId;
  label: string;
  description?: string;
  icon?: string;
  defaultSize?: WidgetSize;
};

export type WorkspaceId = string;

export type GridLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
};

export type Layouts = Record<string, GridLayoutItem[]>;

export type DashboardTab = {
  id: WorkspaceId;
  label: string;
  icon: string;
  widgetIds: WidgetId[];
  layouts: Layouts;
  locked?: boolean;
};