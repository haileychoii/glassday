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

export type DashboardTab = {
  id: WorkspaceId;
  label: string;
  icon: string;
  widgetIds: WidgetId[];
  layouts: Layouts;
  locked?: boolean;
};