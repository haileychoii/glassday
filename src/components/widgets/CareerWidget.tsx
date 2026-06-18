import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ExternalLink,
  Link,
  Lock,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { GlassCard } from "../glass/GlassCard";
import { cn } from "../../lib/utils";
import { useDashboardData } from "../../context/DashboardDataContext";
import type { CareerItem, CareerStatus } from "../../types/dashboard";

const statusOptions: CareerStatus[] = [
  "Preparing",
  "Submitted",
  "Interview",
  "Completed",
  "Rejected",
];

const DAY_MS = 1000 * 60 * 60 * 24;

const getDdayInfo = (deadline: string) => {
  if (!deadline) {
    return {
      label: "No deadline",
      tone: "neutral",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${deadline}T00:00:00`);
  dueDate.setHours(0, 0, 0, 0);

  const diff = Math.ceil((dueDate.getTime() - today.getTime()) / DAY_MS);

  if (diff < 0) {
    return {
      label: `D+${Math.abs(diff)}`,
      tone: "closed",
    };
  }

  if (diff === 0) {
    return {
      label: "D-Day",
      tone: "urgent",
    };
  }

  if (diff <= 3) {
    return {
      label: `D-${diff}`,
      tone: "urgent",
    };
  }

  if (diff <= 7) {
    return {
      label: `D-${diff}`,
      tone: "soon",
    };
  }

  return {
    label: `D-${diff}`,
    tone: "normal",
  };
};

const getDeadlineDate = (app: CareerItem) => {
  return app.applicationEndDate || app.deadline;
};

const getStatusRank = (status: CareerStatus) => {
  if (status === "Interview") return 0;
  if (status === "Submitted") return 1;
  if (status === "Preparing") return 2;
  if (status === "Completed") return 4;
  if (status === "Rejected") return 5;

  return 3;
};

const getDeadlineRank = (app: CareerItem) => {
  const deadline = getDeadlineDate(app);

  if (!deadline) return 999999;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${deadline}T00:00:00`);
  dueDate.setHours(0, 0, 0, 0);

  return Math.ceil((dueDate.getTime() - today.getTime()) / DAY_MS);
};

const sortApplications = (apps: CareerItem[]) => {
  return [...apps].sort((a, b) => {
    const aStatusRank = getStatusRank(a.status);
    const bStatusRank = getStatusRank(b.status);

    if (aStatusRank !== bStatusRank) {
      return aStatusRank - bStatusRank;
    }

    const aDeadlineRank = getDeadlineRank(a);
    const bDeadlineRank = getDeadlineRank(b);

    const aPassed = aDeadlineRank < 0;
    const bPassed = bDeadlineRank < 0;

    if (aPassed !== bPassed) {
      return aPassed ? 1 : -1;
    }

    return aDeadlineRank - bDeadlineRank;
  });
};

export const CareerWidget = () => {
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    careerApplications,
    addCareerApplication,
    updateCareerApplication,
    removeCareerApplication,
  } = useDashboardData();

  const applications = useMemo(
    () => sortApplications(careerApplications),
    [careerApplications]
  );

  const selectedApp = selectedId
    ? careerApplications.find((app) => app.id === selectedId) ?? null
    : null;

  const updateApplication = <K extends keyof CareerItem>(
    id: string,
    key: K,
    value: CareerItem[K]
  ) => {
    updateCareerApplication(id, {
      [key]: value,
    } as Partial<CareerItem>);
  };

  const addApplication = () => {
    const newItem = addCareerApplication();

    setSelectedId(newItem.id);
    setEditing(true);
  };

  const removeApplication = (id: string) => {
    removeCareerApplication(id);

    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const addQuestion = (id: string) => {
    const app = careerApplications.find((item) => item.id === id);
    if (!app) return;

    updateCareerApplication(id, {
      coverLetterQuestions: [...app.coverLetterQuestions, ""],
    });
  };

  const updateQuestion = (id: string, index: number, value: string) => {
    const app = careerApplications.find((item) => item.id === id);
    if (!app) return;

    const next = [...app.coverLetterQuestions];
    next[index] = value;

    updateCareerApplication(id, {
      coverLetterQuestions: next,
    });
  };

  const removeQuestion = (id: string, index: number) => {
    const app = careerApplications.find((item) => item.id === id);
    if (!app) return;

    updateCareerApplication(id, {
      coverLetterQuestions: app.coverLetterQuestions.filter(
        (_, i) => i !== index
      ),
    });
  };

  const openPostingUrl = (url: string) => {
    if (!url.trim()) return;

    const safeUrl =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;

    window.open(safeUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <GlassCard
        title="Career Command Center"
        subtitle={`${applications.length} active applications`}
        icon={<BriefcaseBusiness className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={addApplication}
              className="h-8 w-8 rounded-full bg-white/35 border border-white/50 flex items-center justify-center hover:bg-white/55 transition"
              title="Add application"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setEditing((prev) => !prev)}
              className={cn(
                "h-8 px-3 rounded-full text-xs border transition flex items-center gap-1.5",
                editing
                  ? "bg-foreground text-background border-foreground"
                  : "bg-white/35 border-white/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {editing ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Pencil className="w-3.5 h-3.5" />
              )}
              {editing ? "Done" : "Edit"}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          {applications.map((app) => {
            const deadlineDate = getDeadlineDate(app);
            const dday = getDdayInfo(deadlineDate);

            return (
              <article
                key={app.id}
                onClick={() => setSelectedId(app.id)}
                className={cn(
                  "career-list-item",
                  dday.tone === "urgent" && "is-urgent",
                  dday.tone === "soon" && "is-soon",
                  dday.tone === "closed" && "is-closed"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold truncate">
                      {app.company || "Untitled Company"}
                    </div>

                    <span className={`career-status-pill status-${app.status.toLowerCase()}`}>
                      {app.status}
                    </span>
                    {deadlineDate && (
                      <span className={`career-dday-pill ${dday.tone}`}>
                        {dday.label}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {app.role || "Position"}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                    {app.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {app.location}
                      </span>
                    )}

                    {deadlineDate && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        {deadlineDate}
                      </span>
                    )}
                  </div>
                </div>

                {editing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeApplication(app.id);
                    }}
                    className="career-delete-button"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </GlassCard>

      {selectedApp && (
        <div className="career-modal-backdrop">
          <div className="career-modal-window">
            <div className="career-modal-header">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Building2 className="w-3.5 h-3.5" />
                  Career Detail
                </div>

                <div className="text-xl font-semibold truncate">
                  {selectedApp.company || "Untitled Company"}
                </div>

                <div className="text-sm text-muted-foreground truncate mt-1">
                  {selectedApp.role || "Position"}
                </div>

                {getDeadlineDate(selectedApp) && (
                  <div className="mt-3">
                    <span
                      className={`career-dday-pill large ${
                        getDdayInfo(getDeadlineDate(selectedApp)).tone
                      }`}
                    >
                      {getDdayInfo(getDeadlineDate(selectedApp)).label}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing((prev) => !prev)}
                  className={cn(
                    "h-8 px-3 rounded-full text-xs border transition flex items-center gap-1.5",
                    editing
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white/35 border-white/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {editing ? "Done" : "Edit"}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="h-8 w-8 rounded-full bg-white/35 border border-white/50 flex items-center justify-center hover:bg-white/55 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="career-modal-body">
              <section className="career-detail-section">
                <div className="career-section-title">Basic Info</div>

                <div className="career-detail-grid">
                  <label className="career-field">
                    <span>Company</span>
                    {editing ? (
                      <input
                        value={selectedApp.company}
                        onChange={(e) =>
                          updateApplication(
                            selectedApp.id,
                            "company",
                            e.target.value
                          )
                        }
                        spellCheck={false}
                      />
                    ) : (
                      <div>{selectedApp.company || "-"}</div>
                    )}
                  </label>

                  <label className="career-field">
                    <span>Position</span>
                    {editing ? (
                      <input
                        value={selectedApp.role}
                        onChange={(e) =>
                          updateApplication(
                            selectedApp.id,
                            "role",
                            e.target.value
                          )
                        }
                        spellCheck={false}
                      />
                    ) : (
                      <div>{selectedApp.role || "-"}</div>
                    )}
                  </label>

                  <label className="career-field">
                    <span>Status</span>
                    {editing ? (
                      <select
                        value={selectedApp.status}
                        onChange={(e) =>
                          updateApplication(
                            selectedApp.id,
                            "status",
                            e.target.value as CareerStatus
                          )
                        }
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div>{selectedApp.status}</div>
                    )}
                  </label>

                  <label className="career-field">
                    <span>Location</span>
                    {editing ? (
                      <input
                        value={selectedApp.location}
                        onChange={(e) =>
                          updateApplication(
                            selectedApp.id,
                            "location",
                            e.target.value
                          )
                        }
                        spellCheck={false}
                        placeholder="Seoul / Remote / Hybrid"
                      />
                    ) : (
                      <div>{selectedApp.location || "-"}</div>
                    )}
                  </label>

                  <label className="career-field">
                    <span>Work Type</span>
                    {editing ? (
                      <input
                        value={selectedApp.workType}
                        onChange={(e) =>
                          updateApplication(
                            selectedApp.id,
                            "workType",
                            e.target.value
                          )
                        }
                        spellCheck={false}
                        placeholder="Full-time / Intern / Contract"
                      />
                    ) : (
                      <div>{selectedApp.workType || "-"}</div>
                    )}
                  </label>
                </div>
              </section>

              <section className="career-detail-section">
                <div className="career-section-title">Application Window</div>

                <div className="career-detail-grid">
                  <label className="career-field">
                    <span>Start Date</span>
                    {editing ? (
                      <input
                        type="date"
                        value={selectedApp.applicationStartDate}
                        onChange={(e) =>
                          updateApplication(
                            selectedApp.id,
                            "applicationStartDate",
                            e.target.value
                          )
                        }
                      />
                    ) : (
                      <div>{selectedApp.applicationStartDate || "-"}</div>
                    )}
                  </label>

                  <label className="career-field">
                    <span>Start Time</span>
                    {editing ? (
                      <input
                        type="time"
                        value={selectedApp.applicationStartTime}
                        onChange={(e) =>
                          updateApplication(
                            selectedApp.id,
                            "applicationStartTime",
                            e.target.value
                          )
                        }
                      />
                    ) : (
                      <div>{selectedApp.applicationStartTime || "-"}</div>
                    )}
                  </label>

                  <label className="career-field">
                    <span>End Date</span>
                    {editing ? (
                      <input
                        type="date"
                        value={selectedApp.applicationEndDate}
                        onChange={(e) =>
                          updateApplication(
                            selectedApp.id,
                            "applicationEndDate",
                            e.target.value
                          )
                        }
                      />
                    ) : (
                      <div>{selectedApp.applicationEndDate || "-"}</div>
                    )}
                  </label>

                  <label className="career-field">
                    <span>End Time</span>
                    {editing ? (
                      <input
                        type="time"
                        value={selectedApp.applicationEndTime}
                        onChange={(e) =>
                          updateApplication(
                            selectedApp.id,
                            "applicationEndTime",
                            e.target.value
                          )
                        }
                      />
                    ) : (
                      <div>{selectedApp.applicationEndTime || "-"}</div>
                    )}
                  </label>
                </div>

                <div className="career-sync-hint">
                  Calendar title:{" "}
                  <strong>
                    {selectedApp.company || "Company"} · Application Window
                  </strong>
                </div>
              </section>

              <section className="career-detail-section">
                <div className="career-section-title">Posting Link</div>

                {editing ? (
                  <div className="career-link-row">
                    <Link className="w-4 h-4 text-muted-foreground" />
                    <input
                      value={selectedApp.postingUrl}
                      onChange={(e) =>
                        updateApplication(
                          selectedApp.id,
                          "postingUrl",
                          e.target.value
                        )
                      }
                      spellCheck={false}
                      placeholder="https://..."
                    />
                  </div>
                ) : selectedApp.postingUrl ? (
                  <button
                    type="button"
                    onClick={() => openPostingUrl(selectedApp.postingUrl)}
                    className="career-open-link-button"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open posting link
                  </button>
                ) : (
                  <div className="career-empty-text">No link saved.</div>
                )}
              </section>

              <section className="career-detail-section">
                <div className="career-section-title">Job Description</div>

                {editing ? (
                  <textarea
                    value={selectedApp.jobDescription}
                    onChange={(e) =>
                      updateApplication(
                        selectedApp.id,
                        "jobDescription",
                        e.target.value
                      )
                    }
                    spellCheck={false}
                    placeholder="공고 내용, 주요 업무, 자격요건 등을 붙여넣기"
                    className="career-textarea"
                  />
                ) : (
                  <div className="career-rich-text">
                    {selectedApp.jobDescription || "No job description yet."}
                  </div>
                )}
              </section>

              <section className="career-detail-section">
                <div className="career-section-title-row">
                  <div className="career-section-title">
                    Cover Letter Questions
                  </div>

                  {editing && (
                    <button
                      type="button"
                      onClick={() => addQuestion(selectedApp.id)}
                      className="career-small-button"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {selectedApp.coverLetterQuestions.length === 0 && (
                    <div className="career-empty-text">
                      No questions saved.
                    </div>
                  )}

                  {selectedApp.coverLetterQuestions.map((question, index) => (
                    <div key={index} className="career-question-item">
                      {editing ? (
                        <>
                          <textarea
                            value={question}
                            onChange={(e) =>
                              updateQuestion(
                                selectedApp.id,
                                index,
                                e.target.value
                              )
                            }
                            spellCheck={false}
                            placeholder={`${index + 1}. 자소서 항목`}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeQuestion(selectedApp.id, index)
                            }
                            className="career-question-delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div>
                          <span className="text-muted-foreground mr-2">
                            {index + 1}.
                          </span>
                          {question}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="career-detail-section">
                <div className="career-section-title">Notes</div>

                {editing ? (
                  <textarea
                    value={selectedApp.notes}
                    onChange={(e) =>
                      updateApplication(
                        selectedApp.id,
                        "notes",
                        e.target.value
                      )
                    }
                    spellCheck={false}
                    placeholder="준비 메모, 내 경험 매칭, 제출 전 체크리스트 등"
                    className="career-textarea"
                  />
                ) : (
                  <div className="career-rich-text">
                    {selectedApp.notes || "No notes yet."}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
};