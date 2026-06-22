import { Plus, Trash2 } from "lucide-react";
import type { CareerItem, InterviewReview } from "./careerTypes";
import { createInterviewReview } from "./careerUtils";

type InterviewReviewPanelProps = {
  item: CareerItem;
  onChange: (patch: Partial<CareerItem>) => void;
};

const resultOptions = ["대기중", "합격", "불합격", "보류", "철회", "기타"];

export const InterviewReviewPanel = ({
  item,
  onChange,
}: InterviewReviewPanelProps) => {
  const reviews = item.interviewReviews ?? [];

  const updateReview = (
    reviewId: string,
    patch: Partial<InterviewReview>
  ) => {
    onChange({
      interviewReviews: reviews.map((review) =>
        review.id === reviewId ? { ...review, ...patch } : review
      ),
    });
  };

  const addReview = () => {
    onChange({
      interviewReviews: [...reviews, createInterviewReview()],
    });
  };

  const removeReview = (reviewId: string) => {
    onChange({
      interviewReviews: reviews.filter((review) => review.id !== reviewId),
    });
  };

  return (
    <section className="career-detail-section interview-review-panel">
      <div className="career-section-title-row">
        <div>
          <div className="career-section-title">Interview Review</div>
          <p className="career-section-sub">
            면접 질문, 답변, 분위기, 결과, 다음 지원에 반영할 점을 기록.
          </p>
        </div>

        <button
          type="button"
          onClick={addReview}
          className="career-small-button"
        >
          <Plus className="w-3.5 h-3.5" />
          Review
        </button>
      </div>

      <div className="career-final-result-box">
        <span>Final Result</span>

        <select
          value={item.result ?? ""}
          onChange={(event) =>
            onChange({
              result: event.target.value,
            })
          }
          className="career-final-result-select"
        >
          <option value="">Not decided</option>
          {resultOptions.map((result) => (
            <option key={result} value={result}>
              {result}
            </option>
          ))}
        </select>
      </div>

      <div className="interview-review-list">
        {reviews.length === 0 ? (
          <div className="career-empty-box">
            아직 면접 후기 기록이 없어. 면접을 보고 나면 질문과 답변을 남겨둬.
          </div>
        ) : (
          reviews.map((review, index) => (
            <article key={review.id} className="interview-review-item">
              <div className="interview-review-header">
                <span className="interview-review-number">
                  Interview {index + 1}
                </span>

                <input
                  value={review.stageLabel}
                  onChange={(event) =>
                    updateReview(review.id, {
                      stageLabel: event.target.value,
                    })
                  }
                  className="interview-review-stage"
                  placeholder="예: 1차 면접 / 최종 면접"
                />

                <input
                  type="date"
                  value={review.date}
                  onChange={(event) =>
                    updateReview(review.id, {
                      date: event.target.value,
                    })
                  }
                  className="interview-review-date"
                />

                <button
                  type="button"
                  onClick={() => removeReview(review.id)}
                  className="interview-review-delete"
                  title="Delete review"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="interview-review-grid">
                <label className="interview-review-field">
                  <span>Interviewer / Format</span>
                  <input
                    value={review.interviewer}
                    onChange={(event) =>
                      updateReview(review.id, {
                        interviewer: event.target.value,
                      })
                    }
                    placeholder="예: 실무진 2명 / 화상 / 30분"
                  />
                </label>

                <label className="interview-review-field">
                  <span>Mood</span>
                  <input
                    value={review.mood}
                    onChange={(event) =>
                      updateReview(review.id, {
                        mood: event.target.value,
                      })
                    }
                    placeholder="예: 압박 / 편안함 / 꼬리질문 많음"
                  />
                </label>

                <label className="interview-review-field">
                  <span>Result</span>
                  <input
                    value={review.result}
                    onChange={(event) =>
                      updateReview(review.id, {
                        result: event.target.value,
                      })
                    }
                    placeholder="예: 합격 / 불합격 / 대기중"
                  />
                </label>
              </div>

              <label className="interview-review-textarea-field">
                <span>Questions</span>
                <textarea
                  value={review.questions}
                  onChange={(event) =>
                    updateReview(review.id, {
                      questions: event.target.value,
                    })
                  }
                  placeholder={`면접 질문 기록
- 자기소개
- 지원동기
- IFRS17 / 재보험 경험
- 데이터 검증 경험`}
                />
              </label>

              <label className="interview-review-textarea-field">
                <span>My Answers</span>
                <textarea
                  value={review.answers}
                  onChange={(event) =>
                    updateReview(review.id, {
                      answers: event.target.value,
                    })
                  }
                  placeholder="내가 실제로 답한 내용 / 아쉬웠던 답변 / 다음엔 이렇게 말하기"
                />
              </label>

              <label className="interview-review-textarea-field">
                <span>Reflection</span>
                <textarea
                  value={review.reflection}
                  onChange={(event) =>
                    updateReview(review.id, {
                      reflection: event.target.value,
                    })
                  }
                  placeholder="잘한 점, 부족했던 점, 다음 지원에 반영할 점"
                />
              </label>
            </article>
          ))
        )}
      </div>
    </section>
  );
};