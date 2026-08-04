/**
 * ============================================================
 * [Journal Utilities] Date Records + Progress + Hashtag Clips
 * ============================================================
 * Consumer: src/components/widgets/DailyJournalWidget.tsx
 * Types: src/types/journal.ts
 * Persistence: glassday.journal.entries.v1을 직접 load/save한다.
 * 역할: 날짜별 entry 기본값, task/clip 생성, progress 계산, hashtag parsing과 migration을 담당한다.
 * 반환값은 Journal Summary, Task Row, Clip Library의 view state를 결정한다.
 * ============================================================
 */
import type {
  JournalClip,
  JournalEntry,
  JournalHashtagGroup,
  JournalMood,
  JournalTask,
} from "../../../types/journal";

export const JOURNAL_STORAGE_KEY = "glassday.journal.entries.v1";

export const journalMoodLabels: Record<JournalMood, string> = {
  great: "Great",
  good: "Good",
  normal: "Normal",
  tired: "Tired",
  stressed: "Stressed",
  low: "Low",
};

export const journalMoodOptions: JournalMood[] = [
  "great",
  "good",
  "normal",
  "tired",
  "stressed",
  "low",
];

const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

export const toDateString = (date: Date) => {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
};

export const todayString = () => toDateString(new Date());

export const addDaysToDateString = (dateString: string, amount: number) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const base = new Date(year, (month ?? 1) - 1, day ?? 1);

  base.setDate(base.getDate() + amount);

  return toDateString(base);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const asString = (value: unknown, fallback = "") => {
  return typeof value === "string" ? value : fallback;
};

const asBoolean = (value: unknown, fallback = false) => {
  return typeof value === "boolean" ? value : fallback;
};

const asNumber = (value: unknown, fallback = 0) => {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const clampScore = (value: unknown, fallback = 3) => {
  const numberValue = asNumber(value, fallback);

  return Math.max(1, Math.min(5, Math.round(numberValue)));
};

const asMood = (value: unknown): JournalMood => {
  if (
    typeof value === "string" &&
    journalMoodOptions.includes(value as JournalMood)
  ) {
    return value as JournalMood;
  }

  return "normal";
};

export const normalizeHashtag = (tag: string) => {
  const trimmed = tag.trim();

  if (!trimmed) return "#기록";

  const withoutHash = trimmed.replace(/^#+/, "");

  return `#${withoutHash.replace(/\s+/g, "")}`;
};

export const extractHashtags = (text: string) => {
  const matches = text.match(/#[가-힣a-zA-Z0-9_]+/g) ?? [];

  return Array.from(
    new Set(matches.map((tag: string) => normalizeHashtag(tag)))
  );
};

export const applyHashtagToText = (text: string, tag: string) => {
  const normalizedTag = normalizeHashtag(tag);

  if (!text.trim()) return normalizedTag;
  if (text.includes(normalizedTag)) return text;

  return `${normalizedTag} ${text}`;
};

export const createJournalTask = (text = ""): JournalTask => ({
  id: createId("journal-task"),
  text,
  done: false,
});

export const createJournalClip = ({
  tag,
  text,
  source,
  date,
}: {
  tag: string;
  text: string;
  source: string;
  date: string;
}): JournalClip => ({
  id: createId("journal-clip"),
  tag: normalizeHashtag(tag),
  text,
  source,
  date,
  createdAt: new Date().toISOString(),
});

export const createDefaultJournalEntry = (
  date = todayString()
): JournalEntry => ({
  id: `journal-${date}`,
  date,

  todayTasks: [
    createJournalTask("오늘 가장 중요한 일 1개 끝내기"),
  ],
  tomorrowTasks: [
    createJournalTask("내일 첫 번째로 할 일 정하기"),
  ],

  workLog: "",
  learned: "",
  careerMaterial: "",
  memo: "",

  condition: "normal",

  energy: 3,
  focus: 3,
  sleepy: 3,
  stress: 2,

  reflection: "",
  clips: [],
});

const normalizeTask = (value: unknown): JournalTask => {
  if (!isRecord(value)) {
    return createJournalTask();
  }

  return {
    id: asString(value.id, createId("journal-task")),
    text: asString(value.text),
    done: asBoolean(value.done),
  };
};

const normalizeClip = (value: unknown, fallbackDate: string): JournalClip => {
  if (!isRecord(value)) {
    return createJournalClip({
      tag: "#기록",
      text: "",
      source: "journal",
      date: fallbackDate,
    });
  }

  return {
    id: asString(value.id, createId("journal-clip")),
    tag: normalizeHashtag(asString(value.tag, "#기록")),
    text: asString(value.text),
    source: asString(value.source, "journal"),
    date: asString(value.date, fallbackDate),
    createdAt: asString(value.createdAt, new Date().toISOString()),
  };
};

export const normalizeJournalEntry = (
  value: unknown,
  fallbackDate = todayString()
): JournalEntry => {
  if (!isRecord(value)) {
    return createDefaultJournalEntry(fallbackDate);
  }

  const date = asString(value.date, fallbackDate);

  const todayTasks = Array.isArray(value.todayTasks)
    ? value.todayTasks.map((task: unknown) => normalizeTask(task))
    : [];

  const tomorrowTasks = Array.isArray(value.tomorrowTasks)
    ? value.tomorrowTasks.map((task: unknown) => normalizeTask(task))
    : [];

  const clips = Array.isArray(value.clips)
    ? value.clips.map((clip: unknown) => normalizeClip(clip, date))
    : [];

  return {
    id: asString(value.id, `journal-${date}`),
    date,

    todayTasks,
    tomorrowTasks,

    workLog: asString(value.workLog),
    learned: asString(value.learned),
    careerMaterial: asString(value.careerMaterial),
    memo: asString(value.memo),

    condition: asMood(value.condition),

    energy: clampScore(value.energy, 3),
    focus: clampScore(value.focus, 3),
    sleepy: clampScore(value.sleepy, 3),
    stress: clampScore(value.stress, 2),

    reflection: asString(value.reflection),
    clips,
  };
};

export const loadJournalEntries = (): JournalEntry[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(JOURNAL_STORAGE_KEY);

    if (!raw) {
      return [createDefaultJournalEntry()];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [createDefaultJournalEntry()];
    }

    return parsed.map((entry: unknown) => normalizeJournalEntry(entry));
  } catch {
    return [createDefaultJournalEntry()];
  }
};

export const saveJournalEntries = (entries: JournalEntry[]) => {
  if (typeof window === "undefined") return;

  const normalizedEntries = entries.map((entry: JournalEntry) =>
    normalizeJournalEntry(entry)
  );

  window.localStorage.setItem(
    JOURNAL_STORAGE_KEY,
    JSON.stringify(normalizedEntries)
  );

  window.dispatchEvent(
    new CustomEvent("glassday:journal-updated", {
      detail: {
        entries: normalizedEntries,
      },
    })
  );
};

export const clearJournalStorage = () => {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(JOURNAL_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("glassday:journal-cleared"));
};

export const getJournalEntryByDate = (
  entries: JournalEntry[],
  date: string
) => {
  return entries.find((entry: JournalEntry) => entry.date === date) ?? null;
};

export const getOrCreateJournalEntry = (
  entries: JournalEntry[],
  date: string
) => {
  return getJournalEntryByDate(entries, date) ?? createDefaultJournalEntry(date);
};

export const upsertJournalEntry = (
  entries: JournalEntry[],
  nextEntry: JournalEntry
): JournalEntry[] => {
  const normalizedEntry = normalizeJournalEntry(nextEntry);
  const exists = entries.some(
    (entry: JournalEntry) => entry.date === normalizedEntry.date
  );

  if (!exists) {
    return [...entries, normalizedEntry].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }

  return entries
    .map((entry: JournalEntry) =>
      entry.date === normalizedEntry.date ? normalizedEntry : entry
    )
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const updateJournalEntry = (
  entries: JournalEntry[],
  date: string,
  patch: Partial<JournalEntry>
): JournalEntry[] => {
  const current = getOrCreateJournalEntry(entries, date);

  return upsertJournalEntry(entries, {
    ...current,
    ...patch,
    date,
  });
};

export const getJournalProgress = (entry: JournalEntry) => {
  const fields = [
    entry.workLog.trim(),
    entry.learned.trim(),
    entry.careerMaterial.trim(),
    entry.memo.trim(),
    entry.reflection.trim(),
  ];

  const filledTextFields = fields.filter((field: string) => field.length > 0)
    .length;

  const todayTaskCount = entry.todayTasks.length;
  const doneTodayTaskCount = entry.todayTasks.filter(
    (task: JournalTask) => task.done
  ).length;

  const taskProgress =
    todayTaskCount === 0 ? 0 : doneTodayTaskCount / todayTaskCount;

  const textProgress = fields.length === 0 ? 0 : filledTextFields / fields.length;

  return Math.round((taskProgress * 0.4 + textProgress * 0.6) * 100);
};

export const getDoneTodayTaskCount = (entry: JournalEntry) => {
  return entry.todayTasks.filter((task: JournalTask) => task.done).length;
};

export const getTodayTaskCount = (entry: JournalEntry) => {
  return entry.todayTasks.length;
};

export const createClipFromSelection = ({
  entry,
  tag,
  text,
  source,
}: {
  entry: JournalEntry;
  tag: string;
  text: string;
  source: string;
}): JournalEntry => {
  const normalizedText = text.trim();

  if (!normalizedText) return entry;

  const clip = createJournalClip({
    tag,
    text: normalizedText,
    source,
    date: entry.date,
  });

  return {
    ...entry,
    clips: [clip, ...entry.clips],
  };
};

export const collectJournalClips = (entries: JournalEntry[]) => {
  return entries.flatMap((entry: JournalEntry) =>
    entry.clips.map((clip: JournalClip) => ({
      ...clip,
      date: clip.date || entry.date,
    }))
  );
};

export const collectHashtagLibrary = (
  entries: JournalEntry[]
): JournalHashtagGroup[] => {
  const allClips = collectJournalClips(entries);
  const library = new Map<string, JournalClip[]>();

  allClips.forEach((clip: JournalClip) => {
    const tag = normalizeHashtag(clip.tag);
    const current = library.get(tag) ?? [];

    library.set(tag, [...current, clip]);
  });

  return Array.from(library.entries())
    .map(([tag, clips]) => ({
      tag,
      clips,
      count: clips.length,
    }))
    .sort((a, b) => b.count - a.count);
};

export const getEntryHashtags = (entry: JournalEntry) => {
  const textBlocks = [
    entry.workLog,
    entry.learned,
    entry.careerMaterial,
    entry.memo,
    entry.reflection,
    ...entry.todayTasks.map((task: JournalTask) => task.text),
    ...entry.tomorrowTasks.map((task: JournalTask) => task.text),
    ...entry.clips.map((clip: JournalClip) => `${clip.tag} ${clip.text}`),
  ];

  return Array.from(
    new Set(textBlocks.flatMap((text: string) => extractHashtags(text)))
  );
};

export const getJournalSummary = (entries: JournalEntry[]) => {
  const today = todayString();
  const todayEntry = getOrCreateJournalEntry(entries, today);
  const progress = getJournalProgress(todayEntry);

  const totalClips = entries.reduce((sum: number, entry: JournalEntry) => {
    return sum + entry.clips.length;
  }, 0);

  const unfinishedTodayTasks = todayEntry.todayTasks.filter(
    (task: JournalTask) => !task.done
  ).length;

  return {
    today,
    todayEntry,
    progress,
    totalEntries: entries.length,
    totalClips,
    unfinishedTodayTasks,
  };
};

/* 기존 import 이름 대응용 aliases */
export const loadJournal = loadJournalEntries;
export const saveJournal = saveJournalEntries;
export const createEmptyJournalEntry = createDefaultJournalEntry;
export const getOrCreateEntry = getOrCreateJournalEntry;
export const calculateJournalProgress = getJournalProgress;
export const getHashtagsFromText = extractHashtags;
export const getHashtagLibrary = collectHashtagLibrary;
