import {
  DASHBOARD_STORAGE_SCHEMA_KEY,
  DASHBOARD_STORAGE_SCHEMA_VERSION,
} from "../constants/dashboardStorage";

export const GLASSDAY_STORAGE_PREFIX = "glassday.";
export const GLASSDAY_STORAGE_EVENT = "glassday-storage-change";
export const GLASSDAY_STORAGE_SNAPSHOT_VERSION = 3;
export const GLASSDAY_LOCAL_SYNC_UPDATED_AT_KEY =
  "glassday.sync.localUpdatedAt.v1";

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

/* Cloud sync should restore durable user content plus shared dashboard structure.
   Wide and laptop mode still keep separate layouts inside the same tab payload,
   so one signed-in user can move between modes/devices and keep the same memory.
   Device-only view state such as sidebar collapse, preview frame position, and
   floating window rects stay local and are intentionally excluded. */
const CLOUD_SYNC_ALLOWED_PREFIXES = [
  "glassday.calendar.",
  "glassday.career.",
  "glassday.custom.web-fonts.",
  "glassday.dashboard.activeTab.",
  "glassday.dashboard.layoutMode.",
  "glassday.dashboard.storageSchema.",
  "glassday.dashboard.tabs.",
  "glassday.health",
  "glassday.journal.",
  "glassday.memo.default-font.",
  "glassday.memo.notes.",
  "glassday.money",
  "glassday.mood",
  "glassday.study.",
  "glassday.theme",
  "glassday.today.",
  "glassday.todayFocus.",
  "glassday.ui.font.",
] as const;

const CLOUD_SYNC_DASHBOARD_STATE_PREFIXES = [
  "glassday.dashboard.activeTab.",
  "glassday.dashboard.layoutMode.",
  "glassday.dashboard.tabs.",
] as const;

const CLOUD_SYNC_MEANINGFUL_PREFIXES = [
  "glassday.calendar.events.",
  "glassday.career.applications.",
  "glassday.career.items.",
  "glassday.journal.entries.",
  "glassday.memo.notes.",
  "glassday.study.records.",
  "glassday.study.tasks.",
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
  snapshot: GlassdayStorageSnapshot
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

  window.localStorage.setItem(
    GLASSDAY_LOCAL_SYNC_UPDATED_AT_KEY,
    snapshot.exportedAt
  );

  emitGlassdayStorageChange({
    type: "bulk",
  });

  return result;
};

let storageEventsPatched = false;

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
