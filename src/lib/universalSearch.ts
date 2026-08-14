/**
 * ============================================================
 * [Search Adapter] Universal Dashboard Search
 * ============================================================
 *
 * Role:
 * - Reads text-based Glassday localStorage records and returns lightweight
 *   search results for the command palette.
 *
 * Connections:
 * - UI: src/components/command/CommandPalette.tsx
 * - Navigation: src/constants/widgetNavigation.ts
 * - Storage: Memo, Journal, Career, Today Focus, Quick Capture Inbox
 *
 * Design:
 * - Each widget keeps its own data model. This file only adapts those models
 *   for search, so adding a result source does not rewrite widget storage.
 * - Korean: 각 위젯 저장소를 강제로 통합하지 않고 검색용 reader만 얇게 둡니다.
 * ============================================================
 */

import type { WidgetId } from "../types/workspace";
import { QUICK_CAPTURE_INBOX_KEY, type QuickCaptureEntry } from "./quickCapture";

const MEMO_NOTES_KEY = "glassday.memo.notes.v2";
const JOURNAL_ENTRIES_KEY = "glassday.journal.entries.v1";
const CAREER_APPLICATIONS_KEY = "glassday.career.applications.v2";
const TODAY_FOCUS_TASKS_KEY = "glassday.todayFocus.tasks.v1";

export type UniversalSearchTarget =
  | { type: "widget"; widgetId: WidgetId; preferredTabId?: string }
  | { type: "memo"; noteId: string }
  | { type: "career"; careerId: string }
  | { type: "none" };

export type UniversalSearchResult = {
  id: string;
  kind: string;
  title: string;
  excerpt: string;
  createdAt?: string;
  target: UniversalSearchTarget;
};

type MemoNoteRecord = {
  id?: unknown;
  title?: unknown;
  html?: unknown;
  updatedAt?: unknown;
  createdAt?: unknown;
};

type JournalEntryRecord = {
  id?: unknown;
  date?: unknown;
  workLog?: unknown;
  learned?: unknown;
  careerMaterial?: unknown;
  memo?: unknown;
  reflection?: unknown;
};

type CareerRecord = {
  id?: unknown;
  company?: unknown;
  role?: unknown;
  notes?: unknown;
  jobDescription?: unknown;
  postingUrl?: unknown;
  updatedAt?: unknown;
  createdAt?: unknown;
};

type TodayTaskRecord = {
  id?: unknown;
  text?: unknown;
  done?: unknown;
};

const isBrowser = () => typeof window !== "undefined";

const asString = (value: unknown) => (typeof value === "string" ? value : "");

const asNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

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

const stripHtml = (html: string) => {
  if (!isBrowser()) return html;

  const element = document.createElement("div");
  element.innerHTML = html;
  return element.innerText.replace(/\s+/g, " ").trim();
};

const compact = (value: string) => value.replace(/\s+/g, " ").trim();

const excerpt = (value: string) => {
  const text = compact(value);
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
};

const matchesQuery = (query: string, ...values: string[]) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return false;

  return values.some((value) => value.toLowerCase().includes(needle));
};

const normalizeCreatedAt = (value: unknown) => {
  const numeric = asNumber(value);
  if (numeric > 0) return new Date(numeric).toISOString();

  const text = asString(value);
  return text || undefined;
};

export const collectUniversalSearchResults = (
  query: string
): UniversalSearchResult[] => {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return [];

  const results: UniversalSearchResult[] = [];

  readArray<MemoNoteRecord>(MEMO_NOTES_KEY).forEach((note) => {
    const id = asString(note.id);
    const title = asString(note.title) || "Untitled memo";
    const body = stripHtml(asString(note.html));

    if (!id || !matchesQuery(normalizedQuery, title, body)) return;

    results.push({
      id: `memo:${id}`,
      kind: "Memo",
      title,
      excerpt: excerpt(body),
      createdAt: normalizeCreatedAt(note.updatedAt ?? note.createdAt),
      target: { type: "memo", noteId: id },
    });
  });

  readArray<JournalEntryRecord>(JOURNAL_ENTRIES_KEY).forEach((entry) => {
    const date = asString(entry.date);
    const body = [
      asString(entry.workLog),
      asString(entry.learned),
      asString(entry.careerMaterial),
      asString(entry.memo),
      asString(entry.reflection),
    ].join(" ");

    if (!date || !matchesQuery(normalizedQuery, date, body)) return;

    results.push({
      id: `journal:${date}`,
      kind: "Journal",
      title: `Journal ${date}`,
      excerpt: excerpt(body),
      createdAt: date,
      target: { type: "widget", widgetId: "journal", preferredTabId: "life" },
    });
  });

  readArray<CareerRecord>(CAREER_APPLICATIONS_KEY).forEach((career) => {
    const id = asString(career.id);
    const company = asString(career.company) || "Career item";
    const role = asString(career.role);
    const body = [
      role,
      asString(career.notes),
      asString(career.jobDescription),
      asString(career.postingUrl),
    ].join(" ");

    if (!id || !matchesQuery(normalizedQuery, company, body)) return;

    results.push({
      id: `career:${id}`,
      kind: "Career",
      title: role ? `${company} - ${role}` : company,
      excerpt: excerpt(body),
      createdAt: normalizeCreatedAt(career.updatedAt ?? career.createdAt),
      target: { type: "career", careerId: id },
    });
  });

  readArray<TodayTaskRecord>(TODAY_FOCUS_TASKS_KEY).forEach((task) => {
    const id = asString(task.id);
    const text = asString(task.text);

    if (!id || !matchesQuery(normalizedQuery, text)) return;

    results.push({
      id: `task:${id}`,
      kind: "Task",
      title: text,
      excerpt: task.done === true ? "Completed Today Focus task" : "Today Focus task",
      target: { type: "widget", widgetId: "today", preferredTabId: "home" },
    });
  });

  readArray<QuickCaptureEntry>(QUICK_CAPTURE_INBOX_KEY).forEach((entry) => {
    if (!matchesQuery(normalizedQuery, entry.text, entry.kind)) return;

    results.push({
      id: `capture:${entry.id}`,
      kind: `Inbox / ${entry.kind}`,
      title: entry.text,
      excerpt: "Quick Capture Inbox",
      createdAt: entry.createdAt,
      target: { type: "none" },
    });
  });

  return results
    .sort((first, second) =>
      (second.createdAt ?? "").localeCompare(first.createdAt ?? "")
    )
    .slice(0, 8);
};
