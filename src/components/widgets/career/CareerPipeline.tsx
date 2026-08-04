/**
 * [Inactive Career Prototype] Pipeline stage editor
 * 현재 CareerWidget.tsx에서 import되지 않는 이전 child component다.
 * Figma 후보 구조: Stage Row / Status Variant / Add-Delete Action.
 * 실제 Career UI와 저장 타입은 CareerWidget.tsx, DashboardDataContext, src/types/dashboard.ts다.
 */
import { Plus, Trash2 } from "lucide-react";
import type { CareerItem, CareerStage, CareerStageStatus } from "./careerTypes";
import { createCareerId, stageStatusLabels } from "./careerUtils";

type CareerPipelineProps = {
  item: CareerItem;
  onChange: (patch: Partial<CareerItem>) => void;
};

const statusOptions: CareerStageStatus[] = [
  "not_started",
  "in_progress",
  "waiting",
  "done",
  "passed",
  "failed",
];

export const CareerPipeline = ({ item, onChange }: CareerPipelineProps) => {
  const stages = item.stages ?? [];

  const updateStage = (stageId: string, patch: Partial<CareerStage>) => {
    onChange({
      stages: stages.map((stage) =>
        stage.id === stageId ? { ...stage, ...patch } : stage
      ),
    });
  };

  const addStage = () => {
    onChange({
      stages: [
        ...stages,
        {
          id: createCareerId("stage"),
          label: "새 전형",
          status: "not_started",
          date: "",
          memo: "",
        },
      ],
    });
  };

  const removeStage = (stageId: string) => {
    onChange({
      stages: stages.filter((stage) => stage.id !== stageId),
    });
  };

  return (
    <section className="career-detail-section career-pipeline-panel">
      <div className="career-section-title-row">
        <div>
          <div className="career-section-title">Selection Timeline</div>
          <p className="career-section-sub">
            서류, 인적성, 면접, 최종 결과까지 단계별로 관리.
          </p>
        </div>

        <button type="button" onClick={addStage} className="career-small-button">
          <Plus className="w-3.5 h-3.5" />
          Stage
        </button>
      </div>

      <div className="career-stage-list">
        {stages.map((stage, index) => (
          <div key={stage.id} className="career-stage-item">
            <div className="career-stage-marker-wrap">
              <div
                className={[
                  "career-stage-marker",
                  `status-${stage.status}`,
                ].join(" ")}
              >
                {index + 1}
              </div>
              {index < stages.length - 1 && <div className="career-stage-line" />}
            </div>

            <div className="career-stage-content">
              <div className="career-stage-top">
                <input
                  value={stage.label}
                  onChange={(event) =>
                    updateStage(stage.id, { label: event.target.value })
                  }
                  className="career-stage-title-input"
                  placeholder="전형 단계"
                />

                <select
                  value={stage.status}
                  onChange={(event) =>
                    updateStage(stage.id, {
                      status: event.target.value as CareerStageStatus,
                    })
                  }
                  className={`career-stage-status status-${stage.status}`}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {stageStatusLabels[status]}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => removeStage(stage.id)}
                  className="career-stage-delete"
                  title="Delete stage"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="career-stage-bottom">
                <input
                  type="date"
                  value={stage.date}
                  onChange={(event) =>
                    updateStage(stage.id, { date: event.target.value })
                  }
                  className="career-stage-date"
                />

                <input
                  value={stage.memo}
                  onChange={(event) =>
                    updateStage(stage.id, { memo: event.target.value })
                  }
                  className="career-stage-memo"
                  placeholder="메모 / 결과 / 준비사항"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
