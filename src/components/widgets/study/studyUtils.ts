/**
 * ============================================================
 * [Study Utilities] Planner Normalization + Timeline Calculations
 * ============================================================
 * Consumers: StudyWidget, AlertCenterWidget, TimerWidget/usePomodoroTimer
 * 역할: v1 데이터 migration, 날짜별 v2 record 생성, 10분 slot/time 합계,
 * timer 구간 계산과 표시 문자열을 담당한다.
 * UI를 렌더링하지 않지만 Timeline Cell 수와 progress/summary 값의 Source다.
 * ============================================================
 */
import {
  STUDY_END_HOUR,
  STUDY_LEGACY_RECORDS_KEY,
  STUDY_LEGACY_SUBJECTS_KEY,
  STUDY_LEGACY_TASKS_KEY,
  STUDY_PLANNER_STORAGE_KEY,
  STUDY_PLANNER_SUBJECT_IDS,
  STUDY_PLANNER_SUBJECTS,
  STUDY_SLOT_MINUTES,
  STUDY_START_HOUR,
  STUDY_TOTAL_SLOTS,
} from "../../../constants/study";
import type {
  StudyActiveTimer,
  StudyDayData,
  StudyLegacyRecordSummary,
  StudyPlannerStorage,
  StudyPlannerSubject,
  StudyPlannerSubjectColors,
  StudyPlannerSubjectId,
  StudyPlannerSubjectSettings,
  StudyPlannerTask,
  StudyPomodoroMode,
  StudyPomodoroState,
  StudyRecord,
  StudySubject,
  StudySubjectId,
  StudyTask,
} from "../../../types/study";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const CUSTOM_SUBJECT_ID_PATTERN = /^custom-[a-z0-9-]{4,}$/i;

const isRecordValue = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isPlannerSubjectId = (
  value: unknown
): value is StudyPlannerSubjectId =>
  typeof value === "string" &&
  (STUDY_PLANNER_SUBJECT_IDS.has(value as StudyPlannerSubjectId) ||
    CUSTOM_SUBJECT_ID_PATTERN.test(value));

const safeNumber = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const readStorageArray = <T,>(key: string): T[] => {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

export const toLocalDateInput = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const parseDate = (value: string) => new Date(`${value}T00:00:00`);

export const addDays = (value: string, amount: number) => {
  const date = parseDate(value);
  date.setDate(date.getDate() + amount);
  return toLocalDateInput(date);
};

export const formatStudyDate = (value: string) => {
  const date = parseDate(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
};

export const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const formatStudyMinutes = (minutes: number) => {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;

  if (hours === 0) return `${rest}분`;
  if (rest === 0) return `${hours}시간`;
  return `${hours}시간 ${rest}분`;
};

export const formatClockMinutes = (totalMinutes: number) => {
  const hour = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

export const formatElapsedTimer = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;

  return [hours, minutes, rest]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
};

export const createEmptyStudyDay = (): StudyDayData => ({
  blocks: {},
  tasks: [],
  note: "",
  goalMinutes: 180,
  legacyRecords: [],
  updatedAt: Date.now(),
});

export const createEmptyStudyPlannerStorage = (): StudyPlannerStorage => ({
  version: 2,
  days: {},
  activeTimer: null,
  subjectColors: {},
  subjectSettings: {},
  customSubjects: [],
});

/* Subject color migration
   Older v2 records have no subjectColors field. Returning an empty map keeps
   every existing day/timer intact and lets the UI fall back to new defaults.
   / 잘못된 문자열은 저장하지 않아 native color input을 항상 안전하게 유지합니다. */
const normalizeSubjectColors = (value: unknown): StudyPlannerSubjectColors => {
  if (!isRecordValue(value)) return {};

  const colors: StudyPlannerSubjectColors = {};
  Object.entries(value).forEach(([subjectId, color]) => {
    if (
      isPlannerSubjectId(subjectId) &&
      typeof color === "string" &&
      HEX_COLOR_PATTERN.test(color)
    ) {
      colors[subjectId] = color.toUpperCase();
    }
  });

  return colors;
};

/* Subject catalog migration
   Defaults stay in constants, while only user-created entries are persisted.
   / 이름을 바꿔도 id가 유지되므로 기존 시간표 block과 task가 끊기지 않는다. */
const normalizeCustomSubjects = (value: unknown): StudyPlannerSubject[] => {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value.flatMap((entry) => {
    if (
      !isRecordValue(entry) ||
      !isPlannerSubjectId(entry.id) ||
      !CUSTOM_SUBJECT_ID_PATTERN.test(entry.id) ||
      seen.has(entry.id)
    ) {
      return [];
    }

    const label =
      typeof entry.label === "string" && entry.label.trim()
        ? entry.label.trim().slice(0, 24)
        : "새 과목";
    const color =
      typeof entry.color === "string" && HEX_COLOR_PATTERN.test(entry.color)
        ? entry.color.toUpperCase()
        : "#E2CFC4";

    seen.add(entry.id);
    return [{ id: entry.id, label, shortLabel: label, color }];
  });
};

const normalizeSubjectSettings = (
  value: unknown,
  legacyColors: StudyPlannerSubjectColors
): StudyPlannerSubjectSettings => {
  const settings: StudyPlannerSubjectSettings = {};

  if (isRecordValue(value)) {
    Object.entries(value).forEach(([subjectId, entry]) => {
      if (!isPlannerSubjectId(subjectId) || !isRecordValue(entry)) return;

      const label =
        typeof entry.label === "string" && entry.label.trim()
          ? entry.label.trim().slice(0, 24)
          : undefined;
      const color =
        typeof entry.color === "string" && HEX_COLOR_PATTERN.test(entry.color)
          ? entry.color.toUpperCase()
          : undefined;
      const note =
        typeof entry.note === "string" ? entry.note.slice(0, 2000) : undefined;

      settings[subjectId] = { label, color, note };
    });
  }

  /* v2 color-only records are promoted without deleting the compatibility map. */
  Object.entries(legacyColors).forEach(([subjectId, color]) => {
    if (!isPlannerSubjectId(subjectId) || !color) return;
    settings[subjectId] = { ...settings[subjectId], color };
  });

  return settings;
};

const normalizePlannerTask = (value: unknown): StudyPlannerTask | null => {
  if (!isRecordValue(value) || !isPlannerSubjectId(value.subjectId)) return null;

  return {
    id: typeof value.id === "string" ? value.id : createId("study-task"),
    subjectId: value.subjectId,
    text: typeof value.text === "string" ? value.text : "Study task",
    estimatedMinutes: Math.max(10, safeNumber(value.estimatedMinutes, 30)),
    done: Boolean(value.done),
    createdAt: safeNumber(value.createdAt, Date.now()),
  };
};

const normalizeLegacyRecord = (
  value: unknown
): StudyLegacyRecordSummary | null => {
  if (!isRecordValue(value) || !isPlannerSubjectId(value.subjectId)) return null;

  return {
    id: typeof value.id === "string" ? value.id : createId("legacy-study"),
    subjectId: value.subjectId,
    minutes: Math.max(0, safeNumber(value.minutes)),
    problems: Math.max(0, safeNumber(value.problems)),
    note: typeof value.note === "string" ? value.note : "",
  };
};

export const normalizeStudyDay = (value: unknown): StudyDayData => {
  const fallback = createEmptyStudyDay();
  if (!isRecordValue(value)) return fallback;

  const blocks: Record<string, StudyPlannerSubjectId> = {};
  if (isRecordValue(value.blocks)) {
    Object.entries(value.blocks).forEach(([slotKey, subjectId]) => {
      const slot = Number(slotKey);
      if (
        Number.isInteger(slot) &&
        slot >= 0 &&
        slot < STUDY_TOTAL_SLOTS &&
        isPlannerSubjectId(subjectId)
      ) {
        blocks[String(slot)] = subjectId;
      }
    });
  }

  const tasks = Array.isArray(value.tasks)
    ? value.tasks.flatMap((task) => {
        const normalized = normalizePlannerTask(task);
        return normalized ? [normalized] : [];
      })
    : [];

  const legacyRecords = Array.isArray(value.legacyRecords)
    ? value.legacyRecords.flatMap((record) => {
        const normalized = normalizeLegacyRecord(record);
        return normalized ? [normalized] : [];
      })
    : [];

  return {
    blocks,
    tasks,
    note: typeof value.note === "string" ? value.note : "",
    goalMinutes: Math.max(10, safeNumber(value.goalMinutes, 180)),
    legacyRecords,
    updatedAt: safeNumber(value.updatedAt, Date.now()),
  };
};

const normalizeActiveTimer = (value: unknown): StudyActiveTimer | null => {
  if (
    !isRecordValue(value) ||
    typeof value.date !== "string" ||
    !DATE_KEY_PATTERN.test(value.date) ||
    !isPlannerSubjectId(value.subjectId) ||
    typeof value.startedAt !== "number" ||
    !Number.isFinite(value.startedAt)
  ) {
    return null;
  }

  return {
    date: value.date,
    subjectId: value.subjectId,
    startedAt: value.startedAt,
  };
};

export const normalizeStudyPlannerStorage = (
  value: unknown
): StudyPlannerStorage => {
  if (!isRecordValue(value)) return createEmptyStudyPlannerStorage();

  const days: Record<string, StudyDayData> = {};
  if (isRecordValue(value.days)) {
    Object.entries(value.days).forEach(([date, day]) => {
      if (DATE_KEY_PATTERN.test(date)) {
        days[date] = normalizeStudyDay(day);
      }
    });
  }

  const subjectColors = normalizeSubjectColors(value.subjectColors);

  return {
    version: 2,
    days,
    activeTimer: normalizeActiveTimer(value.activeTimer),
    subjectColors,
    subjectSettings: normalizeSubjectSettings(
      value.subjectSettings,
      subjectColors
    ),
    customSubjects: normalizeCustomSubjects(value.customSubjects),
  };
};

const LEGACY_SUBJECT_MAP: Record<StudySubjectId, StudyPlannerSubjectId> = {
  economics: "economics",
  ncs: "ncs",
  accounting: "accounting",
  actuarial: "actuarial",
  english: "english",
  other: "other",
  "soa-fm": "actuarial",
  essay: "other",
  custom: "other",
};

const mapLegacySubject = (subjectId: StudySubjectId) =>
  LEGACY_SUBJECT_MAP[subjectId] ?? "other";

/* v1 -> v2 migration
   Manual records did not contain clock positions, so their minutes remain as
   legacy totals instead of fabricating timeline blocks. Original v1 keys are
   never removed. / 기존 기록의 가짜 시간대를 만들지 않고 합계로 보존합니다. */
export const migrateLegacyStudyStorage = (): StudyPlannerStorage => {
  const subjects = readStorageArray<StudySubject>(STUDY_LEGACY_SUBJECTS_KEY);
  const records = readStorageArray<StudyRecord>(STUDY_LEGACY_RECORDS_KEY);
  const tasks = readStorageArray<StudyTask>(STUDY_LEGACY_TASKS_KEY);
  const storage = createEmptyStudyPlannerStorage();
  const migratedGoal = Math.max(
    10,
    subjects.reduce(
      (sum, subject) => sum + Math.max(0, subject.dailyGoalMinutes || 0),
      0
    ) || 180
  );

  const getDay = (date: string) => {
    const existing = storage.days[date];
    if (existing) return existing;

    const created = {
      ...createEmptyStudyDay(),
      goalMinutes: migratedGoal,
    };
    storage.days[date] = created;
    return created;
  };

  records.forEach((record) => {
    if (!DATE_KEY_PATTERN.test(record.date)) return;
    const day = getDay(record.date);
    day.legacyRecords = [
      ...(day.legacyRecords ?? []),
      {
        id: record.id || createId("legacy-study"),
        subjectId: mapLegacySubject(record.subjectId),
        minutes: Math.max(0, record.minutes || 0),
        problems: Math.max(0, record.problems || 0),
        note: record.note || "",
      },
    ];
  });

  tasks.forEach((task) => {
    if (!DATE_KEY_PATTERN.test(task.date)) return;
    const day = getDay(task.date);
    day.tasks.push({
      id: task.id || createId("study-task"),
      subjectId: mapLegacySubject(task.subjectId),
      text: task.text || "Study task",
      estimatedMinutes: Math.max(10, task.estimatedMinutes || 30),
      done: Boolean(task.done),
      createdAt: task.createdAt || Date.now(),
    });
  });

  return storage;
};

export const readStudyPlannerStorage = (): StudyPlannerStorage => {
  if (typeof window === "undefined") return createEmptyStudyPlannerStorage();

  try {
    const raw = window.localStorage.getItem(STUDY_PLANNER_STORAGE_KEY);
    return raw
      ? normalizeStudyPlannerStorage(JSON.parse(raw) as unknown)
      : createEmptyStudyPlannerStorage();
  } catch {
    return createEmptyStudyPlannerStorage();
  }
};

export const createInitialStudyPlannerStorage = (): StudyPlannerStorage => {
  if (typeof window === "undefined") return createEmptyStudyPlannerStorage();
  if (window.localStorage.getItem(STUDY_PLANNER_STORAGE_KEY)) {
    return readStudyPlannerStorage();
  }
  return migrateLegacyStudyStorage();
};

export const getStudyDay = (storage: StudyPlannerStorage, date: string) =>
  storage.days[date] ?? createEmptyStudyDay();

export const getLegacyStudyMinutes = (day: StudyDayData) =>
  (day.legacyRecords ?? []).reduce(
    (sum, record) => sum + Math.max(0, record.minutes),
    0
  );

export const getStudyPlannerTotalMinutes = (day: StudyDayData) =>
  Object.keys(day.blocks).length * STUDY_SLOT_MINUTES +
  getLegacyStudyMinutes(day);

export const getStudyPlannerSubjectTotals = (day: StudyDayData) => {
  const totals = Object.fromEntries(
    STUDY_PLANNER_SUBJECTS.map((subject) => [subject.id, 0])
  ) as Record<StudyPlannerSubjectId, number>;

  Object.values(day.blocks).forEach((subjectId) => {
    totals[subjectId] = (totals[subjectId] ?? 0) + STUDY_SLOT_MINUTES;
  });
  (day.legacyRecords ?? []).forEach((record) => {
    totals[record.subjectId] =
      (totals[record.subjectId] ?? 0) + Math.max(0, record.minutes);
  });

  return totals;
};

export const getTimerSlotIndexes = (
  timer: StudyActiveTimer,
  endedAt: number
) => {
  const start = new Date(timer.startedAt);
  const end = new Date(endedAt);
  if (
    toLocalDateInput(start) !== timer.date ||
    toLocalDateInput(end) !== timer.date
  ) {
    return [];
  }

  const visibleStart = STUDY_START_HOUR * 60;
  const visibleEnd = STUDY_END_HOUR * 60;
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const clippedStart = Math.max(startMinutes, visibleStart);
  const clippedEnd = Math.min(Math.max(endMinutes, startMinutes + 1), visibleEnd);

  if (clippedEnd <= visibleStart || clippedStart >= visibleEnd) return [];

  const firstSlot = Math.max(
    0,
    Math.floor((clippedStart - visibleStart) / STUDY_SLOT_MINUTES)
  );
  const lastExclusive = Math.min(
    STUDY_TOTAL_SLOTS,
    Math.max(
      firstSlot + 1,
      Math.ceil((clippedEnd - visibleStart) / STUDY_SLOT_MINUTES)
    )
  );

  return Array.from(
    { length: Math.max(0, lastExclusive - firstSlot) },
    (_, index) => firstSlot + index
  );
};

export const formatTimerClock = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const restSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`;
};

export const getPomodoroModeDurationSeconds = (
  state: StudyPomodoroState,
  mode: StudyPomodoroMode
) => {
  switch (mode) {
    case "short-break":
      return state.shortBreakMinutes * 60;
    case "long-break":
      return state.longBreakMinutes * 60;
    default:
      return state.focusMinutes * 60;
  }
};

export const getPomodoroModeLabel = (mode: StudyPomodoroMode) => {
  switch (mode) {
    case "short-break":
      return "Short Break";
    case "long-break":
      return "Long Break";
    default:
      return "Focus";
  }
};
