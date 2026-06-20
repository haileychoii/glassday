import type {
  JournalEntries,
  JournalEntry,
  JournalFieldKey,
  JournalMood,
  JournalTagClip,
  JournalTask,
} from "../../../types/journal";

export const toLocalDateInput = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const addDays = (value: string, amount: number) => {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + amount);

  return toLocalDateInput(date);
};

export const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createJournalTask = (text = ""): JournalTask => ({
  id: createId("journal-task"),
  text,
  done: false,
});

export const createJournalEntry = (date: string): JournalEntry => {
  const now = Date.now();

  return {
    date,
    todayTodos: [
      createJournalTask("오늘 가장 중요한 일 1개 끝내기"),
      createJournalTask("회사/공부 기록 남기기"),
    ],
    tomorrowTodos: [createJournalTask("내일 첫 번째로 할 일 정하기")],
    workDone: "",
    learned: "",
    careerNote: "",
    mood: "neutral",
    energy: 3,
    focus: 3,
    sleepiness: 3,
    stress: 2,
    oneLineReview: "",
    tagClips: [],
    createdAt: now,
    updatedAt: now,
  };
};

export const normalizeJournalEntry = (
  entry: JournalEntry | undefined,
  date: string
): JournalEntry => {
  const fallback = createJournalEntry(date);

  if (!entry) return fallback;

  return {
    ...fallback,
    ...entry,
    todayTodos: entry.todayTodos ?? fallback.todayTodos,
    tomorrowTodos: entry.tomorrowTodos ?? fallback.tomorrowTodos,
    tagClips: entry.tagClips ?? [],
  };
};

export const moodLabels: Record<JournalMood, string> = {
  great: "완전 좋음",
  good: "괜찮음",
  neutral: "보통",
  tired: "피곤함",
  stressed: "스트레스",
  low: "저조함",
};

export const moodEmojis: Record<JournalMood, string> = {
  great: "✨",
  good: "🌷",
  neutral: "🌙",
  tired: "🥱",
  stressed: "🌧️",
  low: "🫧",
};

export const getJournalCompletion = (entry: JournalEntry) => {
  const checks = [
    entry.todayTodos.some((task) => task.done),
    entry.workDone.trim().length > 0,
    entry.learned.trim().length > 0,
    entry.tomorrowTodos.some((task) => task.text.trim().length > 0),
    entry.oneLineReview.trim().length > 0,
  ];

  const completed = checks.filter(Boolean).length;

  return Math.round((completed / checks.length) * 100);
};

export const getDoneTaskCount = (tasks: JournalTask[]) => {
  return tasks.filter((task) => task.done).length;
};

export const normalizeTag = (tag: string) => {
  return tag
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, "")
    .replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ-]/g, "");
};

export const extractTagsFromText = (text: string) => {
  const matches = text.match(/#[\w가-힣ㄱ-ㅎㅏ-ㅣ-]+/g) ?? [];

  return [...new Set(matches.map((tag) => normalizeTag(tag)).filter(Boolean))];
};

export const getFieldLabel = (field: JournalFieldKey) => {
  const labels: Record<JournalFieldKey, string> = {
    workDone: "회사에서 한 일",
    learned: "오늘 배운 것",
    careerNote: "자소서/커리어 소재",
    oneLineReview: "한 줄 회고",
  };

  return labels[field];
};

export const createTagClip = ({
  tag,
  text,
  field,
  date,
}: {
  tag: string;
  text: string;
  field: JournalFieldKey;
  date: string;
}): JournalTagClip => {
  return {
    id: createId("journal-tag-clip"),
    tag: normalizeTag(tag),
    text: text.trim(),
    field,
    date,
    createdAt: Date.now(),
  };
};

export type JournalInlineTagItem = {
  id: string;
  tag: string;
  text: string;
  field: JournalFieldKey;
  date: string;
  source: "inline";
};

export type JournalTagLibraryItem =
  | (JournalTagClip & { source: "clip" })
  | JournalInlineTagItem;

const getLinePreviewForTag = (text: string, tag: string) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const matchedLine =
    lines.find((line) => line.includes(`#${tag}`)) ||
    lines.find((line) => extractTagsFromText(line).includes(tag));

  return matchedLine || text.slice(0, 120);
};

export const collectJournalTags = (entries: JournalEntries) => {
  const tags = new Set<string>();

  Object.values(entries).forEach((entry) => {
    const normalized = normalizeJournalEntry(entry, entry.date);

    normalized.tagClips.forEach((clip) => {
      if (clip.tag) tags.add(clip.tag);
    });

    (["workDone", "learned", "careerNote", "oneLineReview"] as JournalFieldKey[]).forEach(
      (field) => {
        extractTagsFromText(String(normalized[field] ?? "")).forEach((tag) =>
          tags.add(tag)
        );
      }
    );
  });

  return [...tags].sort((a, b) => a.localeCompare(b));
};

export const collectJournalTagItems = (
  entries: JournalEntries,
  selectedTag?: string
): JournalTagLibraryItem[] => {
  const items: JournalTagLibraryItem[] = [];

  Object.values(entries).forEach((entry) => {
    const normalized = normalizeJournalEntry(entry, entry.date);

    normalized.tagClips.forEach((clip) => {
      if (!selectedTag || clip.tag === selectedTag) {
        items.push({
          ...clip,
          source: "clip",
        });
      }
    });

    (["workDone", "learned", "careerNote", "oneLineReview"] as JournalFieldKey[]).forEach(
      (field) => {
        const value = String(normalized[field] ?? "");
        const tags = extractTagsFromText(value);

        tags.forEach((tag) => {
          if (selectedTag && tag !== selectedTag) return;

          items.push({
            id: `inline-${normalized.date}-${field}-${tag}`,
            tag,
            text: getLinePreviewForTag(value, tag),
            field,
            date: normalized.date,
            createdAt: normalized.updatedAt,
            source: "inline",
          });
        });
      }
    );
  });

  return items.sort((a, b) => b.date.localeCompare(a.date));
};