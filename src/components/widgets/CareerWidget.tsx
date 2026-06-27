import { createPortal } from "react-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  ExternalLink,
  FileText,
  GripHorizontal,
  Link2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { useDashboardData } from "../../context/DashboardDataContext";
import type {
  CareerItem,
  CareerStatus,
  CoverLetterItem,
  CoverLetterStatus,
} from "../../types/dashboard";

type CareerWindowState = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DragState = {
  type: "move" | "resize";
  startX: number;
  startY: number;
  startWindow: CareerWindowState;
};

const statusOptions: CareerStatus[] = [
  "Saved",
  "Preparing",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Completed",
];

const coverLetterStatusOptions: CoverLetterStatus[] = [
  "todo",
  "drafting",
  "done",
];

const getInitialWindowState = (): CareerWindowState => {
  if (typeof window === "undefined") {
    return {
      x: 120,
      y: 80,
      width: 920,
      height: 760,
    };
  }

  const width = Math.min(920, window.innerWidth - 32);
  const height = Math.min(760, window.innerHeight - 32);

  return {
    x: Math.max(16, Math.round((window.innerWidth - width) / 2)),
    y: Math.max(16, Math.round((window.innerHeight - height) / 2)),
    width,
    height,
  };
};

const clampWindow = (state: CareerWindowState): CareerWindowState => {
  if (typeof window === "undefined") return state;

  const minWidth = Math.min(540, window.innerWidth - 24);
  const minHeight = Math.min(520, window.innerHeight - 24);

  const width = Math.max(
    minWidth,
    Math.min(state.width, window.innerWidth - 24)
  );
  const height = Math.max(
    minHeight,
    Math.min(state.height, window.innerHeight - 24)
  );

  return {
    width,
    height,
    x: Math.max(12, Math.min(state.x, window.innerWidth - width - 12)),
    y: Math.max(12, Math.min(state.y, window.innerHeight - height - 12)),
  };
};

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDday = (date: string) => {
  if (!date) return null;

  const today = new Date(`${getToday()}T00:00:00`);
  const target = new Date(`${date}T00:00:00`);

  return Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
};

const getDdayLabel = (date: string) => {
  const diff = getDday(date);

  if (diff === null) return "No date";
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;

  return `D+${Math.abs(diff)}`;
};

const getDdayTone = (date: string) => {
  const diff = getDday(date);

  if (diff === null) return "none";
  if (diff < 0) return "closed";
  if (diff <= 1) return "urgent";
  if (diff <= 5) return "soon";

  return "normal";
};

const normalizeCareer = (item: CareerItem): CareerItem => ({
  ...item,
  company: item.company ?? "New Company",
  role: item.role ?? "New Position",
  status: item.status ?? "Preparing",
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

const formatApplicationWindow = (item: CareerItem) => {
  if (!item.applicationStartDate && !item.applicationEndDate) {
    return "지원기간 미입력";
  }

  const startDate = item.applicationStartDate || item.applicationEndDate;
  const endDate = item.applicationEndDate || item.applicationStartDate;

  return `${startDate} ${item.applicationStartTime || "09:00"} → ${endDate} ${
    item.applicationEndTime || "23:59"
  }`;
};

export const CareerWidget = () => {
  const {
    careerApplications,
    addCareerApplication,
    updateCareerApplication,
    removeCareerApplication,
  } = useDashboardData();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [optimisticSelectedItem, setOptimisticSelectedItem] =
    useState<CareerItem | null>(null);
  const [windowState, setWindowState] = useState<CareerWindowState>(() =>
    getInitialWindowState()
  );

  const dragRef = useRef<DragState | null>(null);

  const normalizedItems = useMemo(
    () => careerApplications.map(normalizeCareer),
    [careerApplications]
  );

  const selectedFromContext = useMemo(() => {
    if (!selectedId) return null;

    return normalizedItems.find((item) => item.id === selectedId) ?? null;
  }, [normalizedItems, selectedId]);

  const selectedItem =
    selectedFromContext ??
    (optimisticSelectedItem?.id === selectedId ? optimisticSelectedItem : null);

  useEffect(() => {
    if (selectedFromContext) {
      setOptimisticSelectedItem(null);
    }
  }, [selectedFromContext]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragRef.current) return;

      const { type, startX, startY, startWindow } = dragRef.current;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      if (type === "move") {
        setWindowState(
          clampWindow({
            ...startWindow,
            x: startWindow.x + dx,
            y: startWindow.y + dy,
          })
        );

        return;
      }

      setWindowState(
        clampWindow({
          ...startWindow,
          width: startWindow.width + dx,
          height: startWindow.height + dy,
        })
      );
    };

    const handlePointerUp = () => {
      dragRef.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const sortedItems = useMemo(() => {
    return [...normalizedItems].sort((a, b) => {
      const aTone = getDdayTone(a.deadline);
      const bTone = getDdayTone(b.deadline);

      const toneScore = (tone: string) => {
        if (tone === "urgent") return 4;
        if (tone === "soon") return 3;
        if (tone === "normal") return 2;
        if (tone === "closed") return 1;
        return 0;
      };

      return toneScore(bTone) - toneScore(aTone);
    });
  }, [normalizedItems]);

  const summary = useMemo(() => {
    const preparing = normalizedItems.filter(
      (item) => item.status === "Preparing"
    ).length;

    const applied = normalizedItems.filter(
      (item) => item.status === "Applied"
    ).length;

    const interviews = normalizedItems.filter(
      (item) => item.status === "Interview"
    ).length;

    const urgent = normalizedItems.filter((item) =>
      ["urgent", "soon"].includes(getDdayTone(item.deadline))
    ).length;

    return {
      total: normalizedItems.length,
      preparing,
      applied,
      interviews,
      urgent,
    };
  }, [normalizedItems]);

  const openCareerWindow = (item: CareerItem) => {
    setSelectedId(item.id);
    setOptimisticSelectedItem(null);
    setWindowState(clampWindow(getInitialWindowState()));
  };

  const addCareerItem = () => {
    const next = normalizeCareer(addCareerApplication());

    setOptimisticSelectedItem(next);
    setSelectedId(next.id);
    setWindowState(clampWindow(getInitialWindowState()));

    updateCareerApplication(next.id, {
      company: next.company || "New Company",
      role: next.role || "New Position",
      status: next.status || "Preparing",
      postingUrl: next.postingUrl || "",
      jobDescription: next.jobDescription || "",
      applicationStartTime: next.applicationStartTime || "09:00",
      applicationEndTime: next.applicationEndTime || "23:59",
    });
  };

  const updateSelectedItem = (patch: Partial<CareerItem>) => {
    if (!selectedItem) return;

    const nextItem = normalizeCareer({
      ...selectedItem,
      ...patch,
    });

    setOptimisticSelectedItem(nextItem);
    updateCareerApplication(selectedItem.id, patch);
  };

  const deleteCareerItem = (id: string) => {
    removeCareerApplication(id);

    if (selectedId === id) {
      setSelectedId(null);
      setOptimisticSelectedItem(null);
    }
  };

  const startWindowMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    dragRef.current = {
      type: "move",
      startX: event.clientX,
      startY: event.clientY,
      startWindow: windowState,
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  };

  const startWindowResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation();

    dragRef.current = {
      type: "resize",
      startX: event.clientX,
      startY: event.clientY,
      startWindow: windowState,
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "nwse-resize";
  };

const getCoverLetterItems = (item: CareerItem): CoverLetterItem[] => {
  if (item.coverLetterItems && item.coverLetterItems.length > 0) {
    return item.coverLetterItems.map((coverItem) => ({
      id: coverItem.id,
      question: coverItem.question ?? "",
      status: coverItem.status ?? "todo",
      answer: coverItem.answer ?? "",
      strategy: coverItem.strategy ?? coverItem.memo ?? "",
      memo: coverItem.memo ?? coverItem.strategy ?? "",
    }));
  }

  return (item.coverLetterQuestions ?? []).map((question, index) => ({
    id: `legacy-question-${index}`,
    question,
    status: "todo",
    answer: "",
    strategy: "",
    memo: "",
  }));
};

const updateCoverLetterItem = (
  itemId: string,
  patch: Partial<CoverLetterItem>
) => {
  if (!selectedItem) return;

  const currentItems = getCoverLetterItems(selectedItem);

  const nextItems = currentItems.map((item) =>
    item.id === itemId
      ? {
          ...item,
          ...patch,
          memo: patch.strategy ?? patch.memo ?? item.memo ?? "",
        }
      : item
  );

  updateSelectedItem({
    coverLetterItems: nextItems,
    coverLetterQuestions: nextItems.map((item) => item.question),
  });
};

const addCoverLetterItem = () => {
  if (!selectedItem) return;

  const currentItems = getCoverLetterItems(selectedItem);

  const nextItems: CoverLetterItem[] = [
    ...currentItems,
    {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `cl-${Date.now()}`,
      question: "",
      status: "todo",
      answer: "",
      strategy: "",
      memo: "",
    },
  ];

  updateSelectedItem({
    coverLetterItems: nextItems,
    coverLetterQuestions: nextItems.map((item) => item.question),
  });
};

const removeCoverLetterItem = (itemId: string) => {
  if (!selectedItem) return;

  const nextItems = getCoverLetterItems(selectedItem).filter(
    (item) => item.id !== itemId
  );

  updateSelectedItem({
    coverLetterItems: nextItems,
    coverLetterQuestions: nextItems.map((item) => item.question),
  });
};

  return (
    <>
      <section className="glass-card career-widget">
        <div className="career-widget-header">
          <div className="career-widget-title-wrap">
            <div className="glass-card-icon">
              <BriefcaseBusiness className="w-4 h-4" />
            </div>

            <div>
              <h3>Career</h3>
              <p>
                {summary.total} applications · {summary.urgent} urgent
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={addCareerItem}
            className="career-icon-button"
            title="Add application"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="career-summary-grid">
          <div className="career-summary-card">
            <strong>{summary.preparing}</strong>
            <span>Preparing</span>
          </div>

          <div className="career-summary-card">
            <strong>{summary.applied}</strong>
            <span>Applied</span>
          </div>

          <div className="career-summary-card">
            <strong>{summary.interviews}</strong>
            <span>Interview</span>
          </div>
        </div>

        <div className="career-list">
          {sortedItems.length === 0 ? (
            <div className="career-empty-box">
              아직 지원 회사가 없어. + 눌러서 추가해.
            </div>
          ) : (
            sortedItems.map((item) => {
              const ddayTone = getDdayTone(item.deadline);

              return (
                <article
                  key={item.id}
                  className={[
                    "career-list-item",
                    ddayTone === "urgent" ? "is-urgent" : "",
                    ddayTone === "soon" ? "is-soon" : "",
                    ddayTone === "closed" ? "is-closed" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => openCareerWindow(item)}
                >
                  <div className="career-list-main">
                    <div className="career-list-title-row">
                      <div className="career-list-title">
                        <strong>{item.company}</strong>
                        <span>{item.role}</span>
                      </div>
                    </div>

                    <div className="career-list-meta">
                      <span
                        className={`career-status-pill status-${item.status.toLowerCase()}`}
                      >
                        {item.status}
                      </span>

                      {item.postingUrl && (
                        <span>
                          <Link2 className="w-3 h-3" />
                          Posting
                        </span>
                      )}

                      <span>
                        <FileText className="w-3 h-3" />
                        CL {(item.coverLetterQuestions ?? []).length}
                      </span>

                      <span>
                        <CalendarDays className="w-3 h-3" />
                        {item.applicationEndDate ? "Synced" : "No date"}
                      </span>
                    </div>
                  </div>

                  <div className="career-list-side">
                    <span className={`career-dday-pill ${ddayTone}`}>
                      {getDdayLabel(item.deadline)}
                    </span>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteCareerItem(item.id);
                      }}
                      className="career-delete-button"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {selectedItem &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="career-floating-layer"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              pointerEvents: "none",
            }}
          >
            <div
              className="career-floating-window"
              style={{
                position: "fixed",
                left: windowState.x,
                top: windowState.y,
                width: windowState.width,
                height: windowState.height,
                minWidth: 540,
                minHeight: 520,
                display: "grid",
                gridTemplateRows: "auto minmax(0, 1fr)",
                overflow: "hidden",
                pointerEvents: "auto",
              }}
            >
              <div
                className="career-floating-titlebar"
                onPointerDown={startWindowMove}
                style={{
                  minHeight: 72,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  cursor: "grab",
                  userSelect: "none",
                }}
              >
                <div className="career-floating-title">
                  <GripHorizontal className="w-4 h-4" />

                  <div>
                    <div className="career-modal-kicker">Career Detail</div>
                    <h2>{selectedItem.company || "New Company"}</h2>
                    <p>{selectedItem.role || "New Position"}</p>
                  </div>
                </div>

                <div className="career-modal-actions">
                  {selectedItem.postingUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          selectedItem.postingUrl,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      className="career-small-button"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Posting
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(null);
                      setOptimisticSelectedItem(null);
                    }}
                    className="career-icon-button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                className="career-floating-body"
                style={{
                  minHeight: 0,
                  overflow: "auto",
                  padding: 18,
                  display: "grid",
                  alignContent: "start",
                  gap: 16,
                }}
              >
                <section className="career-detail-section">
                  <div className="career-section-title">Application Core</div>

                  <div className="career-detail-grid">
                    <label className="career-field">
                      <span>Company</span>
                      <input
                        value={selectedItem.company}
                        onChange={(event) =>
                          updateSelectedItem({
                            company: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="career-field">
                      <span>Role</span>
                      <input
                        value={selectedItem.role}
                        onChange={(event) =>
                          updateSelectedItem({
                            role: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="career-field">
                      <span>Status</span>
                      <select
                        value={selectedItem.status}
                        onChange={(event) =>
                          updateSelectedItem({
                            status: event.target.value as CareerStatus,
                          })
                        }
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="career-field">
                      <span>Deadline</span>
                      <input
                        type="date"
                        value={selectedItem.deadline}
                        onChange={(event) =>
                          updateSelectedItem({
                            deadline: event.target.value,
                            applicationEndDate: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="career-field career-field-wide">
                      <span>Posting URL</span>
                      <input
                        value={selectedItem.postingUrl}
                        onChange={(event) =>
                          updateSelectedItem({
                            postingUrl: event.target.value,
                          })
                        }
                        placeholder="https://..."
                      />
                    </label>

                    <label className="career-field career-field-wide">
                      <span>Job Posting / 공고 주요 내용</span>
                      <textarea
                        value={selectedItem.jobDescription}
                        onChange={(event) =>
                          updateSelectedItem({
                            jobDescription: event.target.value,
                          })
                        }
                        className="career-textarea"
                        placeholder="공고 주요 내용, 우대사항, 필요 역량, 직무 키워드..."
                      />
                    </label>
                  </div>
                </section>

                <section className="career-detail-section">
                  <div className="career-section-title">
                    Application Window · Calendar Sync
                  </div>

                  <div className="career-sync-note">
                    End Date 또는 Start Date를 입력하면 Calendar에{" "}
                    <strong>
                      {selectedItem.company || "Company"} · Application Window
                    </strong>
                    로 자동 생성돼.
                  </div>

                  <div className="career-detail-grid">
                    <label className="career-field">
                      <span>Start Date</span>
                      <input
                        type="date"
                        value={selectedItem.applicationStartDate}
                        onChange={(event) =>
                          updateSelectedItem({
                            applicationStartDate: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="career-field">
                      <span>Start Time</span>
                      <input
                        type="time"
                        value={selectedItem.applicationStartTime}
                        onChange={(event) =>
                          updateSelectedItem({
                            applicationStartTime: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="career-field">
                      <span>End Date</span>
                      <input
                        type="date"
                        value={selectedItem.applicationEndDate}
                        onChange={(event) =>
                          updateSelectedItem({
                            applicationEndDate: event.target.value,
                            deadline: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="career-field">
                      <span>End Time</span>
                      <input
                        type="time"
                        value={selectedItem.applicationEndTime}
                        onChange={(event) =>
                          updateSelectedItem({
                            applicationEndTime: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="career-field">
                      <span>Location</span>
                      <input
                        value={selectedItem.location}
                        onChange={(event) =>
                          updateSelectedItem({
                            location: event.target.value,
                          })
                        }
                        placeholder="Seoul, Remote..."
                      />
                    </label>

                    <label className="career-field">
                      <span>Work Type</span>
                      <input
                        value={selectedItem.workType}
                        onChange={(event) =>
                          updateSelectedItem({
                            workType: event.target.value,
                          })
                        }
                        placeholder="신입 / 인턴 / 정규직..."
                      />
                    </label>
                  </div>

                  <div className="career-window-preview">
                    <CalendarDays className="w-4 h-4" />
                    {formatApplicationWindow(selectedItem)}
                  </div>
                </section>

                <section className="career-detail-section career-cover-section">
                  <div className="career-section-row">
                    <div>
                      <div className="career-section-title">Cover Letter Questions</div>
                        <p className="career-section-subtitle">
                          질문은 가로로 길게 보고, 답변과 전략은 바로 아래에서 작성.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={addCoverLetterItem}
                        className="career-small-button"
                      >
                      <Plus className="w-3.5 h-3.5" />
                        Add Question
                      </button>
                    </div>

                    <div className="career-cover-wide-list">
                      {getCoverLetterItems(selectedItem).length === 0 ? (
                        <div className="career-empty-box">
                          아직 자소서 문항이 없어.
                        </div>
                    ) : (
                        getCoverLetterItems(selectedItem).map((item, index) => (
                          <article key={item.id} className="career-cover-wide-row">
                            <div className="career-cover-question-line">
                              <FileText className="career-cover-icon" />

                              <input
                                value={item.question}
                                onChange={(event) =>
                                  updateCoverLetterItem(item.id, {
                                    question: event.target.value,
                                  })
                                }
                                className="career-cover-question-input"
                                placeholder={`${index + 1}. 자소서 문항 입력`}
                              />

                              <select
                                value={item.status}
                                onChange={(event) =>
                                  updateCoverLetterItem(item.id, {
                                    status: event.target.value as CoverLetterStatus,
                                  })
                                }
                                className="career-cover-status-select"
                              >
                                {coverLetterStatusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => removeCoverLetterItem(item.id)}
                                className="career-delete-button"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

          <div className="career-cover-writing-line">
            <label>
              <span>Answer</span>
              <textarea
                value={item.answer ?? ""}
                onChange={(event) =>
                  updateCoverLetterItem(item.id, {
                    answer: event.target.value,
                  })
                }
                className="career-cover-answer-textarea"
                placeholder="여기에 실제 답변 초안 작성"
              />
            </label>

            <label>
              <span>Strategy</span>
              <textarea
                value={item.strategy ?? item.memo ?? ""}
                onChange={(event) =>
                  updateCoverLetterItem(item.id, {
                    strategy: event.target.value,
                    memo: event.target.value,
                  })
                }
                className="career-cover-strategy-textarea"
                placeholder="키워드, 구조, 강조할 경험, 분량 전략"
              />
            </label>
          </div>
        </article>
      ))
    )}
  </div>
</section>

                <section className="career-detail-section">
                  <div className="career-section-title">Notes</div>

                  <textarea
                    value={selectedItem.notes}
                    onChange={(event) =>
                      updateSelectedItem({
                        notes: event.target.value,
                      })
                    }
                    className="career-textarea career-notes-textarea"
                    placeholder="지원 전략, 자소서 방향, 면접 준비 메모..."
                  />
                </section>

                <div className="career-detail-danger-row">
                  <button
                    type="button"
                    onClick={() => {
                      deleteCareerItem(selectedItem.id);
                    }}
                    className="career-danger-button"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete application
                  </button>
                </div>
              </div>

              <div
                className="career-window-resize-handle"
                onPointerDown={startWindowResize}
                style={{
                  position: "absolute",
                  right: 8,
                  bottom: 8,
                  width: 24,
                  height: 24,
                  cursor: "nwse-resize",
                }}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
