import { createPortal } from "react-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  ExternalLink,
  FileText,
  GripHorizontal,
  LayoutGrid,
  Link2,
  List,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  FormEvent as ReactFormEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

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

type CareerViewMode = "list" | "board";

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

const getCoverLetterStatusLabel = (status: CoverLetterStatus) => {
  if (status === "todo") return "To do";
  if (status === "drafting") return "Drafting";
  if (status === "done") return "Done";

  return status;
};

const createCoverLetterId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `cl-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const countWithSpaces = (value = "") => {
  return value.length;
};

const parseAnswerLimit = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) return undefined;

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed < 0) return undefined;

  return Math.floor(parsed);
};

const autoGrowTextarea = (element: HTMLTextAreaElement | null) => {
  if (!element) return;

  element.style.height = "auto";
  element.style.height = `${Math.max(element.scrollHeight, 42)}px`;
};

const handleAutoGrowTextarea = (
  event: ReactFormEvent<HTMLTextAreaElement>
) => {
  autoGrowTextarea(event.currentTarget);
};

const getInitialWindowState = (): CareerWindowState => {
  if (typeof window === "undefined") {
    return {
      x: 120,
      y: 80,
      width: 960,
      height: 780,
    };
  }

  const width = Math.min(960, window.innerWidth - 32);
  const height = Math.min(780, window.innerHeight - 32);

  return {
    x: Math.max(16, Math.round((window.innerWidth - width) / 2)),
    y: Math.max(16, Math.round((window.innerHeight - height) / 2)),
    width,
    height,
  };
};

const clampWindow = (state: CareerWindowState): CareerWindowState => {
  if (typeof window === "undefined") return state;

  const minWidth = Math.min(560, window.innerWidth - 24);
  const minHeight = Math.min(540, window.innerHeight - 24);

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
  coverLetterItems: item.coverLetterItems ?? [],
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
    activeCareerDetailId,
    openCareerDetail,
    closeCareerDetail,
    addCareerApplication,
    updateCareerApplication,
    removeCareerApplication,
  } = useDashboardData();

  const [optimisticSelectedItem, setOptimisticSelectedItem] =
    useState<CareerItem | null>(null);
  const [viewMode, setViewMode] = useState<CareerViewMode>("list");
  const [statusFilter, setStatusFilter] = useState<CareerStatus | "All">("All");

  const [windowState, setWindowState] = useState<CareerWindowState>(() =>
    getInitialWindowState()
  );

  const dragRef = useRef<DragState | null>(null);

  const normalizedItems = useMemo(
    () => careerApplications.map(normalizeCareer),
    [careerApplications]
  );

  const selectedFromContext = useMemo(() => {
    if (!activeCareerDetailId) return null;

    return (
      normalizedItems.find((item) => item.id === activeCareerDetailId) ?? null
    );
  }, [normalizedItems, activeCareerDetailId]);

  const selectedItem =
    selectedFromContext ??
    (optimisticSelectedItem?.id === activeCareerDetailId
      ? optimisticSelectedItem
      : null);

  useEffect(() => {
    if (selectedFromContext) {
      setOptimisticSelectedItem(null);
    }
  }, [selectedFromContext]);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      document
        .querySelectorAll<HTMLTextAreaElement>(".career-auto-textarea")
        .forEach((textarea) => autoGrowTextarea(textarea));
    });
  }, [selectedItem?.id, selectedItem?.coverLetterItems]);

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

  const filteredItems = useMemo(() => {
    if (statusFilter === "All") return sortedItems;

    return sortedItems.filter((item) => item.status === statusFilter);
  }, [sortedItems, statusFilter]);

  const boardColumns = useMemo(() => {
    return statusOptions
      .map((status) => ({
        status,
        items: filteredItems.filter((item) => item.status === status),
      }))
      .filter((column) => statusFilter === "All" || column.status === statusFilter);
  }, [filteredItems, statusFilter]);

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
    setOptimisticSelectedItem(null);
    setWindowState(clampWindow(getInitialWindowState()));
    openCareerDetail(item.id);
  };

  const addCareerItem = () => {
    const next = normalizeCareer(
      addCareerApplication({
        company: "New Company",
        role: "New Position",
        status: "Preparing",
        postingUrl: "",
        jobDescription: "",
        applicationStartTime: "09:00",
        applicationEndTime: "23:59",
        coverLetterItems: [],
        coverLetterQuestions: [],
      })
    );

    setOptimisticSelectedItem(next);
    setWindowState(clampWindow(getInitialWindowState()));
    openCareerDetail(next.id);
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

    if (activeCareerDetailId === id) {
      setOptimisticSelectedItem(null);
      closeCareerDetail();
    }
  };

  const closeWindow = () => {
    setOptimisticSelectedItem(null);
    closeCareerDetail();
  };

  const startWindowMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;

    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("select") ||
      target.closest("a")
    ) {
      return;
    }

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
        answerLimit: coverItem.answerLimit,
      }));
    }

    return (item.coverLetterQuestions ?? []).map((question, index) => ({
      id: `legacy-question-${index}`,
      question,
      status: "todo",
      answer: "",
      strategy: "",
      memo: "",
      answerLimit: undefined,
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
        id: createCoverLetterId(),
        question: "",
        status: "todo",
        answer: "",
        strategy: "",
        memo: "",
        answerLimit: undefined,
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

  const renderCareerCard = (item: CareerItem, compact = false) => {
    const ddayTone = getDdayTone(item.deadline);
    const coverLetterCount =
      item.coverLetterItems?.length ?? item.coverLetterQuestions?.length ?? 0;

    return (
      <article
        key={item.id}
        className={[
          compact ? "career-board-card" : "career-list-item",
          ddayTone === "urgent" ? "is-urgent" : "",
          ddayTone === "soon" ? "is-soon" : "",
          ddayTone === "closed" ? "is-closed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => openCareerWindow(item)}
      >
        <div className="career-list-top">
          <div className="career-list-main">
            <div className="career-list-title-row">
              <div className="career-list-title">
                <strong>{item.company}</strong>
                <span>{item.role}</span>
              </div>
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
        </div>

        <div className="career-list-meta">
          <span className={`career-status-pill status-${item.status.toLowerCase()}`}>
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
            CL {coverLetterCount}
          </span>

          <span>
            <CalendarDays className="w-3 h-3" />
            {item.applicationEndDate ? "Synced" : "No date"}
          </span>
        </div>
      </article>
    );
  };

  return (
    <>
      <section className="glass-card widget-frame career-widget">
        <div className="career-widget-header widget-card-header widget-frame__header">
          <div className="career-widget-title-wrap widget-card-title-group widget-frame__title-group">
            <div className="glass-card-icon widget-card-icon widget-frame__icon">
              <BriefcaseBusiness className="w-4 h-4" />
            </div>

            <div className="widget-card-copy widget-frame__copy">
              <h3 className="widget-frame__title">Career</h3>
              <p className="widget-frame__subtitle">
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

        <div className="career-filter-row">
          <div className="career-view-toggle">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`career-filter-pill ${viewMode === "list" ? "is-active" : ""}`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>

            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`career-filter-pill ${viewMode === "board" ? "is-active" : ""}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Board
            </button>
          </div>

          {(["All", ...statusOptions] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`career-filter-pill ${statusFilter === status ? "is-active" : ""}`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className={viewMode === "board" ? "career-list career-list-hidden" : "career-list"}>
          {filteredItems.length === 0 ? (
            <div className="career-empty-box">
              아직 지원 회사가 없어. + 눌러서 추가해.
            </div>
          ) : (
            filteredItems.map((item) => renderCareerCard(item))
          )}
        </div>

        {viewMode === "board" && (
          <div className="career-board">
            {boardColumns.map((column) => (
              <section key={column.status} className="career-board-column">
                <header className="career-board-column-header">
                  <strong>{column.status}</strong>
                  <span>{column.items.length}</span>
                </header>

                <div className="career-board-column-body">
                  {column.items.length === 0 ? (
                    <div className="career-empty-box career-board-empty">No cards</div>
                  ) : (
                    column.items.map((item) => renderCareerCard(item, true))
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
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
                minWidth: 560,
                minHeight: 540,
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
                    onClick={closeWindow}
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
                      <div className="career-section-title">
                        Cover Letter Questions
                      </div>
                      <p className="career-section-subtitle">
                        질문을 누르면 바로 수정 가능 · 답변은 공백 포함
                        글자수 기준
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
                      getCoverLetterItems(selectedItem).map((item, index) => {
                        const answerCount = countWithSpaces(
                          item.answer ?? ""
                        );
                        const answerLimit = item.answerLimit;
                        const isOverLimit =
                          typeof answerLimit === "number" &&
                          answerCount > answerLimit;

                        return (
                          <article
                            key={item.id}
                            className={[
                              "career-cover-wide-row",
                              isOverLimit ? "is-over-limit" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <div className="career-cover-question-line">
                              <FileText className="career-cover-icon" />

                              <textarea
                                value={item.question}
                                rows={1}
                                onInput={handleAutoGrowTextarea}
                                onFocus={(event) =>
                                  autoGrowTextarea(event.currentTarget)
                                }
                                onChange={(event) =>
                                  updateCoverLetterItem(item.id, {
                                    question: event.target.value,
                                  })
                                }
                                className="career-cover-question-input career-auto-textarea"
                                placeholder={`${index + 1}. 자소서 문항 입력`}
                              />

                              <select
                                value={item.status}
                                onChange={(event) =>
                                  updateCoverLetterItem(item.id, {
                                    status: event.target
                                      .value as CoverLetterStatus,
                                  })
                                }
                                className="career-cover-status-select"
                              >
                                {coverLetterStatusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {getCoverLetterStatusLabel(status)}
                                  </option>
                                ))}
                              </select>

                              <label className="career-cover-limit-field">
                                <span>Limit</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={item.answerLimit ?? ""}
                                  onChange={(event) =>
                                    updateCoverLetterItem(item.id, {
                                      answerLimit: parseAnswerLimit(
                                        event.target.value
                                      ),
                                    })
                                  }
                                  placeholder="600"
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() =>
                                  removeCoverLetterItem(item.id)
                                }
                                className="career-delete-button"
                                title="Delete question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="career-cover-writing-line">
                              <label className="career-cover-writing-field">
                                <div className="career-cover-writing-header">
                                  <span>Answer</span>

                                  <strong
                                    className={isOverLimit ? "is-over" : ""}
                                  >
                                    {answerCount}
                                    {typeof answerLimit === "number"
                                      ? ` / ${answerLimit}`
                                      : " chars"}
                                  </strong>
                                </div>

                                <textarea
                                  value={item.answer ?? ""}
                                  rows={4}
                                  onInput={handleAutoGrowTextarea}
                                  onFocus={(event) =>
                                    autoGrowTextarea(event.currentTarget)
                                  }
                                  onChange={(event) =>
                                    updateCoverLetterItem(item.id, {
                                      answer: event.target.value,
                                    })
                                  }
                                  className="career-cover-answer-textarea career-auto-textarea"
                                  placeholder="여기에 실제 답변 초안 작성"
                                />

                                {isOverLimit && (
                                  <div className="career-cover-limit-warning">
                                    공백 포함{" "}
                                    {answerCount - (answerLimit ?? 0)}자 초과
                                  </div>
                                )}
                              </label>

                              <label className="career-cover-writing-field">
                                <div className="career-cover-writing-header">
                                  <span>Strategy</span>
                                  <strong>Memo</strong>
                                </div>

                                <textarea
                                  value={item.strategy ?? item.memo ?? ""}
                                  rows={3}
                                  onInput={handleAutoGrowTextarea}
                                  onFocus={(event) =>
                                    autoGrowTextarea(event.currentTarget)
                                  }
                                  onChange={(event) =>
                                    updateCoverLetterItem(item.id, {
                                      strategy: event.target.value,
                                      memo: event.target.value,
                                    })
                                  }
                                  className="career-cover-strategy-textarea career-auto-textarea"
                                  placeholder="키워드, 구조, 강조할 경험, 분량 전략"
                                />
                              </label>
                            </div>
                          </article>
                        );
                      })
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
