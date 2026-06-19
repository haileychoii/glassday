import type { CalendarEvent, CareerItem } from "../../../types/dashboard";

export type AlertSeverity = "danger" | "warning" | "info" | "success";

export type AlertCategory =
  | "career"
  | "calendar"
  | "study"
  | "health"
  | "system";

export type DashboardAlert = {
  id: string;
  title: string;
  message: string;
  category: AlertCategory;
  severity: AlertSeverity;
  createdAt: string;
  actionLabel?: string;
};

export const toLocalDateInput = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getDateDiff = (targetDate: string, baseDate: string) => {
  const target = new Date(`${targetDate}T00:00:00`).getTime();
  const base = new Date(`${baseDate}T00:00:00`).getTime();

  return Math.ceil((target - base) / (1000 * 60 * 60 * 24));
};

export const getMinutesFromTime = (time: string) => {
  const [hour = "0", minute = "0"] = time.split(":");

  return Number(hour) * 60 + Number(minute);
};

export const getNowMinutes = () => {
  const now = new Date();

  return now.getHours() * 60 + now.getMinutes();
};

export const hasLocalStorageRecordForDate = (
  keyword: string,
  date: string
) => {
  try {
    return Object.keys(localStorage).some((key) => {
      const lowerKey = key.toLowerCase();

      if (!lowerKey.startsWith("glassday.")) return false;
      if (!lowerKey.includes(keyword.toLowerCase())) return false;

      const value = localStorage.getItem(key);

      return value?.includes(date);
    });
  } catch {
    return false;
  }
};

export const hasAnyGlassdaySectionData = (keyword: string) => {
  try {
    return Object.keys(localStorage).some((key) => {
      const lowerKey = key.toLowerCase();

      return (
        lowerKey.startsWith("glassday.") &&
        lowerKey.includes(keyword.toLowerCase()) &&
        Boolean(localStorage.getItem(key))
      );
    });
  } catch {
    return false;
  }
};

export const buildCareerDeadlineAlerts = (
  careerApplications: CareerItem[],
  today: string
): DashboardAlert[] => {
  return careerApplications
    .map((item) => {
      const deadline =
        item.applicationEndDate || item.deadline || item.applicationStartDate;

      const dDay = deadline ? getDateDiff(deadline, today) : 999;

      return {
        item,
        deadline,
        dDay,
      };
    })
    .filter(({ item, deadline, dDay }) => {
      if (!deadline) return false;
      if (item.status === "Completed" || item.status === "Rejected") {
        return false;
      }

      return dDay === 7 || dDay === 3 || dDay === 1 || dDay === 0;
    })
    .map(({ item, dDay }) => {
      const isToday = dDay === 0;
      const isTomorrow = dDay === 1;

      return {
        id: `career-deadline-${item.id}-${dDay}`,
        title: isToday
          ? `${item.company} 지원 마감 오늘`
          : `${item.company} 지원 마감 D-${dDay}`,
        message: isToday
          ? `${item.role} 지원 기간이 오늘 끝나. 제출 상태를 확인해줘.`
          : isTomorrow
            ? `${item.role} 지원 마감이 내일이야. 자소서/첨부파일 확인 필요.`
            : `${item.role} 지원 마감까지 ${dDay}일 남았어.`,
        category: "career",
        severity: isToday || isTomorrow ? "danger" : "warning",
        createdAt: today,
        actionLabel: "Career 확인",
      } satisfies DashboardAlert;
    });
};

export const buildStaleCareerAlerts = (
  careerApplications: CareerItem[],
  today: string
): DashboardAlert[] => {
  return careerApplications
    .map((item) => {
      const baseDate = item.applicationStartDate || item.deadline || "";
      const daysPassed = baseDate ? getDateDiff(today, baseDate) : 0;

      return {
        item,
        daysPassed,
      };
    })
    .filter(({ item, daysPassed }) => {
      return item.status === "Preparing" && daysPassed >= 7;
    })
    .slice(0, 4)
    .map(({ item, daysPassed }) => ({
      id: `career-stale-${item.id}`,
      title: `${item.company} 준비 상태 ${daysPassed}일째`,
      message: `${item.role}이 아직 Preparing 상태야. 제출/보류/완료 중 하나로 업데이트해줘.`,
      category: "career",
      severity: daysPassed >= 14 ? "warning" : "info",
      createdAt: today,
      actionLabel: "상태 업데이트",
    }));
};

export const buildCalendarAlerts = (
  calendarEvents: CalendarEvent[],
  today: string
): DashboardAlert[] => {
  const nowMinutes = getNowMinutes();

  return calendarEvents
    .filter((event) => event.startDate <= today && event.endDate >= today)
    .map((event) => {
      const eventStartMinutes =
        event.startDate < today ? nowMinutes : getMinutesFromTime(event.startTime);

      const minutesLeft = eventStartMinutes - nowMinutes;

      return {
        event,
        minutesLeft,
      };
    })
    .filter(({ minutesLeft }) => minutesLeft >= 0 && minutesLeft <= 120)
    .sort((a, b) => a.minutesLeft - b.minutesLeft)
    .slice(0, 5)
    .map(({ event, minutesLeft }) => ({
      id: `calendar-upcoming-${event.id}`,
      title:
        minutesLeft <= 10
          ? `${event.title} 곧 시작`
          : `${event.title} ${minutesLeft}분 후`,
      message: `${event.startTime}–${event.endTime}${
        event.location ? ` · ${event.location}` : ""
      }`,
      category: "calendar",
      severity: minutesLeft <= 10 ? "danger" : "info",
      createdAt: today,
      actionLabel: "Calendar 확인",
    }));
};

export const buildStudyAlerts = (today: string): DashboardAlert[] => {
  const hasStudyData = hasAnyGlassdaySectionData("study");
  const hasStudyToday = hasLocalStorageRecordForDate("study", today);

  if (!hasStudyData) {
    return [
      {
        id: `study-setup-${today}`,
        title: "Study 목표 설정 필요",
        message: "Study Planner를 연결하면 목표 미달 알림을 더 정확히 보여줄 수 있어.",
        category: "study",
        severity: "info",
        createdAt: today,
        actionLabel: "Study 설정",
      },
    ];
  }

  if (!hasStudyToday) {
    return [
      {
        id: `study-missing-${today}`,
        title: "오늘 Study 기록 없음",
        message: "오늘 공부 시간이나 체크리스트를 아직 기록하지 않았어.",
        category: "study",
        severity: "warning",
        createdAt: today,
        actionLabel: "Study 기록",
      },
    ];
  }

  return [];
};

export const buildHealthAlerts = (today: string): DashboardAlert[] => {
  const hasHealthData = hasAnyGlassdaySectionData("health");
  const hasMoodData = hasAnyGlassdaySectionData("mood");

  const hasHealthToday =
    hasLocalStorageRecordForDate("health", today) ||
    hasLocalStorageRecordForDate("mood", today);

  if (!hasHealthData && !hasMoodData) {
    return [
      {
        id: `health-setup-${today}`,
        title: "Health 기록 연결 필요",
        message: "Health/Mood 기록이 생기면 기록 누락 알림을 자동으로 보여줄게.",
        category: "health",
        severity: "info",
        createdAt: today,
        actionLabel: "Health 설정",
      },
    ];
  }

  if (!hasHealthToday) {
    return [
      {
        id: `health-missing-${today}`,
        title: "오늘 Health 기록 없음",
        message: "몸무게, 컨디션, 졸림, 스트레스 중 하나라도 기록해두면 좋아.",
        category: "health",
        severity: "warning",
        createdAt: today,
        actionLabel: "Health 기록",
      },
    ];
  }

  return [];
};

export const buildDashboardAlerts = ({
  calendarEvents,
  careerApplications,
}: {
  calendarEvents: CalendarEvent[];
  careerApplications: CareerItem[];
}) => {
  const today = toLocalDateInput();

  const alerts = [
    ...buildCareerDeadlineAlerts(careerApplications, today),
    ...buildCalendarAlerts(calendarEvents, today),
    ...buildStaleCareerAlerts(careerApplications, today),
    ...buildStudyAlerts(today),
    ...buildHealthAlerts(today),
  ];

  const severityWeight: Record<AlertSeverity, number> = {
    danger: 0,
    warning: 1,
    info: 2,
    success: 3,
  };

  return alerts.sort((a, b) => {
    const severityDiff = severityWeight[a.severity] - severityWeight[b.severity];

    if (severityDiff !== 0) return severityDiff;

    return a.title.localeCompare(b.title);
  });
};