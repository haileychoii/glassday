/**
 * ============================================================
 * [Figma Mapping] Workspace and Grid Contracts
 * ============================================================
 *
 * 역할:
 * - Workspace Tab, Widget metadata, react-grid-layout 좌표의 공통 Type 계약이다.
 * - `DashboardGrid`, `gridDefaults`, `dashboardTabs`, `useDashboardTabs`가 공유한다.
 *
 * 저장 영향:
 * - 이 구조는 localStorage의 Dashboard Tab payload 형태와 직접 연결된다.
 * - 필드명 변경 시 migration 없이 기존 사용자 layout을 읽을 수 없게 된다.
 * ============================================================
 */
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
  /** Widget Registry와 Component map을 연결하는 영구 key. */
  i: string;
  /** 16-column Grid 안의 시작 column과 row. */
  x: number;
  y: number;
  /** column/row 단위 Frame 크기. 실제 px은 DashboardGrid의 rowHeight/gap에서 계산된다. */
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
  /** activeTab 및 저장 payload에서 사용하는 Workspace 영구 key. */
  id: WorkspaceId;
  label: string;
  icon: string;
  widgetIds: WidgetId[];
  /** Wide Web 편집이 Laptop App 배치를 덮어쓰지 않도록 mode별로 분리된 layout. */
  layouts: DashboardModeLayouts;
  locked?: boolean;
};
