/**
 * ============================================================
 * [Persistence Adapter] Quick Capture
 * ============================================================
 *
 * Role:
 * - Stores fast, unclassified captures in a small local Inbox.
 * - Routes selected capture types into existing Glassday data keys when safe.
 *
 * Connections:
 * - UI: src/components/quick-capture/QuickCapture.tsx
 * - Search: src/lib/universalSearch.ts
 * - Sync/Backup: src/lib/glassdayStorage.ts includes glassday.quickCapture.*
 *
 * Notes:
 * - This intentionally does not introduce a heavy database-like model.
 * - Korean: 빠른 기록은 Inbox에 남기고, Memo/Today task처럼 안정적인 기존 구조만 직접 갱신합니다.
 * ============================================================
 */

import { getSavedDefaultMemoFont } from "../constants/fonts";

export const QUICK_CAPTURE_INBOX_KEY = "glassday.quickCapture.inbox.v1";

const MEMO_NOTES_KEY = "glassday.memo.notes.v2";
const TODAY_FOCUS_TASKS_KEY = "glassday.todayFocus.tasks.v1";

export type QuickCaptureKind =
  | "inbox"
  | "memo"
  | "task"
  | "idea"
  | "url"
  | "expense"
  | "journal";

export type QuickCaptureEntry = {
  id: string;
  kind: QuickCaptureKind;
  text: string;
  createdAt: string;
  source: "quick-capture";
};

type MemoNoteRecord = {
  id: string;
  title: string;
  html: string;
  fontFamily: string;
  fontSize: string;
  color: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
};

type TodayFocusTaskRecord = {
  id: string;
  text: string;
  done: boolean;
};

export type QuickCaptureResult = {
  entry: QuickCaptureEntry;
  routedTo: "inbox" | "memo" | "today-task";
};

const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isBrowser = () => typeof window !== "undefined";

const readArray = <T,>(key: string): T[] => {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const writeArray = <T,>(key: string, value: T[]) => {
  if (!isBrowser()) return;

  window.localStorage.setItem(key, JSON.stringify(value));
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const toMemoTitle = (text: string) => {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim());
  return firstLine?.trim().slice(0, 80) || "Quick memo";
};

const appendInboxEntry = (entry: QuickCaptureEntry) => {
  const inbox = readArray<QuickCaptureEntry>(QUICK_CAPTURE_INBOX_KEY);
  writeArray(QUICK_CAPTURE_INBOX_KEY, [entry, ...inbox]);
};

const appendMemo = (entry: QuickCaptureEntry) => {
  const now = Date.now();
  const notes = readArray<MemoNoteRecord>(MEMO_NOTES_KEY);
  const note: MemoNoteRecord = {
    id: entry.id,
    title: toMemoTitle(entry.text),
    html: `<p>${escapeHtml(entry.text).replace(/\r?\n/g, "<br>")}</p>`,
    fontFamily: getSavedDefaultMemoFont(),
    fontSize: "15px",
    color: "plum-night",
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };

  writeArray(MEMO_NOTES_KEY, [note, ...notes]);
};

const appendTodayTask = (entry: QuickCaptureEntry) => {
  const tasks = readArray<TodayFocusTaskRecord>(TODAY_FOCUS_TASKS_KEY);
  writeArray(TODAY_FOCUS_TASKS_KEY, [
    {
      id: entry.id,
      text: entry.text,
      done: false,
    },
    ...tasks,
  ]);
};

export const inferQuickCaptureKind = (text: string): QuickCaptureKind => {
  const trimmed = text.trim();

  if (/^https?:\/\//i.test(trimmed)) return "url";
  if (/(원|₩|\$)\s?\d|^\d{2,}([,.]\d{3})*\s?원?$/.test(trimmed)) {
    return "expense";
  }

  return "inbox";
};

export const captureQuickEntry = ({
  kind,
  text,
}: {
  kind: QuickCaptureKind;
  text: string;
}): QuickCaptureResult | null => {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const entry: QuickCaptureEntry = {
    id: createId("capture"),
    kind,
    text: trimmed,
    createdAt: new Date().toISOString(),
    source: "quick-capture",
  };

  if (kind === "memo") {
    appendMemo(entry);
    return { entry, routedTo: "memo" };
  }

  if (kind === "task") {
    appendTodayTask(entry);
    return { entry, routedTo: "today-task" };
  }

  appendInboxEntry(entry);
  return { entry, routedTo: "inbox" };
};
