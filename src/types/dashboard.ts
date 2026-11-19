/**
 * ============================================================
 * [Domain Types] Calendar + Career Shared Data
 * ============================================================
 *
 * Consumers:
 * - src/context/DashboardDataContext.tsx
 * - CalendarWidget 및 calendar/* subcomponents
 * - CareerWidget 및 career/* subcomponents
 * - TodayFocusWidget
 *
 * Source of Truth / Persistence:
 * - DashboardDataContext
 * - glassday.calendar.events.v1, glassday.career.applications.v2
 *
 * Figma Mapping:
 * - CalendarEvent = Event Card / Event Detail Form
 * - CareerItem = Application Card / Board Card / Career Detail Window
 * - status union = Badge, Chip, Select의 Variant 이름
 * ============================================================
 */
export type CalendarView = "day" | "week" | "month";

export type GoogleSyncStatus = "not_synced" | "pending" | "synced" | "error";

export type CalendarEventSource = "manual" | "career" | "study" | "system";

export type CalendarEvent = {
  /** Calendar list key이며 event color fallback 계산에도 사용되는 안정적인 id. */
  id: string;
  /** Event Card의 Primary Text. */
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  notes: string;
  /** manual/career 등 생성 경로를 구분하며 detail interaction을 결정한다. */
  source: CalendarEventSource;
  /** 원본 Career record와 Calendar projection을 연결하는 id. */
  sourceId?: string;
  careerApplicationId?: string;
  careerStageId?: string;
  color?: string;
  googleEventId?: string;
  googleSyncStatus?: GoogleSyncStatus;
};

export type CareerStatus =
  | "Saved"
  | "Preparing"
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Completed";

export type CareerPriority = "high" | "medium" | "low";

export type CareerStageStatus = "todo" | "doing" | "done" | "skipped";

export type CareerStageDateMode = "single" | "range";

export type CareerStageKind =
  | "document-submit"
  | "document-result"
  | "written-exam"
  | "interview-1"
  | "interview-2"
  | "interview-3"
  | "final-result"
  | "other";

export type CareerStage = {
  id: string;
  label: string;
  status: CareerStageStatus;
  kind?: CareerStageKind;
  /** Calendar projection mode: one-day milestones or multi-day ranges. */
  dateMode?: CareerStageDateMode;
  date?: string;
  time?: string;
  endDate?: string;
  endTime?: string;
  notes?: string;
  calendarSync?: boolean;
};

export type CoverLetterStatus = "todo" | "drafting" | "done";

export type CoverLetterItem = {
  id: string;
  question: string;
  status: CoverLetterStatus;
  answer?: string;
  strategy?: string;
  memo?: string;
  answerLimit?: number;
};

export type CareerAttachmentLink = {
  id: string;
  label: string;
  url: string;
};

export type CareerInterviewReview = {
  id: string;
  title: string;
  date?: string;
  notes: string;
};

/* Career image attachment
   Job-detail and Notes galleries share this model and the same CareerItem
   snapshot used by Wide/Laptop and cloud sync.
   직무 사진과 메모 사진은 레이아웃별로 나뉘지 않고 같은 지원 항목에 저장됩니다. */
export type CareerImageAttachment = {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: string;
};

export type CareerItem = {
  /** Application Card, Calendar event, Floating Detail을 연결하는 record id. */
  id: string;
  /** Card의 Primary/Secondary Text. */
  company: string;
  role: string;
  /** List filter, Board column, Status Badge Variant에 함께 사용된다. */
  status: CareerStatus;
  priority?: CareerPriority;
  starred?: boolean;

  location: string;
  workType: string;
  deadline: string;

  applicationStartDate: string;
  applicationStartTime: string;
  applicationEndDate: string;
  applicationEndTime: string;

  postingUrl: string;
  jobDescription: string;
  jobImages?: CareerImageAttachment[];
  noteImages?: CareerImageAttachment[];

  coverLetterQuestions: string[];
  coverLetterItems?: CoverLetterItem[];

  stages?: CareerStage[];
  attachmentLinks?: CareerAttachmentLink[];
  interviewReviews?: CareerInterviewReview[];

  result?: string;
  notes: string;
  calendarColor?: string;

  createdAt?: string;
  updatedAt?: string;
};
