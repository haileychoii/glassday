export type CalendarSource = "manual" | "career";

export type CalendarView = "day" | "week" | "month";

export type CalendarEvent = {
  id: string;
  title: string;

  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;

  location: string;
  notes: string;

  source: CalendarSource;
  sourceId?: string;
  color?: string;
  googleEventId?: string;
  googleSyncStatus?: "not_synced" | "synced" | "pending";
};

export type CareerStatus =
  | "Preparing"
  | "Submitted"
  | "Interview"
  | "Completed"
  | "Rejected";

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
  notes: string;
  stages?:CareerStage[];
  coverLetterItems?: CoverLetterItem[];

  attatchments?; CareerAttachment[];
  notes: string;
};

export type CareerAttachmentType = 
| "resume"
| "cover_letter"
| "portfolio"
| "certificate"
| "job_posting"
| "other";

export type CareerAttachment = {
  id: string;
  label: string;
  url: string;
  type: CareerAttachmentType;
  memo: string;
};
