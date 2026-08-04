/**
 * ============================================================
 * [Inactive Legacy Utilities] Unmounted Career Subcomponents
 * ============================================================
 * 같은 career/ 폴더의 prototype component용 helper이며 현재 CareerWidget.tsx는 import하지 않는다.
 * 현재 지원 데이터의 normalize/sync는 src/context/DashboardDataContext.tsx가 담당한다.
 * ============================================================
 */
import type {
  CareerAttachment,
  CareerAttachmentType,
  CareerItem,
  CareerPriority,
  CareerStage,
  CareerStageStatus,
  CareerStatus,
  CoverLetterItem,
  CoverLetterStatus,
  InterviewReview,
} from "./careerTypes";

export const CAREER_STORAGE_KEY = "glassday.career.items.v1";

export const createCareerId = (prefix: string) => {
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

export const addDays = (base: Date, days: number) => {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
};

export const todayString = () => toDateString(new Date());

export const careerStatusOptions: CareerStatus[] = [
  "Preparing",
  "Submitted",
  "Screening",
  "Interview",
  "Offer",
  "Completed",
  "Rejected",
];

export const priorityLabels: Record<CareerPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const stageStatusLabels: Record<CareerStageStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
  passed: "Passed",
  failed: "Failed",
  waiting: "Waiting",
};

export const coverLetterStatusLabels: Record<CoverLetterStatus, string> = {
  not_started: "Not started",
  drafting: "Drafting",
  reviewing: "Reviewing",
  done: "Done",
};

export const attachmentTypeLabels: Record<CareerAttachmentType, string> = {
  resume: "Resume",
  cover_letter: "Cover Letter",
  portfolio: "Portfolio",
  certificate: "Certificate",
  job_posting: "Job Posting",
  other: "Other",
};

export const defaultCareerStages = (): CareerStage[] => [
  {
    id: createCareerId("stage"),
    label: "서류 접수",
    status: "done",
    date: "",
    memo: "",
  },
  {
    id: createCareerId("stage"),
    label: "서류 결과",
    status: "waiting",
    date: "",
    memo: "",
  },
  {
    id: createCareerId("stage"),
    label: "AI/인적성",
    status: "not_started",
    date: "",
    memo: "",
  },
  {
    id: createCareerId("stage"),
    label: "1차 면접",
    status: "not_started",
    date: "",
    memo: "",
  },
  {
    id: createCareerId("stage"),
    label: "2차 면접",
    status: "not_started",
    date: "",
    memo: "",
  },
  {
    id: createCareerId("stage"),
    label: "최종 결과",
    status: "not_started",
    date: "",
    memo: "",
  },
];

export const createCoverLetterItem = (question = ""): CoverLetterItem => ({
  id: createCareerId("cl"),
  question,
  status: "not_started",
  answer: "",
  memo: "",
});

export const createCareerAttachment = (): CareerAttachment => ({
  id: createCareerId("file"),
  label: "",
  url: "",
  type: "resume",
  memo: "",
});

export const createInterviewReview = (): InterviewReview => ({
  id: createCareerId("interview"),
  stageLabel: "1차 면접",
  date: "",
  interviewer: "",
  questions: "",
  answers: "",
  mood: "",
  result: "",
  reflection: "",
});

export const createCareerItem = (): CareerItem => {
  const today = new Date();
  const deadlineDate = addDays(today, 7);

  return {
    id: createCareerId("career"),
    company: "New Company",
    role: "New Role",
    status: "Preparing",

    priority: "medium",
    starred: false,

    location: "",
    workType: "",

    deadline: toDateString(deadlineDate),

    applicationStartDate: todayString(),
    applicationStartTime: "09:00",
    applicationEndDate: toDateString(deadlineDate),
    applicationEndTime: "23:59",

    postingUrl: "",
    jobDescription: "",

    coverLetterQuestions: [],
    stages: defaultCareerStages(),
    coverLetterItems: [],
    attachments: [],
    interviewReviews: [],

    result: "",
    notes: "",
  };
};

export const normalizeCareerItem = (item: CareerItem): CareerItem => {
  return {
    ...item,
    priority: item.priority ?? "medium",
    starred: item.starred ?? false,
    location: item.location ?? "",
    workType: item.workType ?? "",
    deadline: item.deadline ?? item.applicationEndDate ?? "",
    applicationStartDate: item.applicationStartDate ?? todayString(),
    applicationStartTime: item.applicationStartTime ?? "09:00",
    applicationEndDate: item.applicationEndDate ?? item.deadline ?? todayString(),
    applicationEndTime: item.applicationEndTime ?? "23:59",
    postingUrl: item.postingUrl ?? "",
    jobDescription: item.jobDescription ?? "",
    coverLetterQuestions: item.coverLetterQuestions ?? [],
    stages:
      Array.isArray(item.stages) && item.stages.length > 0
        ? item.stages
        : defaultCareerStages(),
    coverLetterItems:
      Array.isArray(item.coverLetterItems) && item.coverLetterItems.length > 0
        ? item.coverLetterItems
        : (item.coverLetterQuestions ?? []).map((question) =>
            createCoverLetterItem(question)
          ),
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    interviewReviews: Array.isArray(item.interviewReviews)
      ? item.interviewReviews
      : [],
    result: item.result ?? "",
    notes: item.notes ?? "",
  };
};

export const loadCareerItems = (): CareerItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CAREER_STORAGE_KEY);
    if (!raw) return getDefaultCareerItems();

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return getDefaultCareerItems();

    return parsed.map(normalizeCareerItem);
  } catch {
    return getDefaultCareerItems();
  }
};

export const saveCareerItems = (items: CareerItem[]) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(items));

  window.dispatchEvent(
    new CustomEvent("glassday:career-updated", {
      detail: { items },
    })
  );
};

export const getDefaultCareerItems = (): CareerItem[] => [
  normalizeCareerItem({
    ...createCareerItem(),
    id: "career-kibo",
    company: "기술보증기금",
    role: "Application Window",
    status: "Preparing",
    priority: "high",
    starred: true,
    location: "서울, 부산",
    deadline: "2026-06-30",
    applicationStartDate: "2026-06-15",
    applicationStartTime: "09:00",
    applicationEndDate: "2026-06-30",
    applicationEndTime: "23:59",
    postingUrl: "",
    jobDescription: "지원 일정과 자소서 문항을 관리해.",
    notes: "",
  }),
];

export const getDday = (dateString: string) => {
  if (!dateString) return null;

  const today = new Date();
  const target = new Date(`${dateString}T00:00:00`);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getDdayLabel = (dateString: string) => {
  const dday = getDday(dateString);

  if (dday === null) return "No date";
  if (dday < 0) return "Closed";
  if (dday === 0) return "D-Day";
  return `D-${dday}`;
};

export const getDdayTone = (dateString: string) => {
  const dday = getDday(dateString);

  if (dday === null) return "normal";
  if (dday < 0) return "closed";
  if (dday <= 1) return "urgent";
  if (dday <= 7) return "soon";
  return "normal";
};

export const getCoverLetterProgress = (items: CoverLetterItem[]) => {
  if (items.length === 0) return 0;
  const done = items.filter((item) => item.status === "done").length;
  return Math.round((done / items.length) * 100);
};

export const getStageProgress = (stages: CareerStage[]) => {
  if (stages.length === 0) return 0;

  const completed = stages.filter((stage) =>
    ["done", "passed", "failed"].includes(stage.status)
  ).length;

  return Math.round((completed / stages.length) * 100);
};

export const getPriorityScore = (priority: CareerPriority = "medium") => {
  const score: Record<CareerPriority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  return score[priority];
};
