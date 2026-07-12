export const GLASSDAY_STORAGE_PREFIX = "glassday.";
export const GLASSDAY_STORAGE_EVENT = "glassday-storage-change";
export const GLASSDAY_STORAGE_SNAPSHOT_VERSION = 3;

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

const isCloudSyncAllowedKey = (key: string) =>
  CLOUD_SYNC_ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix));

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
    version: GLASSDAY_STORAGE_SNAPSHOT_VERSION,
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
