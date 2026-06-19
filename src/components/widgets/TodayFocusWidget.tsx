import { CalendarCheck, Clock, FileText, Pin, Sparkles } from "lucide-react";

import { GlassCard } from "../glass/GlassCard";
import { useDashboardData } from "../../context/DashboardDataContext";
import type { CalendarEvent, CareerItem } from "../../types/dashboard";
import { cn } from "../../lib/utils";

type MemoNote = {
  id: string;
  title: string;
  html: string;
  pinned?: boolean;
  updatedAt?: number;
};

const toLocalDateInput = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const diffDays = (targetDate: string) => {
  if (!targetDate) return null;

  const today = new Date(`${toLocalDateInput()}T00:00:00`);
  const target = new Date(`${targetDate}T00:00:00`);

  const diff = target.getTime() - today.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const formatDday = (date: string) => {
  const diff = diffDays(date);

  if (diff === null) return "No deadline";
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;

  return `D+${Math.abs(diff)}`;
};

const getDdayTone = (date: string) => {
  const diff = diffDays(date);

  if (diff === null) return "is-muted";
  if (diff <= 0) return "is-danger";
  if (diff <= 3) return "is-warning";
  if (diff <= 7) return "is-soon";

  return "is-normal";
};

const htmlToPlainText = (html: string) => {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.innerText.replace(/\s+/g, " ").trim();
};

const readPinnedMemos = (): MemoNote[] => {
  try {
    const raw = localStorage.getItem("glassday.memo.notes.v2");
    if (!raw) return [];

    const notes = JSON.parse(raw) as MemoNote[];

    return notes
      .filter((note) => note.pinned)
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, 3);
  } catch {
    return [];
  }
};

const eventTouchesToday = (event: CalendarEvent, today: string) => {
  return event.startDate <= today && event.endDate >= today;
};

const isActiveCareer = (item: CareerItem) => {
  return (
    item.status === "Preparing" ||
    item.status === "Submitted" ||
    item.status === "Interview"
  );
};

const getCareerTargetDate = (item: CareerItem) => {
  return item.applicationEndDate || item.deadline;
};

export const TodayFocusWidget = () => {
  const { calendarEvents, careerApplications } = useDashboardData();

  const today = toLocalDateInput();

  const todayEvents = calendarEvents
    .filter((event) => eventTouchesToday(event, today))
    .sort((a, b) => `${a.startTime}`.localeCompare(`${b.startTime}`))
    .slice(0, 4);

  const urgentCareers = careerApplications
    .filter(isActiveCareer)
    .filter((item) => getCareerTargetDate(item))
    .sort((a, b) => {
      const aDiff = diffDays(getCareerTargetDate(a)) ?? 9999;
      const bDiff = diffDays(getCareerTargetDate(b)) ?? 9999;

      return aDiff - bDiff;
    })
    .slice(0, 4);

  const pinnedMemos = readPinnedMemos();

  const focusCount =
    todayEvents.length + urgentCareers.length + pinnedMemos.length;

  return (
    <GlassCard
      title="Today Focus"
      subtitle={`${today} · ${focusCount} focus item${
        focusCount === 1 ? "" : "s"
      }`}
      icon={<Sparkles className="w-4 h-4" />}
      className="today-focus-card"
    >
      <div className="today-focus-layout">
        <section className="today-focus-hero">
          <div>
            <div className="today-focus-kicker">Today</div>
            <div className="today-focus-title">
              {focusCount > 0
                ? "오늘 처리할 것들이 정리됐어."
                : "오늘은 아직 등록된 핵심 일정이 없어."}
            </div>
          </div>

          <div className="today-focus-score">
            <strong>{focusCount}</strong>
            <span>items</span>
          </div>
        </section>

        <section className="today-focus-section">
          <div className="today-focus-section-title">
            <CalendarCheck className="w-3.5 h-3.5" />
            Today Schedule
          </div>

          <div className="today-focus-list">
            {todayEvents.length === 0 ? (
              <div className="today-focus-empty">No events today.</div>
            ) : (
              todayEvents.map((event) => (
                <article key={event.id} className="today-focus-item">
                  <div
                    className="today-focus-color"
                    style={{
                      backgroundColor: event.color || "#DCEBFF",
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="today-focus-item-title">{event.title}</div>
                    <div className="today-focus-item-meta">
                      <Clock className="w-3 h-3" />
                      {event.startTime}–{event.endTime}
                    </div>
                  </div>

                  {event.source === "career" && (
                    <span className="today-focus-badge">Career</span>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        <section className="today-focus-section">
          <div className="today-focus-section-title">
            <FileText className="w-3.5 h-3.5" />
            Career Deadlines
          </div>

          <div className="today-focus-list">
            {urgentCareers.length === 0 ? (
              <div className="today-focus-empty">No urgent applications.</div>
            ) : (
              urgentCareers.map((item) => {
                const targetDate = getCareerTargetDate(item);

                return (
                  <article key={item.id} className="today-focus-item">
                    <div className="min-w-0 flex-1">
                      <div className="today-focus-item-title">
                        {item.company}
                      </div>
                      <div className="today-focus-item-meta">
                        {item.role || "Position not set"}
                      </div>
                    </div>

                    <span
                      className={cn(
                        "today-focus-dday",
                        getDdayTone(targetDate)
                      )}
                    >
                      {formatDday(targetDate)}
                    </span>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="today-focus-section">
          <div className="today-focus-section-title">
            <Pin className="w-3.5 h-3.5" />
            Pinned Memos
          </div>

          <div className="today-focus-list">
            {pinnedMemos.length === 0 ? (
              <div className="today-focus-empty">No pinned memos.</div>
            ) : (
              pinnedMemos.map((memo) => (
                <article key={memo.id} className="today-focus-item">
                  <div className="min-w-0 flex-1">
                    <div className="today-focus-item-title">
                      {memo.title || "Untitled memo"}
                    </div>
                    <div className="today-focus-item-meta">
                      {htmlToPlainText(memo.html).slice(0, 64) || "Empty memo"}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </GlassCard>
  );
};