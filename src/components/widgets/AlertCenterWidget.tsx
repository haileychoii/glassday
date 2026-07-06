import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Sparkles,
} from "lucide-react";

import { GlassCard } from "../glass/GlassCard";

type AlertTone = "danger" | "warning" | "info" | "success";

type AlertItem = {
  id: string;
  title: string;
  description: string;
  meta: string;
  tone: AlertTone;
  icon: ReactNode;
};

type StoredCareerItem = {
  id?: string;
  company?: string;
  role?: string;
  status?: string;
  deadline?: string;
  applicationEndDate?: string;
  coverLetterItems?: Array<{
    status?: string;
  }>;
};

type StoredStudySubject = {
  id?: string;
  label?: string;
  records?: Array<{
    date?: string;
    minutes?: number;
    targetMinutes?: number;
    tasks?: Array<{
      done?: boolean;
    }>;
  }>;
};

type StoredJournalEntry = {
  date?: string;
  reflection?: string;
  workLog?: string;
  learned?: string;
  careerMaterial?: string;
};

const CAREER_STORAGE_KEY = "glassday.career.items.v1";
const STUDY_STORAGE_KEY = "glassday.study.planner.v1";
const JOURNAL_STORAGE_KEY = "glassday.journal.entries.v1";

const pad2 = (value: number) => String(value).padStart(2, "0");

const toDateString = (date: Date) => {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
};

const todayString = () => toDateString(new Date());

const parseJsonArray = <T,>(key: string): T[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;

    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const getDday = (dateString?: string) => {
  if (!dateString) return null;

  const target = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
};

const getDdayText = (dateString?: string) => {
  const dday = getDday(dateString);

  if (dday === null) return "No date";
  if (dday < 0) return "Closed";
  if (dday === 0) return "D-Day";
  return `D-${dday}`;
};

const getCareerAlerts = (): AlertItem[] => {
  const careerItems = parseJsonArray<StoredCareerItem>(CAREER_STORAGE_KEY);

  return careerItems
    .flatMap((item): AlertItem[] => {
      const deadline = item.deadline || item.applicationEndDate;
      const dday = getDday(deadline);
      const company = item.company || "지원 회사";
      const role = item.role || "Application";

      const alerts: AlertItem[] = [];

      if (dday !== null && dday >= 0 && dday <= 7) {
        alerts.push({
          id: `career-deadline-${item.id ?? company}`,
          title: `${company} 마감 임박`,
          description:
            dday === 0
              ? `${role} 지원 마감이 오늘이야.`
              : `${role} 지원 마감까지 ${dday}일 남았어.`,
          meta: getDdayText(deadline),
          tone: dday <= 1 ? "danger" : "warning",
          icon: <BriefcaseBusiness className="w-4 h-4" />,
        });
      }

      const coverLetterItems = Array.isArray(item.coverLetterItems)
        ? item.coverLetterItems
        : [];

      const unfinishedCoverLetters = coverLetterItems.filter(
        (question) => question.status !== "done"
      ).length;

      if (
        unfinishedCoverLetters > 0 &&
        dday !== null &&
        dday >= 0 &&
        dday <= 7
      ) {
        alerts.push({
          id: `career-cl-${item.id ?? company}`,
          title: `${company} 자소서 미완료`,
          description: `아직 ${unfinishedCoverLetters}개 문항이 완료되지 않았어.`,
          meta: getDdayText(deadline),
          tone: dday <= 2 ? "danger" : "warning",
          icon: <FileText className="w-4 h-4" />,
        });
      }

      if (item.status === "Interview") {
        alerts.push({
          id: `career-interview-${item.id ?? company}`,
          title: `${company} 면접 준비`,
          description: `${role} 면접 단계야. 질문/답변 기록을 정리해두면 좋아.`,
          meta: "Interview",
          tone: "info",
          icon: <CalendarClock className="w-4 h-4" />,
        });
      }

      return alerts;
    })
    .slice(0, 6);
};

const getStudyAlerts = (): AlertItem[] => {
  const subjects = parseJsonArray<StoredStudySubject>(STUDY_STORAGE_KEY);
  const today = todayString();

  if (subjects.length === 0) {
    return [
      {
        id: "study-empty",
        title: "Study Planner 준비됨",
        description: "오늘 공부 시간과 목표 시간을 입력하면 알림이 자동으로 잡혀.",
        meta: "Study",
        tone: "info",
        icon: <BookOpen className="w-4 h-4" />,
      },
    ];
  }

  const alerts: AlertItem[] = [];

  subjects.forEach((subject) => {
    const record = subject.records?.find((item) => item.date === today);
    const label = subject.label || subject.id || "Study";

    if (!record) {
      alerts.push({
        id: `study-no-record-${subject.id ?? label}`,
        title: `${label} 기록 없음`,
        description: "오늘 공부 기록이 아직 없어.",
        meta: "Today",
        tone: "warning",
        icon: <Clock3 className="w-4 h-4" />,
      });

      return;
    }

    const minutes = record.minutes ?? 0;
    const targetMinutes = record.targetMinutes ?? 0;
    const progress =
      targetMinutes <= 0 ? 0 : Math.round((minutes / targetMinutes) * 100);

    if (targetMinutes > 0 && progress < 50) {
      alerts.push({
        id: `study-low-progress-${subject.id ?? label}`,
        title: `${label} 목표 미달`,
        description: `오늘 목표 대비 ${progress}% 진행했어.`,
        meta: `${minutes}/${targetMinutes}m`,
        tone: "warning",
        icon: <BookOpen className="w-4 h-4" />,
      });
    }

    const tasks = Array.isArray(record.tasks) ? record.tasks : [];
    const unfinishedTasks = tasks.filter((task) => !task.done).length;

    if (unfinishedTasks > 0) {
      alerts.push({
        id: `study-tasks-${subject.id ?? label}`,
        title: `${label} 체크리스트 남음`,
        description: `아직 ${unfinishedTasks}개 할 일이 남아 있어.`,
        meta: "Checklist",
        tone: "info",
        icon: <CheckCircle2 className="w-4 h-4" />,
      });
    }
  });

  return alerts.slice(0, 5);
};

const getJournalAlerts = (): AlertItem[] => {
  const entries = parseJsonArray<StoredJournalEntry>(JOURNAL_STORAGE_KEY);
  const today = todayString();
  const todayEntry = entries.find((entry) => entry.date === today);

  if (!todayEntry) {
    return [
      {
        id: "journal-empty-today",
        title: "오늘 회고 없음",
        description: "Daily Journal에 오늘 업무/공부/회고를 남겨봐.",
        meta: "Journal",
        tone: "info",
        icon: <Sparkles className="w-4 h-4" />,
      },
    ];
  }

  const filled =
    Boolean(todayEntry.reflection?.trim()) ||
    Boolean(todayEntry.workLog?.trim()) ||
    Boolean(todayEntry.learned?.trim()) ||
    Boolean(todayEntry.careerMaterial?.trim());

  if (!filled) {
    return [
      {
        id: "journal-not-filled",
        title: "Journal 내용 부족",
        description: "오늘 기록이 아직 비어 있어. 한 줄이라도 적어두면 좋아.",
        meta: "Today",
        tone: "info",
        icon: <Sparkles className="w-4 h-4" />,
      },
    ];
  }

  return [
    {
      id: "journal-complete",
      title: "Journal 기록 완료",
      description: "오늘 기록이 남아 있어. 필요하면 해시태그로 자소서 소재를 모아봐.",
      meta: "Done",
      tone: "success",
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ];
};

const buildAlerts = (): AlertItem[] => {
  const careerAlerts = getCareerAlerts();
  const studyAlerts = getStudyAlerts();
  const journalAlerts = getJournalAlerts();

  const alerts = [...careerAlerts, ...studyAlerts, ...journalAlerts];

  if (alerts.length === 0) {
    return [
      {
        id: "all-clear",
        title: "All clear",
        description: "급한 알림이 없어. 지금은 계획대로만 가면 돼.",
        meta: "Good",
        tone: "success",
        icon: <CheckCircle2 className="w-4 h-4" />,
      },
    ];
  }

  return alerts;
};

export const AlertCenterWidget = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshKey((prev) => prev + 1);

    window.addEventListener("storage", refresh);
    window.addEventListener("glassday:career-updated", refresh);
    window.addEventListener("glassday:study-updated", refresh);
    window.addEventListener("glassday:journal-updated", refresh);
    window.addEventListener("glassday:journal-cleared", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("glassday:career-updated", refresh);
      window.removeEventListener("glassday:study-updated", refresh);
      window.removeEventListener("glassday:journal-updated", refresh);
      window.removeEventListener("glassday:journal-cleared", refresh);
    };
  }, []);

  const alerts = useMemo(() => {
    refreshKey;
    return buildAlerts();
  }, [refreshKey]);

  const urgentCount = alerts.filter((alert) => alert.tone === "danger").length;
  const warningCount = alerts.filter((alert) => alert.tone === "warning").length;

  return (
    <GlassCard
      className="alert-center-widget"
      title="Alert Center"
      subtitle={
        urgentCount > 0
          ? `${urgentCount} urgent alert${urgentCount > 1 ? "s" : ""}`
          : warningCount > 0
            ? `${warningCount} warning${warningCount > 1 ? "s" : ""}`
            : "No critical alerts"
      }
      icon={<Bell className="w-4 h-4" />}
      actions={
        <button
          type="button"
          onClick={() => setRefreshKey((prev) => prev + 1)}
          className="glass-button h-8 px-3 text-xs"
        >
          Refresh
        </button>
      }
    >
      <div className="alert-center-list">
        {alerts.map((alert) => (
          <article
            key={alert.id}
            className={`alert-center-item tone-${alert.tone}`}
          >
            <div className="alert-center-icon">{alert.icon}</div>

            <div className="alert-center-content">
              <div className="alert-center-title-row">
                <strong>{alert.title}</strong>
                <span>{alert.meta}</span>
              </div>

              <p>{alert.description}</p>
            </div>

            {alert.tone === "danger" && (
              <AlertTriangle className="alert-center-danger-icon w-4 h-4" />
            )}
          </article>
        ))}
      </div>
    </GlassCard>
  );
};
