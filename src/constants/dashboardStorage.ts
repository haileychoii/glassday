/**
 * ============================================================
 * [Persistence Tokens] Dashboard Shell Storage Contract
 * ============================================================
 *
 * 연결:
 * - src/App.tsx: Wide/Laptop mode 복원
 * - src/context/CloudSyncContext.tsx: OAuth 왕복 중 mode 보존
 * - src/hooks/useDashboardTabs.ts: 저장 schema migration
 * - src/lib/glassdayStorage.ts: 호환되지 않는 cloud UI state 차단
 *
 * 주의:
 * - key와 version은 기존 사용자 Grid 상태의 compatibility contract다.
 * - Figma layout 이름을 정리하더라도 migration 없이 이 문자열을 바꾸지 않는다.
 * ============================================================
 */
export const DASHBOARD_LAYOUT_MODE_KEY = "glassday.dashboard.layoutMode.v1";
export const DASHBOARD_PENDING_AUTH_LAYOUT_MODE_KEY =
  "glassday.dashboard.pendingAuthLayoutMode.v1";
export const DASHBOARD_STORAGE_SCHEMA_KEY =
  "glassday.dashboard.storageSchema.v1";

/* 저장된 Dashboard 구조가 달라져 오래된 cloud UI state를 적용하면 안 될 때만 올린다. */
export const DASHBOARD_STORAGE_SCHEMA_VERSION = 3;
