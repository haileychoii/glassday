/**
 * ============================================================
 * [Inactive Legacy Types] Unmounted Career Subcomponent Model
 * ============================================================
 * 이 타입은 같은 career/ 폴더의 미사용 prototype component에서만 참조된다.
 * 현재 CareerWidget과 저장 데이터는 src/types/dashboard.ts의 CareerItem을 사용한다.
 * 두 CareerItem은 필드/status 값이 다르므로 현재 model로 오인하거나 합치지 않는다.
 * ============================================================
 */
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
