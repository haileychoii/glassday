import type { ComponentType } from "react";

export type WidgetId = string;

export type WidgetSize = "small" | "medium" | "large" | "wide" | "tall";

export type WidgetCategory =
  | "core"
  | "life"
  | "career"
  | "study"
  | "health"
  | "money"
  | "system"
  | string;

export type WidgetMeta = {
  id: WidgetId;
  label: string;
  description?: string;
  icon?: string | ComponentType<{ className?: string }>;
  category?: WidgetCategory;
  defaultSize?: WidgetSize;
  [key: string]: unknown;
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
  moved?: boolean;
  [key: string]: unknown;
};

export type Layouts = Record<string, GridLayoutItem[]>;

export type DashboardLayoutMode = "wide" | "laptop";

export type DashboardModeLayouts = Record<DashboardLayoutMode, Layouts>;

export type DashboardTab = {
  id: WorkspaceId;
  label: string;
  icon: string;
  widgetIds: WidgetId[];
  /* Layouts are stored per presentation mode so wide-web edits never
     overwrite the dedicated laptop-app arrangement. */
  layouts: DashboardModeLayouts;
  locked?: boolean;
};
