/**
 * ============================================================
 * [Status UI] Global Sync Indicator
 * ============================================================
 *
 * Role:
 * - Gives one quiet app-level signal for local/cloud save state.
 *
 * Connections:
 * - Host: src/App.tsx
 * - Data: src/context/CloudSyncContext.tsx
 * - Style: src/styles/command.css
 *
 * UX:
 * - Avoids adding save labels inside every widget.
 * - Korean: 저장 상태는 화면 곳곳에 흩뿌리지 않고 작은 전역 표시 하나로만 보여줍니다.
 * ============================================================
 */

import { Cloud, CloudOff, Loader2, WifiOff } from "lucide-react";

import { useCloudSync } from "../../context/CloudSyncContext";
import { cn } from "../../lib/utils";

const toIndicatorCopy = ({
  isConfigured,
  hasUser,
  status,
}: {
  isConfigured: boolean;
  hasUser: boolean;
  status: string;
}) => {
  if (!isConfigured || !hasUser) {
    return {
      label: "Local",
      title: "Local mode. Your data is saved on this device.",
      tone: "local",
      icon: CloudOff,
    };
  }

  if (status === "syncing" || status === "authenticating") {
    return {
      label: "Syncing",
      title: "Syncing your Glassday data.",
      tone: "syncing",
      icon: Loader2,
    };
  }

  if (status === "error") {
    return {
      label: "Sync failed",
      title: "Cloud sync failed. Local data is still kept on this device.",
      tone: "error",
      icon: WifiOff,
    };
  }

  return {
    label: status === "synced" ? "Saved" : "Ready",
    title: "Cloud sync is ready. Local edits save immediately.",
    tone: "synced",
    icon: Cloud,
  };
};

export const GlobalSyncIndicator = () => {
  const { isConfigured, user, syncStatus, syncMessage, lastSyncedAt } =
    useCloudSync();
  const copy = toIndicatorCopy({
    isConfigured,
    hasUser: Boolean(user),
    status: syncStatus,
  });
  const Icon = copy.icon;
  const title = [
    copy.title,
    syncMessage,
    lastSyncedAt
      ? `Last sync: ${new Date(lastSyncedAt).toLocaleString()}`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cn("global-sync-indicator", `is-${copy.tone}`)}
      title={title}
      aria-live="polite"
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{copy.label}</span>
    </div>
  );
};
