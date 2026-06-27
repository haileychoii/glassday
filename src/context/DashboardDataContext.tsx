import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { getPastelColorById } from "../constants/colors";
import type {
  CalendarEvent,
  CareerAttachmentLink,
  CareerInterviewReview,
  CareerItem,
  CareerPriority,
  CareerStage,
  CareerStatus,
  CoverLetterItem,
} from "../types/dashboard";

const toLocalDateInput = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createDefaultStages = (): CareerStage[] => [
  { id: createId(), label: "서류", status: "todo" },
  { id: createId(), label: "필기", status: "todo" },
  { id: createId(), label: "면접", status: "todo" },
  { id: createId(), label: "결과", status: "todo" },
];

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is string => typeof item === "string");
};

const normalizeStages = (value: unknown): CareerStage[] => {
  if (!Array.isArray(value) || value.length === 0) {
    return createDefaultStages();
  }

  return value.map((item) => ({
    id: typeof item?.id === "string" ? item.id : createId(),
    label: typeof item?.label === "string" ? item.label : "Stage",
    status:
      item?.status === "doing" || item?.status === "done"
        ? item.status
        : "todo",
    date: typeof item?.date === "string" ? item.date : "",
    notes: typeof item?.notes === "string" ? item.notes : "",
  }));
};

const normalizeCoverLetterItems = (
  value: unknown,
  fallbackQuestions: string[]
): CoverLetterItem[] => {
  if (Array.isArray(value) && value.length > 0) {
    return value.map((item) => ({
      id: typeof item?.id === "string" ? item.id : createId(),
      question:
        typeof item?.question === "string" ? item.question : "자소서 문항",
      status:
        item?.status === "drafting" || item?.status === "done"
          ? item.status
          : "todo",
      answer: typeof item?.answer === "string" ? item.answer : "",
      strategy:
        typeof item?.strategy === "string"
          ? item.strategy
          : typeof item?.memo === "string"
            ? item.memo
            : "",
      memo:
        typeof item?.memo === "string"
          ? item.memo
          : typeof item?.strategy === "string"
            ? item.strategy
            : "",
    }));
  }

  return fallbackQuestions.map((question) => ({
    id: createId(),
    question,
    status: "todo",
    answer: "",
    strategy: "",
    memo: "",
  }));
};

const normalizeAttachmentLinks = (value: unknown): CareerAttachmentLink[] => {
  if (!Array.isArray(value)) return [];

  return value.map((item) => ({
    id: typeof item?.id === "string" ? item.id : createId(),
    label: typeof item?.label === "string" ? item.label : "Attachment",
    url: typeof item?.url === "string" ? item.url : "",
  }));
};

const normalizeInterviewReviews = (value: unknown): CareerInterviewReview[] => {
  if (!Array.isArray(value)) return [];

  return value.map((item) => ({
    id: typeof item?.id === "string" ? item.id : createId(),
    title: typeof item?.title === "string" ? item.title : "Interview Review",
    date: typeof item?.date === "string" ? item.date : "",
    notes: typeof item?.notes === "string" ? item.notes : "",
  }));
};

const normalizePriority = (value: unknown): CareerPriority => {
  if (value === "high" || value === "low") return value;
  return "medium";
};

const normalizeStatus = (value: unknown): CareerStatus => {
  const allowed: CareerStatus[] = [
    "Saved",
    "Preparing",
    "Applied",
    "Interview",
    "Offer",
    "Rejected",
    "Completed",
  ];

  return allowed.includes(value as CareerStatus)
    ? (value as CareerStatus)
    : "Preparing";
};

const defaultCalendarEvents: CalendarEvent[] = [
  {
    id: "daily-work",
    title: "Work Start",
    startDate: toLocalDateInput(),
    startTime: "08:40",
    endDate: toLocalDateInput(),
    endTime: "09:00",
    location: "",
    notes: "",
    source: "manual",
    color: getPastelColorById("daily-work"),
    googleSyncStatus: "not_synced",
  },
  {
    id: "daily-study",
    title: "NCS Study",
    startDate: toLocalDateInput(),
    startTime: "19:30",
    endDate: toLocalDateInput(),
    endTime: "21:00",
    location: "",
    notes: "",
    source: "manual",
    color: getPastelColorById("daily-study"),
    googleSyncStatus: "not_synced",
  },
];

const defaultApplications: CareerItem[] = [
  {
    id: "korean-re",
    company: "Korean Re",
    role: "Reinsurance Underwriter",
    status: "Preparing",
    priority: "high",
    starred: true,
    location: "Seoul",
    workType: "Full-time",
    deadline: "",
    applicationStartDate: "",
    applicationStartTime: "09:00",
    applicationEndDate: "",
    applicationEndTime: "23:59",
    postingUrl: "",
    jobDescription: "",
    coverLetterQuestions: ["지원 동기", "직무 관련 경험"],
    coverLetterItems: [
      {
        id: createId(),
        question: "지원 동기",
        status: "todo",
        answer: "",
        strategy: "",
        memo: "",
      },
      {
        id: createId(),
        question: "직무 관련 경험",
        status: "todo",
        answer: "",
        strategy: "",
        memo: "",
      },
    ],
    stages: createDefaultStages(),
    attachmentLinks: [],
    interviewReviews: [],
    notes: "",
    result: "",
    calendarColor: getPastelColorById("korean-re"),
  },
  {
    id: "rga",
    company: "RGA",
    role: "Actuarial Analyst",
    status: "Completed",
    priority: "medium",
    starred: false,
    location: "Seoul",
    workType: "Intern / Full-time",
    deadline: "",
    applicationStartDate: "",
    applicationStartTime: "09:00",
    applicationEndDate: "",
    applicationEndTime: "23:59",
    postingUrl: "",
    jobDescription:
      "IFRS17 Valuation, Treaty, Confirmation Letter, LCF, ER Grouping 관련 경험 정리",
    coverLetterQuestions: ["영어 문서 활용 경험", "IFRS17 Valuation 경험"],
    coverLetterItems: [
      {
        id: createId(),
        question: "영어 문서 활용 경험",
        status: "todo",
        answer: "",
        strategy: "",
        memo: "",
      },
      {
        id: createId(),
        question: "IFRS17 Valuation 경험",
        status: "todo",
        answer: "",
        strategy: "",
        memo: "",
      },
    ],
    stages: createDefaultStages(),
    attachmentLinks: [],
    interviewReviews: [],
    notes: "",
    result: "",
    calendarColor: getPastelColorById("rga"),
  },
];

const normalizeCareerItem = (item: Partial<CareerItem>): CareerItem => {
  const coverLetterQuestions = normalizeStringArray(item.coverLetterQuestions);

  const normalized: CareerItem = {
    id: item.id ?? createId(),
    company: item.company ?? "New Company",
    role: item.role ?? "New Position",
    status: normalizeStatus(item.status),
    priority: normalizePriority(item.priority),
    starred: Boolean(item.starred),

    location: item.location ?? "",
    workType: item.workType ?? "",
    deadline: item.deadline ?? "",

    applicationStartDate: item.applicationStartDate ?? "",
    applicationStartTime: item.applicationStartTime ?? "09:00",
    applicationEndDate: item.applicationEndDate ?? item.deadline ?? "",
    applicationEndTime: item.applicationEndTime ?? "23:59",

    postingUrl: item.postingUrl ?? "",
    jobDescription: item.jobDescription ?? "",

    coverLetterQuestions,
    coverLetterItems: normalizeCoverLetterItems(
      item.coverLetterItems,
      coverLetterQuestions
    ),

    stages: normalizeStages(item.stages),
    attachmentLinks: normalizeAttachmentLinks(item.attachmentLinks),
    interviewReviews: normalizeInterviewReviews(item.interviewReviews),

    result: item.result ?? "",
    notes: item.notes ?? "",
    calendarColor: item.calendarColor ?? getPastelColorById(item.id ?? "career"),

    createdAt: item.createdAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? new Date().toISOString(),
  };

  return normalized;
};

const createCareerCalendarEvent = (career: CareerItem): CalendarEvent | null => {
  const startDate = career.applicationStartDate || career.applicationEndDate;
  const endDate = career.applicationEndDate || career.applicationStartDate;

  if (!startDate && !endDate) return null;

  return {
    id: `career-${career.id}`,
    title: `${career.company || "Company"} · Application Window`,
    startDate: startDate || endDate,
    startTime: career.applicationStartTime || "09:00",
    endDate: endDate || startDate,
    endTime: career.applicationEndTime || "23:59",
    location: career.location,
    notes: [
      career.role,
      career.postingUrl ? `Posting: ${career.postingUrl}` : "",
      career.jobDescription,
      career.notes,
    ]
      .filter(Boolean)
      .join("\n"),
    source: "career",
    sourceId: career.id,
    careerApplicationId: career.id,
    color: career.calendarColor ?? getPastelColorById(career.id),
    googleSyncStatus: "not_synced",
  };
};

const syncCareerEventIntoCalendar = (
  career: CareerItem,
  events: CalendarEvent[]
): CalendarEvent[] => {
  const careerEvent = createCareerCalendarEvent(career);

  if (!careerEvent) {
    return events.filter(
      (event) =>
        !(
          event.source === "career" &&
          (event.sourceId === career.id ||
            event.careerApplicationId === career.id)
        )
    );
  }

  const exists = events.some(
    (event) =>
      event.source === "career" &&
      (event.sourceId === career.id ||
        event.careerApplicationId === career.id)
  );

  if (!exists) {
    return [...events, careerEvent];
  }

  return events.map((event) =>
    event.source === "career" &&
    (event.sourceId === career.id ||
      event.careerApplicationId === career.id)
      ? {
          ...event,
          ...careerEvent,
          googleEventId: event.googleEventId,
          googleSyncStatus:
            event.googleEventId && event.googleSyncStatus === "synced"
              ? "pending"
              : event.googleSyncStatus ?? "not_synced",
        }
      : event
  );
};

type DashboardDataContextValue = {
  calendarEvents: CalendarEvent[];
  careerApplications: CareerItem[];

  activeCareerDetailId: string | null;
  openCareerDetail: (id: string) => void;
  closeCareerDetail: () => void;

  addCalendarEvent: (patch?: Partial<CalendarEvent>) => CalendarEvent;
  updateCalendarEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  removeCalendarEvent: (id: string) => void;

  addCareerApplication: (patch?: Partial<CareerItem>) => CareerItem;
  updateCareerApplication: (id: string, patch: Partial<CareerItem>) => void;
  removeCareerApplication: (id: string) => void;
};

const DashboardDataContext = createContext<DashboardDataContextValue | null>(
  null
);

export const DashboardDataProvider = ({ children }: { children: ReactNode }) => {
  const [activeCareerDetailId, setActiveCareerDetailId] = useState<
    string | null
  >(null);

  const { value: rawCalendarEvents, setValue: setCalendarEvents } =
    useLocalStorage<CalendarEvent[]>(
      "glassday.calendar.events.v1",
      defaultCalendarEvents
    );

  const { value: rawCareerApplications, setValue: setCareerApplications } =
    useLocalStorage<CareerItem[]>(
      "glassday.career.applications.v2",
      defaultApplications
    );

  const calendarEvents = rawCalendarEvents.map((event) => ({
    ...event,
    color: event.color ?? getPastelColorById(event.id),
  }));

  const careerApplications = rawCareerApplications.map(normalizeCareerItem);

  useEffect(() => {
    setCalendarEvents((prev) =>
      rawCareerApplications
        .map(normalizeCareerItem)
        .reduce(
          (events, career) => syncCareerEventIntoCalendar(career, events),
          prev.map((event) => ({
            ...event,
            color: event.color ?? getPastelColorById(event.id),
          }))
        )
    );
  }, [rawCareerApplications, setCalendarEvents]);

  const openCareerDetail = (id: string) => {
    setActiveCareerDetailId(id);
  };

  const closeCareerDetail = () => {
    setActiveCareerDetailId(null);
  };

  const addCalendarEvent = (patch: Partial<CalendarEvent> = {}) => {
    const today = toLocalDateInput();
    const eventId = patch.id ?? createId();

    const newEvent: CalendarEvent = {
      id: eventId,
      title: patch.title ?? "New Event",
      startDate: patch.startDate ?? today,
      startTime: patch.startTime ?? "09:00",
      endDate: patch.endDate ?? patch.startDate ?? today,
      endTime: patch.endTime ?? "10:00",
      location: patch.location ?? "",
      notes: patch.notes ?? "",
      source: patch.source ?? "manual",
      sourceId: patch.sourceId,
      careerApplicationId: patch.careerApplicationId,
      color: patch.color ?? getPastelColorById(eventId),
      googleEventId: patch.googleEventId,
      googleSyncStatus: patch.googleSyncStatus ?? "not_synced",
    };

    setCalendarEvents((prev) => [newEvent, ...prev]);
    return newEvent;
  };

  const updateCalendarEvent = (id: string, patch: Partial<CalendarEvent>) => {
    const target = calendarEvents.find((event) => event.id === id);
    if (!target) return;

    const updatedEvent: CalendarEvent = {
      ...target,
      ...patch,
      color: patch.color ?? target.color ?? getPastelColorById(target.id),
      googleSyncStatus:
        target.googleEventId && target.googleSyncStatus === "synced"
          ? "pending"
          : target.googleSyncStatus ?? "not_synced",
    };

    setCalendarEvents((prev) =>
      prev.map((event) => (event.id === id ? updatedEvent : event))
    );

    if (updatedEvent.source === "career") {
      const careerId =
        updatedEvent.sourceId ?? updatedEvent.careerApplicationId;

      if (!careerId) return;

      setCareerApplications((prev) =>
        prev.map((item) => {
          const career = normalizeCareerItem(item);

          if (career.id !== careerId) return career;

          return normalizeCareerItem({
            ...career,
            applicationStartDate: updatedEvent.startDate,
            applicationStartTime: updatedEvent.startTime,
            applicationEndDate: updatedEvent.endDate,
            applicationEndTime: updatedEvent.endTime,
            deadline: updatedEvent.endDate,
            location: updatedEvent.location,
            calendarColor: updatedEvent.color ?? career.calendarColor,
            updatedAt: new Date().toISOString(),
          });
        })
      );
    }
  };

  const removeCalendarEvent = (id: string) => {
    const target = calendarEvents.find((event) => event.id === id);

    setCalendarEvents((prev) => prev.filter((event) => event.id !== id));

    if (target?.source === "career") {
      const careerId = target.sourceId ?? target.careerApplicationId;

      if (!careerId) return;

      setCareerApplications((prev) =>
        prev.map((item) => {
          const career = normalizeCareerItem(item);

          if (career.id !== careerId) return career;

          return normalizeCareerItem({
            ...career,
            applicationStartDate: "",
            applicationStartTime: "09:00",
            applicationEndDate: "",
            applicationEndTime: "23:59",
            deadline: "",
            updatedAt: new Date().toISOString(),
          });
        })
      );
    }
  };

  const addCareerApplication = (patch: Partial<CareerItem> = {}) => {
    const id = patch.id ?? createId();

    const newItem = normalizeCareerItem({
      id,
      company: "New Company",
      role: "New Position",
      status: "Preparing",
      priority: "medium",
      starred: false,
      calendarColor: patch.calendarColor ?? getPastelColorById(id),
      ...patch,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setCareerApplications((prev) => [
      newItem,
      ...prev.map(normalizeCareerItem),
    ]);

    setCalendarEvents((prev) => syncCareerEventIntoCalendar(newItem, prev));
    setActiveCareerDetailId(newItem.id);

    return newItem;
  };

  const updateCareerApplication = (
    id: string,
    patch: Partial<CareerItem>
  ) => {
    const current = careerApplications.find((item) => item.id === id);
    if (!current) return;

    const updatedCareer = normalizeCareerItem({
      ...current,
      ...patch,
      deadline:
        patch.applicationEndDate ?? patch.deadline ?? current.deadline,
      calendarColor:
        patch.calendarColor ??
        current.calendarColor ??
        getPastelColorById(current.id),
      updatedAt: new Date().toISOString(),
    });

    setCareerApplications((prev) =>
      prev.map((item) => {
        const career = normalizeCareerItem(item);
        return career.id === id ? updatedCareer : career;
      })
    );

    setCalendarEvents((prev) =>
      syncCareerEventIntoCalendar(updatedCareer, prev)
    );
  };

  const removeCareerApplication = (id: string) => {
    setCareerApplications((prev) =>
      prev.filter((item) => normalizeCareerItem(item).id !== id)
    );

    setCalendarEvents((prev) =>
      prev.filter(
        (event) =>
          !(
            event.source === "career" &&
            (event.sourceId === id || event.careerApplicationId === id)
          )
      )
    );

    if (activeCareerDetailId === id) {
      setActiveCareerDetailId(null);
    }
  };

  return (
    <DashboardDataContext.Provider
      value={{
        calendarEvents,
        careerApplications,

        activeCareerDetailId,
        openCareerDetail,
        closeCareerDetail,

        addCalendarEvent,
        updateCalendarEvent,
        removeCalendarEvent,

        addCareerApplication,
        updateCareerApplication,
        removeCareerApplication,
      }}
    >
      {children}
    </DashboardDataContext.Provider>
  );
};

export const useDashboardData = () => {
  const context = useContext(DashboardDataContext);

  if (!context) {
    throw new Error("useDashboardData must be used inside DashboardDataProvider");
  }

  return context;
};