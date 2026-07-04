export type CalendarView = "day" | "week" | "month";

export type GoogleSyncStatus = "not_synced" | "pending" | "synced" | "error";

export type CalendarEventSource = "manual" | "career" | "study" | "system";

export type CalendarEvent = {
  id: string;
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  notes: string;
  source: CalendarEventSource;
  sourceId?: string;
  careerApplicationId?: string;
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

export type CareerStageStatus = "todo" | "doing" | "done";

export type CareerStage = {
  id: string;
  label: string;
  status: CareerStageStatus;
  date?: string;
  notes?: string;
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

export type CareerItem = {
  id: string;
  company: string;
  role: string;
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
