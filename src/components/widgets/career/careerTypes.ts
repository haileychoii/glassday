 export type CareerStatus =
  | "Preparing"
  | "Submitted"
  | "Screening"
  | "Interview"
  | "Offer"
  | "Completed"
  | "Rejected";

export type CareerPriority = "high" | "medium" | "low";

export type CareerStageStatus =
  | "not_started"
  | "in_progress"
  | "done"
  | "passed"
  | "failed"
  | "waiting";

export type CareerStage = {
  id: string;
  label: string;
  status: CareerStageStatus;
  date: string;
  memo: string;
};

export type CoverLetterStatus =
  | "not_started"
  | "drafting"
  | "reviewing"
  | "done";

export type CoverLetterItem = {
  id: string;
  question: string;
  status: CoverLetterStatus;
  answer: string;
  memo: string;
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

export type InterviewReview = {
  id: string;
  stageLabel: string;
  date: string;
  interviewer: string;
  questions: string;
  answers: string;
  mood: string;
  result: string;
  reflection: string;
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

  coverLetterQuestions?: string[];
  stages?: CareerStage[];
  coverLetterItems?: CoverLetterItem[];
  attachments?: CareerAttachment[];
  interviewReviews?: InterviewReview[];

  result?: string;
  notes: string;
};