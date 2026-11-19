import type { CareerItem, CareerStage } from "../../../types/dashboard";

export type CareerCardSchedule = {
  label: string;
  date: string;
  dday: number;
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/* External posting URL normalization / 채용 공고 외부 링크 정규화
   CareerWidget.tsx의 카드와 상세 창이 같은 규칙을 사용하도록 이 파일에서
   protocol 누락을 보완하고 http(s) 주소만 허용합니다. */
export const normalizeCareerPostingUrl = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) return null;

  try {
    const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(candidate);

    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    return url.toString();
  } catch {
    return null;
  }
};

const toUtcDay = (value: string) => {
  if (!DATE_ONLY_PATTERN.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return timestamp;
};

export const getCareerDateDiff = (date: string, today: string) => {
  const targetDay = toUtcDay(date);
  const currentDay = toUtcDay(today);

  if (targetDay === null || currentDay === null) return null;

  return Math.round((targetDay - currentDay) / 86_400_000);
};

const getStageDeadline = (stage: CareerStage) => {
  /* A range remains actionable until its end date.
     기간 일정은 시작일이 지난 뒤에도 종료일까지 D-day가 보여야 합니다. */
  if (stage.dateMode === "range") {
    return stage.endDate || stage.date || "";
  }

  return stage.date || "";
};

const getStageDeadlineLabel = (stage: CareerStage) => {
  const baseLabel = stage.label.trim() || "전형 일정";

  if (stage.dateMode !== "range" || /마감|종료/.test(baseLabel)) {
    return baseLabel;
  }

  return `${baseLabel} 마감`;
};

/* Career card schedule projection / 카드용 다음 일정 계산
   Source connection: CareerWidget.tsx의 전형 일정 editor가 저장한 stages를 읽고,
   이전 버전의 applicationEndDate/deadline은 migration fallback으로만 사용합니다. */
export const getCareerCardSchedules = (
  item: CareerItem,
  today: string
): CareerCardSchedule[] => {
  const stageSchedules = (item.stages ?? [])
    .filter((stage) => stage.status !== "skipped")
    .flatMap((stage) => {
      const date = getStageDeadline(stage);
      const dday = getCareerDateDiff(date, today);

      if (dday === null || dday < 0) return [];

      return [
        {
          label: getStageDeadlineLabel(stage),
          date,
          dday,
        },
      ];
    });

  const legacyDeadline =
    item.applicationEndDate || item.deadline || item.applicationStartDate;
  const hasMatchingStage = stageSchedules.some(
    (schedule) => schedule.date === legacyDeadline
  );
  const legacyDday = getCareerDateDiff(legacyDeadline, today);

  if (
    legacyDeadline &&
    !hasMatchingStage &&
    legacyDday !== null &&
    legacyDday >= 0
  ) {
    stageSchedules.push({
      label: "서류 제출 마감",
      date: legacyDeadline,
      dday: legacyDday,
    });
  }

  return stageSchedules.sort(
    (a, b) => a.dday - b.dday || a.label.localeCompare(b.label, "ko")
  );
};

export const getNextCareerCardSchedule = (
  item: CareerItem,
  today: string
) => getCareerCardSchedules(item, today)[0] ?? null;
