import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { CalendarEvent, CareerItem, CareerStatus } from "../types/dashboard";

const toLocalDateInput = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
    googleSyncStatus: "not_synced",
  },
];

const defaultApplications: CareerItem[] = [
  {
    id: "korean-re",
    company: "Korean Re",
    role: "Reinsurance Underwriter",
    status: "Preparing",
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
    notes: "",
  },
  {
    id: "rga",
    company: "RGA",
    role: "Actuarial Analyst",
    status: "Completed",
    location: "Seoul",
    workType: "Intern / Full-time",
    deadline: "",
    applicationStartDate: "",
    applicationStartTime: "09:00",
    applicationEndDate: "",
    applicationEndTime: "23:59",
    postingUrl: "",
    jobDescription: "IFRS17 Valuation, Treaty, Confirmation Letter, LCF, ER Grouping 관련 경험 정리",
    coverLetterQuestions: ["영어 문서 활용 경험", "IFRS17 Valuation 경험"],
    notes: "",
  },
];

const normalizeCareerItem = (item: Partial<CareerItem>): CareerItem => ({
  id: item.id ?? crypto.randomUUID(),
  company: item.company ?? "New Company",
  role: item.role ?? "New Position",
  status: (item.status ?? "Preparing") as CareerStatus,
  location: item.location ?? "",
  workType: item.workType ?? "",
  deadline: item.deadline ?? "",
  applicationStartDate: item.applicationStartDate ?? "",
  applicationStartTime: item.applicationStartTime ?? "09:00",
  applicationEndDate: item.applicationEndDate ?? item.deadline ?? "",
  applicationEndTime: item.applicationEndTime ?? "23:59",
  postingUrl: item.postingUrl ?? "",
  jobDescription: item.jobDescription ?? "",
  coverLetterQuestions: item.coverLetterQuestions ?? [],
  notes: item.notes ?? "",
});

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
    notes: `${career.role}\n${career.notes}`.trim(),
    source: "career",
    sourceId: career.id,
    googleSyncStatus: "not_synced",
  };
};

const syncCareerEventIntoCalendar = (
  career: CareerItem,
  events: CalendarEvent[]
) => {
  const careerEvent = createCareerCalendarEvent(career);

  if (!careerEvent) {
    return events.filter(
      (event) => !(event.source === "career" && event.sourceId === career.id)
    );
  }

  const exists = events.some(
    (event) => event.source === "career" && event.sourceId === career.id
  );

  if (!exists) {
    return [...events, careerEvent];
  }

  return events.map((event) =>
    event.source === "career" && event.sourceId === career.id
      ? {
          ...event,
          ...careerEvent,
          googleEventId: event.googleEventId,
          googleSyncStatus: event.googleSyncStatus ?? "not_synced",
        }
      : event
  );
};

type DashboardDataContextValue = {
  calendarEvents: CalendarEvent[];
  careerApplications: CareerItem[];

  addCalendarEvent: () => CalendarEvent;
  updateCalendarEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  removeCalendarEvent: (id: string) => void;

  addCareerApplication: () => CareerItem;
  updateCareerApplication: (id: string, patch: Partial<CareerItem>) => void;
  removeCareerApplication: (id: string) => void;
};

const DashboardDataContext = createContext<DashboardDataContextValue | null>(
  null
);

export const DashboardDataProvider = ({ children }: { children: ReactNode }) => {
  const {
    value: rawCalendarEvents,
    setValue: setCalendarEvents,
  } = useLocalStorage<CalendarEvent[]>(
    "glassday.calendar.events.v1",
    defaultCalendarEvents
  );

  const {
    value: rawCareerApplications,
    setValue: setCareerApplications,
  } = useLocalStorage<CareerItem[]>(
    "glassday.career.applications.v2",
    defaultApplications
  );

  const calendarEvents = rawCalendarEvents;
  const careerApplications = rawCareerApplications.map(normalizeCareerItem);

  const addCalendarEvent = () => {
    const today = toLocalDateInput();

    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      title: "New Event",
      startDate: today,
      startTime: "09:00",
      endDate: today,
      endTime: "10:00",
      location: "",
      notes: "",
      source: "manual",
      googleSyncStatus: "not_synced",
    };

    setCalendarEvents((prev) => [newEvent, ...prev]);
    return newEvent;
  };

  const updateCalendarEvent = (id: string, patch: Partial<CalendarEvent>) => {
    let updatedEvent: CalendarEvent | null = null;

    setCalendarEvents((prev) =>
      prev.map((event) => {
        if (event.id !== id) return event;

        updatedEvent = {
          ...event,
          ...patch,
          googleSyncStatus:
            event.googleEventId && event.googleSyncStatus === "synced"
              ? "pending"
              : event.googleSyncStatus ?? "not_synced",
        };

        return updatedEvent;
      })
    );

    setTimeout(() => {
      if (!updatedEvent) return;

      if (updatedEvent.source === "career" && updatedEvent.sourceId) {
        setCareerApplications((prev) =>
          prev.map((item) => {
            const career = normalizeCareerItem(item);

            if (career.id !== updatedEvent?.sourceId) return career;

            return {
              ...career,
              applicationStartDate: updatedEvent.startDate,
              applicationStartTime: updatedEvent.startTime,
              applicationEndDate: updatedEvent.endDate,
              applicationEndTime: updatedEvent.endTime,
              deadline: updatedEvent.endDate,
              location: updatedEvent.location,
            };
          })
        );
      }
    }, 0);
  };

  const removeCalendarEvent = (id: string) => {
    const target = calendarEvents.find((event) => event.id === id);

    setCalendarEvents((prev) => prev.filter((event) => event.id !== id));

    if (target?.source === "career" && target.sourceId) {
      setCareerApplications((prev) =>
        prev.map((item) => {
          const career = normalizeCareerItem(item);

          if (career.id !== target.sourceId) return career;

          return {
            ...career,
            applicationStartDate: "",
            applicationStartTime: "09:00",
            applicationEndDate: "",
            applicationEndTime: "23:59",
            deadline: "",
          };
        })
      );
    }
  };

  const addCareerApplication = () => {
    const newItem = normalizeCareerItem({
      id: crypto.randomUUID(),
      company: "New Company",
      role: "New Position",
      status: "Preparing",
    });

    setCareerApplications((prev) => [newItem, ...prev.map(normalizeCareerItem)]);
    return newItem;
  };

  const updateCareerApplication = (
    id: string,
    patch: Partial<CareerItem>
  ) => {
    let updatedCareer: CareerItem | null = null;

    setCareerApplications((prev) =>
      prev.map((item) => {
        const career = normalizeCareerItem(item);

        if (career.id !== id) return career;

        updatedCareer = normalizeCareerItem({
          ...career,
          ...patch,
          deadline:
            patch.applicationEndDate ?? patch.deadline ?? career.deadline,
        });

        return updatedCareer;
      })
    );

    setTimeout(() => {
      if (!updatedCareer) return;

      setCalendarEvents((prev) =>
        syncCareerEventIntoCalendar(updatedCareer as CareerItem, prev)
      );
    }, 0);
  };

  const removeCareerApplication = (id: string) => {
    setCareerApplications((prev) =>
      prev.filter((item) => normalizeCareerItem(item).id !== id)
    );

    setCalendarEvents((prev) =>
      prev.filter(
        (event) => !(event.source === "career" && event.sourceId === id)
      )
    );
  };

  return (
    <DashboardDataContext.Provider
      value={{
        calendarEvents,
        careerApplications,
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