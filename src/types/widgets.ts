/**
 * ============================================================
 * [Public Barrel] Widget Registry + Workspace Types
 * ============================================================
 *
 * 역할:
 * - Widget 관련 type과 registry export를 한 경로에서 다시 노출한다.
 * - 실제 정의는 src/types/workspace.ts와 src/constants/widgets.ts에 있다.
 *
 * 주의:
 * - 이 파일은 renderer가 아니다. 실제 WidgetId -> React Component 연결은
 *   src/components/grid/DashboardGrid.tsx의 widgetMap에서 확인한다.
 * ============================================================
 */
export type {
  DashboardTab,
  GridLayoutItem,
  Layouts,
  WidgetCategory,
  WidgetId,
  WidgetMeta,
  WidgetSize,
  WorkspaceId,
} from "./workspace";

export { allWidgetIds, widgetRegistry } from "../constants/widgets";
