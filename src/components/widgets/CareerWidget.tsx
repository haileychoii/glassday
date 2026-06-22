import {
  BriefcaseBusiness,
  CalendarDays,
  ExternalLink,
  FileText,
  Filter,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CareerAttachments } from "./career/CareerAttachments";
import { CareerPipeline } from "./career/CareerPipeline";
import { CareerPriorityEditor } from "./career/CareerPriorityEditor";
import { CoverLetterTracker } from "./career/CoverLetterTracker";
import { InterviewReviewPanel } from "./career/InterviewReviewPanel";
import type {
  CareerItem,
  CareerPriority,
  CareerStatus,
} from "./career/careerTypes";
import {
  careerStatusOptions,
  createCareerItem,
  getCoverLetterProgress,
  getDdayLabel,
  getDdayTone,
  getPriorityScore,
  getStageProgress,
  loadCareerItems,
  normalizeCareerItem,
  saveCareerItems,
} from "./career/careerUtils";

type PriorityFilter = "all" | CareerPriority;

const priorityFilters: PriorityFilter[] = ["all", "high", "medium", "low"];

export const CareerWidget = () => {
  const [items, setItems] = useState<CareerItem[]>(() => loadCareerItems());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] =
    useState<PriorityFilter>("all");
  const [starredOnly, setStarredOnly] = useState(false);

  const normalizedItems = useMemo(
    () => items.map(normalizeCareerItem),
    [items]
  );

  useEffect(() => {
    saveCareerItems(normalizedItems);
  }, [normalizedItems]);

  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    return normalizedItems.find((item) => item.id === selectedId) ?? null;
  }, [normalizedItems, selectedId]);

  const updateCareerItem = (id: string, patch: Partial<CareerItem>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? normalizeCareerItem({ ...item, ...patch }) : item
      )
    );
  };

  const addCareerItem = () => {
    const next = createCareerItem();

    setItems((prev) => [next, ...prev]);
    setSelectedId(next.id);
  };

  const deleteCareerItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));

    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const visibleItems = useMemo(() => {
    return normalizedItems
      .filter((item) => {
        if (starredOnly && !item.starred) return false;
        if (priorityFilter !== "all" && item.priority !== priorityFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if ((a.starred ?? false) !== (b.starred ?? false)) {
          return a.starred ? -1 : 1;
        }

        return (
          getPriorityScore(b.priority ?? "medium") -
          getPriorityScore(a.priority ?? "medium")
        );
      });
  }, [normalizedItems, priorityFilter, starredOnly]);

  const summary = useMemo(() => {
    const starred = normalizedItems.filter((item) => item.starred).length;
    const preparing = normalizedItems.filter(
      (item) => item.status === "Preparing"
    ).length;
    const interviews = normalizedItems.filter(
      (item) => item.status === "Interview"
    ).length;
    const urgent = normalizedItems.filter((item) =>
      ["urgent", "soon"].includes(getDdayTone(item.deadline))
    ).length;

    return {
      total: normalizedItems.length,
      starred,
      preparing,
      interviews,
      urgent,
    };
  }, [normalizedItems]);

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
            <strong>{summary.starred}</strong>
            <span>Starred</span>
          </div>

          <div className="career-summary-card">
            <strong>{summary.preparing}</strong>
            <span>Preparing</span>
          </div>

          <div className="career-summary-card">
            <strong>{summary.interviews}</strong>
            <span>Interview</span>
          </div>
        </div>

        <div className="career-filter-row">
          <button
            type="button"
            onClick={() => setStarredOnly((prev) => !prev)}
            className={["career-filter-pill", starredOnly ? "is-active" : ""]
              .filter(Boolean)
              .join(" ")}
          >
            <Star className="w-3.5 h-3.5" />
            Starred
          </button>

          {priorityFilters.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPriorityFilter(value)}
              className={[
                "career-filter-pill",
                priorityFilter === value ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <Filter className="w-3.5 h-3.5" />
              {value === "all" ? "All" : value}
            </button>
          ))}
        </div>

        <div className="career-list">
          {visibleItems.length === 0 ? (
            <div className="career-empty-box">
              조건에 맞는 지원건이 없어.
            </div>
          ) : (
            visibleItems.map((item) => {
              const stageProgress = getStageProgress(item.stages ?? []);
              const clProgress = getCoverLetterProgress(
                item.coverLetterItems ?? []
              );
              const ddayTone = getDdayTone(item.deadline);

              return (
                <article
                  key={item.id}
                  className={[
                    "career-list-item",
                    `priority-${item.priority ?? "medium"}`,
                    ddayTone === "urgent" ? "is-urgent" : "",
                    ddayTone === "soon" ? "is-soon" : "",
                    ddayTone === "closed" ? "is-closed" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="career-list-main">
                    <div className="career-list-title-row">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          updateCareerItem(item.id, {
                            starred: !item.starred,
                          });
                        }}
                        className={[
                          "career-list-star",
                          item.starred ? "is-active" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        ★
                      </button>

                      <div className="career-list-title">
                        <strong>{item.company}</strong>
                        <span>{item.role}</span>
                      </div>
                    </div>

                    <div className="career-list-meta">
                      <span className={`career-status-pill status-${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>

                      <span className={`career-priority-tag is-${item.priority}`}>
                        {item.priority}
                      </span>

                      <span>
                        <FileText className="w-3 h-3" />
                        CL {clProgress}%
                      </span>

                      <span>
                        <CalendarDays className="w-3 h-3" />
                        Stage {stageProgress}%
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

      {selectedItem && (
        <div
          className="career-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedId(null);
            }
          }}
        >
          <div className="career-modal-window">
            <div className="career-modal-header">
              <div>
                <div className="career-modal-kicker">Career Detail</div>
                <h2>{selectedItem.company}</h2>
                <p>{selectedItem.role}</p>
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
                    Open
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="career-icon-button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="career-modal-body">
              <section className="career-detail-section">
                <div className="career-section-title">Overview</div>

                <div className="career-detail-grid">
                  <label className="career-field">
                    <span>Company</span>
                    <input
                      value={selectedItem.company}
                      onChange={(event) =>
                        updateCareerItem(selectedItem.id, {
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
                        updateCareerItem(selectedItem.id, {
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
                        updateCareerItem(selectedItem.id, {
                          status: event.target.value as CareerStatus,
                        })
                      }
                    >
                      {careerStatusOptions.map((status) => (
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
                        updateCareerItem(selectedItem.id, {
                          deadline: event.target.value,
                          applicationEndDate: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="career-field">
                    <span>Location</span>
                    <input
                      value={selectedItem.location}
                      onChange={(event) =>
                        updateCareerItem(selectedItem.id, {
                          location: event.target.value,
                        })
                      }
                      placeholder="서울, 부산, Remote..."
                    />
                  </label>

                  <label className="career-field">
                    <span>Work Type</span>
                    <input
                      value={selectedItem.workType}
                      onChange={(event) =>
                        updateCareerItem(selectedItem.id, {
                          workType: event.target.value,
                        })
                      }
                      placeholder="인턴 / 신입 / 정규직..."
                    />
                  </label>
                </div>
              </section>

              <section className="career-detail-section">
                <div className="career-section-title">Application Window</div>

                <div className="career-detail-grid">
                  <label className="career-field">
                    <span>Start Date</span>
                    <input
                      type="date"
                      value={selectedItem.applicationStartDate}
                      onChange={(event) =>
                        updateCareerItem(selectedItem.id, {
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
                        updateCareerItem(selectedItem.id, {
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
                        updateCareerItem(selectedItem.id, {
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
                        updateCareerItem(selectedItem.id, {
                          applicationEndTime: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              </section>

              <CareerPriorityEditor
                item={selectedItem}
                onChange={(patch) => updateCareerItem(selectedItem.id, patch)}
              />

              <CareerPipeline
                item={selectedItem}
                onChange={(patch) => updateCareerItem(selectedItem.id, patch)}
              />

              <CoverLetterTracker
                item={selectedItem}
                onChange={(patch) => updateCareerItem(selectedItem.id, patch)}
              />

              <CareerAttachments
                item={selectedItem}
                onChange={(patch) => updateCareerItem(selectedItem.id, patch)}
              />

              <InterviewReviewPanel
                item={selectedItem}
                onChange={(patch) => updateCareerItem(selectedItem.id, patch)}
              />

              <section className="career-detail-section">
                <div className="career-section-title">Posting & Notes</div>

                <label className="career-field">
                  <span>Posting URL</span>
                  <input
                    value={selectedItem.postingUrl}
                    onChange={(event) =>
                      updateCareerItem(selectedItem.id, {
                        postingUrl: event.target.value,
                      })
                    }
                    placeholder="https://..."
                  />
                </label>

                <label className="career-field mt-3">
                  <span>Job Description</span>
                  <textarea
                    value={selectedItem.jobDescription}
                    onChange={(event) =>
                      updateCareerItem(selectedItem.id, {
                        jobDescription: event.target.value,
                      })
                    }
                    className="career-textarea"
                    placeholder="공고 주요 내용, 직무 키워드, 필요 역량..."
                  />
                </label>

                <label className="career-field mt-3">
                  <span>Notes</span>
                  <textarea
                    value={selectedItem.notes}
                    onChange={(event) =>
                      updateCareerItem(selectedItem.id, {
                        notes: event.target.value,
                      })
                    }
                    className="career-textarea"
                    placeholder="지원 전략, 자소서 방향, 면접 준비 메모..."
                  />
                </label>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
};