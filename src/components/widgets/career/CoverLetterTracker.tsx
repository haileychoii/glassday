import { Plus, Trash2 } from "lucide-react";
import type {
  CareerItem,
  CoverLetterItem,
  CoverLetterStatus,
} from "../../../types/dashboard";
import {
  coverLetterStatusLabels,
  createCoverLetterItem,
  getCoverLetterProgress,
} from "./careerUtils";

type CoverLetterTrackerProps = {
  item: CareerItem;
  onChange: (patch: Partial<CareerItem>) => void;
};

const statusOptions: CoverLetterStatus[] = [
  "not_started",
  "drafting",
  "reviewing",
  "done",
];

export const CoverLetterTracker = ({
  item,
  onChange,
}: CoverLetterTrackerProps) => {
  const questions = item.coverLetterItems ?? [];
  const progress = getCoverLetterProgress(questions);

  const updateQuestion = (
    questionId: string,
    patch: Partial<CoverLetterItem>
  ) => {
    onChange({
      coverLetterItems: questions.map((question) =>
        question.id === questionId ? { ...question, ...patch } : question
      ),
    });
  };

  const addQuestion = () => {
    onChange({
      coverLetterItems: [...questions, createCoverLetterItem()],
    });
  };

  const removeQuestion = (questionId: string) => {
    onChange({
      coverLetterItems: questions.filter((question) => question.id !== questionId),
    });
  };

  return (
    <section className="career-detail-section cover-letter-panel">
      <div className="career-section-title-row">
        <div>
          <div className="career-section-title">Cover Letter</div>
          <p className="career-section-sub">
            문항별 작성 상태와 답변 초안을 한 곳에서 관리.
          </p>
        </div>

        <div className="cover-letter-progress">
          <span>{progress}%</span>
          <div>
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>

        <button type="button" onClick={addQuestion} className="career-small-button">
          <Plus className="w-3.5 h-3.5" />
          Question
        </button>
      </div>

      <div className="cover-letter-list">
        {questions.length === 0 ? (
          <div className="career-empty-box">
            자소서 문항을 추가하면 작성 상태를 추적할 수 있어.
          </div>
        ) : (
          questions.map((question, index) => (
            <article key={question.id} className="cover-letter-item">
              <div className="cover-letter-item-header">
                <span className="cover-letter-number">Q{index + 1}</span>

                <select
                  value={question.status}
                  onChange={(event) =>
                    updateQuestion(question.id, {
                      status: event.target.value as CoverLetterStatus,
                    })
                  }
                  className={`cover-letter-status status-${question.status}`}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {coverLetterStatusLabels[status]}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  className="cover-letter-delete"
                  title="Delete question"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <textarea
                value={question.question}
                onChange={(event) =>
                  updateQuestion(question.id, {
                    question: event.target.value,
                  })
                }
                className="cover-letter-question"
                placeholder="자소서 문항"
              />

              <textarea
                value={question.answer}
                onChange={(event) =>
                  updateQuestion(question.id, {
                    answer: event.target.value,
                  })
                }
                className="cover-letter-answer"
                placeholder="답변 초안"
              />

              <input
                value={question.memo}
                onChange={(event) =>
                  updateQuestion(question.id, {
                    memo: event.target.value,
                  })
                }
                className="cover-letter-memo"
                placeholder="키워드 / 보완할 점 / 참고 메모"
              />
            </article>
          ))
        )}
      </div>
    </section>
  );
};