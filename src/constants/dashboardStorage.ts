export const DASHBOARD_LAYOUT_MODE_KEY = "glassday.dashboard.layoutMode.v1";
export const DASHBOARD_PENDING_AUTH_LAYOUT_MODE_KEY =
  "glassday.dashboard.pendingAuthLayoutMode.v1";
export const DASHBOARD_STORAGE_SCHEMA_KEY =
  "glassday.dashboard.storageSchema.v1";

/* Bump this when saved dashboard structure changes in a way that old cloud
   snapshots should not be allowed to overwrite. */
export const DASHBOARD_STORAGE_SCHEMA_VERSION = 3;
