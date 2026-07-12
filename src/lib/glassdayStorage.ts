export const GLASSDAY_STORAGE_PREFIX = "glassday.";
export const GLASSDAY_STORAGE_EVENT = "glassday-storage-change";

export type GlassdayStorageSnapshot = {
  app: "Glassday";
  version: 2;
  exportedAt: string;
  data: Record<string, string>;
};

export type GlassdayStorageChangeDetail = {
  key?: string;
  type: "set" | "remove" | "bulk";
};

const isBrowser = () => typeof window !== "undefined";

/* Cloud sync should restore durable user content, not device-specific UI state.
   In practice this prevents old snapshots from overwriting preview-only layout,
   tab composition, collapsed sidebar state, floating window positions, and other
   branch-specific view scaffolding after login on Vercel. */
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
  "glassday.study.",
  "glassday.theme",
  "glassday.today.",
  "glassday.todayFocus.",
  "glassday.ui.font.",
] as const;

const isCloudSyncAllowedKey = (key: string) =>
  CLOUD_SYNC_ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix));

export const getGlassdayLocalStorageKeys = () => {
  if (!isBrowser()) return [];

  return Object.keys(window.localStorage).filter((key) =>
    key.startsWith(GLASSDAY_STORAGE_PREFIX)
  );
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

  return {
    app: "Glassday",
    version: 2,
    exportedAt: new Date().toISOString(),
    data,
  };
};

export const applyGlassdayStorageSnapshot = (
  snapshot: GlassdayStorageSnapshot
) => {
  if (!isBrowser()) return;

  Object.entries(snapshot.data).forEach(([key, value]) => {
    if (
      key.startsWith(GLASSDAY_STORAGE_PREFIX) &&
      isCloudSyncAllowedKey(key)
    ) {
      window.localStorage.setItem(key, value);
    }
  });

  emitGlassdayStorageChange({
    type: "bulk",
  });
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

    if (key.startsWith(GLASSDAY_STORAGE_PREFIX)) {
      emitGlassdayStorageChange({
        key,
        type: "set",
      });
    }
  };

  storageProto.removeItem = function patchedRemoveItem(key: string) {
    originalRemoveItem.call(this, key);

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
