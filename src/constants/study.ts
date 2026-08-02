import type {
  StudyPlannerSubject,
  StudyPlannerSubjectId,
} from "../types/study";

export const STUDY_PLANNER_STORAGE_KEY = "glassday.study.planner.v2";
export const STUDY_LEGACY_SUBJECTS_KEY = "glassday.study.subjects.v1";
export const STUDY_LEGACY_RECORDS_KEY = "glassday.study.records.v1";
export const STUDY_LEGACY_TASKS_KEY = "glassday.study.tasks.v1";

export const STUDY_START_HOUR = 6;
export const STUDY_END_HOUR = 24;
export const STUDY_SLOT_MINUTES = 10;
export const STUDY_SLOTS_PER_HOUR = 60 / STUDY_SLOT_MINUTES;
export const STUDY_TOTAL_SLOTS =
  (STUDY_END_HOUR - STUDY_START_HOUR) * STUDY_SLOTS_PER_HOUR;

/* Subject palette
   Muted mid-tone colors remain distinguishable in light and dark glass without
   the washed-out white cast of the previous palette. / 과목 수정은 이 배열만 편집합니다. */
export const STUDY_PLANNER_SUBJECTS: readonly StudyPlannerSubject[] = [
  { id: "economics", label: "경제학", shortLabel: "경제", color: "#6F9FC9" },
  { id: "ncs", label: "NCS", shortLabel: "NCS", color: "#8B7DB8" },
  { id: "accounting", label: "회계", shortLabel: "회계", color: "#C77D8F" },
  { id: "actuarial", label: "보험수학", shortLabel: "보험", color: "#5CA694" },
  { id: "english", label: "영어", shortLabel: "영어", color: "#CB955A" },
  { id: "other", label: "기타", shortLabel: "기타", color: "#858FA2" },
];

export const STUDY_PLANNER_SUBJECT_IDS = new Set<StudyPlannerSubjectId>(
  STUDY_PLANNER_SUBJECTS.map((subject) => subject.id)
);
