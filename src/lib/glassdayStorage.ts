/**
 * ============================================================
 * [Persistence Contract] Glassday Snapshot + Storage Events
 * ============================================================
 *
 * 역할:
 * - glassday.* localStorage key를 찾고 versioned snapshot을 생성/복원한다.
 * - 같은 탭에서도 storage 변경을 구독할 수 있도록 Storage API를 patch하고
 *   GLASSDAY_STORAGE_EVENT를 발생시킨다.
 *
 * 연결:
 * - Local state Hook: src/hooks/useLocalStorage.ts
 * - Cloud provider: src/context/CloudSyncContext.tsx
 * - Manual backup/reset: src/utils/backup.ts
 * - Dashboard schema: src/constants/dashboardStorage.ts
 *
 * 중요한 경계:
 * - durable user content와 local UI shell을 분리한다.
 * - 허용 prefix, snapshot version 또는 schema 판단을 바꾸면 로그인 복원,
 *   backup import, 모든 저장형 Widget에 동시에 영향을 준다.
 * ============================================================
 */
import {
  DASHBOARD_STORAGE_SCHEMA_KEY,
  DASHBOARD_STORAGE_SCHEMA_VERSION,
} from "../constants/dashboardStorage";

export const GLASSDAY_STORAGE_PREFIX = "glassday.";
export const GLASSDAY_STORAGE_EVENT = "glassday-storage-change";
export const GLASSDAY_STORAGE_SNAPSHOT_VERSION = 3;
export const GLASSDAY_LOCAL_SYNC_UPDATED_AT_KEY =
  "glassday.sync.localUpdatedAt.v1";

/** local backup과 Supabase payload가 공유하는 versioned envelope. */
export type GlassdayStorageSnapshot = {
  app: "Glassday";
  version: number;
  exportedAt: string;
  data: Record<string, string>;
};

export type GlassdayStorageChangeDetail = {
  key?: string;
  type: "set" | "remove" | "bulk";
};

const isBrowser = () => typeof window !== "undefined";

/* Cloud Sync Scope: durable user content.
   Wide/Laptop mode, active tab, Grid layout, theme은 이 브라우저의 view shell이므로
   오래된 cloud snapshot이 로그인 직후 화면을 되돌리지 않도록 제외한다. */
const CLOUD_SYNC_ALLOWED_PREFIXES = [
  "glassday.calendar.",
  "glassday.career.",
  "glassday.custom.web-fonts.",
  "glassday.health",
  "glassday.journal.",
  "glassday.memo.default-font.",
  "glassday.memo.notes.",
  "glassday.money",
  "glassday.mood",
  "glassday.quickCapture.",
  "glassday.study.",
  "glassday.today.",
  "glassday.todayFocus.",
  "glassday.ui.font.",
] as const;

const CLOUD_SYNC_DASHBOARD_STATE_PREFIXES = [
  "glassday.dashboard.activeTab.",
  "glassday.dashboard.layoutMode.",
  "glassday.dashboard.pendingAuthLayoutMode.",
  "glassday.dashboard.storageSchema.",
  "glassday.dashboard.tabs.",
] as const;

const CLOUD_SYNC_MEANINGFUL_PREFIXES = [
  "glassday.calendar.events.",
  "glassday.career.applications.",
  "glassday.career.items.",
  "glassday.journal.entries.",
  "glassday.memo.notes.",
  "glassday.quickCapture.inbox.",
  "glassday.study.records.",
  "glassday.study.tasks.",
  "glassday.study.planner.",
] as const;

const isCloudSyncAllowedKey = (key: string) =>
  CLOUD_SYNC_ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix));

const isCloudSyncDashboardStateKey = (key: string) =>
  CLOUD_SYNC_DASHBOARD_STATE_PREFIXES.some((prefix) => key.startsWith(prefix));

const isMeaningfulCloudSyncKey = (key: string) =>
  CLOUD_SYNC_MEANINGFUL_PREFIXES.some((prefix) => key.startsWith(prefix));

const toTimestamp = (value: string | null | undefined) => {
  if (!value) return 0;

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const hasMeaningfulValue = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return false;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.length > 0;
    }

    if (parsed && typeof parsed === "object") {
      return Object.keys(parsed as Record<string, unknown>).length > 0;
    }

    if (typeof parsed === "string") {
      return parsed.trim().length > 0;
    }

    return Boolean(parsed);
  } catch {
    return trimmed.length > 0;
  }
};

export const isCompatibleGlassdayStorageSnapshot = (
  snapshot: unknown
): snapshot is GlassdayStorageSnapshot => {
  if (!snapshot || typeof snapshot !== "object") return false;

  const candidate = snapshot as Partial<GlassdayStorageSnapshot>;

  return (
    candidate.app === "Glassday" &&
    candidate.version === GLASSDAY_STORAGE_SNAPSHOT_VERSION &&
    typeof candidate.exportedAt === "string" &&
    Boolean(candidate.data && typeof candidate.data === "object")
  );
};

export const getGlassdayLocalStorageKeys = () => {
  if (!isBrowser()) return [];

  return Object.keys(window.localStorage).filter((key) =>
    key.startsWith(GLASSDAY_STORAGE_PREFIX)
  );
};

export const getGlassdayLocalUpdatedAt = () => {
  if (!isBrowser()) return null;

  return window.localStorage.getItem(GLASSDAY_LOCAL_SYNC_UPDATED_AT_KEY);
};

/**
 * Cloud Sync Marker
 *
 * Supabase row의 `updated_at`을 이 브라우저의 마지막 동기화 시각으로 기록한다.
 * Widget data와 별도인 비교용 metadata이며 cloud snapshot에는 포함되지 않는다.
 * 이 값이 정확해야 focus/visibility refresh에서 이미 적용한 remote snapshot을
 * 반복해서 다시 적용하지 않는다.
 */
export const markGlassdayLocalSyncedAt = (syncedAt: string) => {
  if (!isBrowser()) return;

  window.localStorage.setItem(GLASSDAY_LOCAL_SYNC_UPDATED_AT_KEY, syncedAt);
};

export const getGlassdaySnapshotMeaningfulScore = (
  snapshot: GlassdayStorageSnapshot
) => {
  return Object.entries(snapshot.data).reduce((score, [key, value]) => {
    if (!isMeaningfulCloudSyncKey(key)) return score;

    return score + (hasMeaningfulValue(value) ? 1 : 0);
  }, 0);
};

export const getGlassdaySnapshotTimestamp = (
  snapshot: GlassdayStorageSnapshot
) => {
  return toTimestamp(snapshot.exportedAt);
};

export const emitGlassdayStorageChange = (
  detail: GlassdayStorageChangeDetail
) => {
  if (!isBrowser()) return;

  window.dispatchEvent(
    new CustomEvent<GlassdayStorageChangeDetail>(GLASSDAY_STORAGE_EVENT, {
      detail,
    })
  );
};

export const createGlassdayStorageSnapshot = (): GlassdayStorageSnapshot => {
  const data: Record<string, string> = {};

  getGlassdayLocalStorageKeys().forEach((key) => {
    if (!isCloudSyncAllowedKey(key)) return;

    const value = window.localStorage.getItem(key);

    if (value !== null) {
      data[key] = value;
    }
  });

  data[DASHBOARD_STORAGE_SCHEMA_KEY] = String(DASHBOARD_STORAGE_SCHEMA_VERSION);

  return {
    app: "Glassday",
    version: GLASSDAY_STORAGE_SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
};

export const applyGlassdayStorageSnapshot = (
  snapshot: GlassdayStorageSnapshot,
  syncedAt = snapshot.exportedAt
) => {
  const result = {
    skippedIncompatibleDashboardState: false,
  };

  if (!isBrowser()) return result;

  const dashboardSchemaVersion = Number(
    snapshot.data[DASHBOARD_STORAGE_SCHEMA_KEY] ?? 0
  );
  const canApplyDashboardState =
    dashboardSchemaVersion >= DASHBOARD_STORAGE_SCHEMA_VERSION;

  Object.entries(snapshot.data).forEach(([key, value]) => {
    if (isCloudSyncDashboardStateKey(key) && !canApplyDashboardState) {
      result.skippedIncompatibleDashboardState = true;
      return;
    }

    if (
      key.startsWith(GLASSDAY_STORAGE_PREFIX) &&
      isCloudSyncAllowedKey(key)
    ) {
      window.localStorage.setItem(key, value);
    }
  });

  markGlassdayLocalSyncedAt(syncedAt);

  emitGlassdayStorageChange({
    type: "bulk",
  });

  return result;
};

let storageEventsPatched = false;

/*
 * Event Bridge:
 * native storage event는 값을 쓴 현재 document에는 전달되지 않는다.
 * Storage.prototype을 한 번만 감싸 동일 탭 useLocalStorage와 CloudSync upload가
 * 같은 변경 신호를 받을 수 있게 한다.
 */
export const patchLocalStorageEvents = () => {
  if (!isBrowser() || storageEventsPatched) return;

  const storageProto = Storage.prototype;
  const originalSetItem = storageProto.setItem;
  const originalRemoveItem = storageProto.removeItem;
  const originalClear = storageProto.clear;

  storageProto.setItem = function patchedSetItem(
    key: string,
    value: string
  ) {
    originalSetItem.call(this, key, value);

    if (isCloudSyncAllowedKey(key)) {
      originalSetItem.call(
        this,
        GLASSDAY_LOCAL_SYNC_UPDATED_AT_KEY,
        new Date().toISOString()
      );
    }

    if (key.startsWith(GLASSDAY_STORAGE_PREFIX)) {
      emitGlassdayStorageChange({
        key,
        type: "set",
      });
    }
  };

  storageProto.removeItem = function patchedRemoveItem(key: string) {
    originalRemoveItem.call(this, key);

    if (isCloudSyncAllowedKey(key)) {
      originalSetItem.call(
        this,
        GLASSDAY_LOCAL_SYNC_UPDATED_AT_KEY,
        new Date().toISOString()
      );
    }

    if (key.startsWith(GLASSDAY_STORAGE_PREFIX)) {
      emitGlassdayStorageChange({
        key,
        type: "remove",
      });
    }
  };

  storageProto.clear = function patchedClear() {
    originalClear.call(this);
    emitGlassdayStorageChange({
      type: "bulk",
    });
  };

  storageEventsPatched = true;
};
