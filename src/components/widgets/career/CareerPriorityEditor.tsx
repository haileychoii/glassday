import type { CareerItem, CareerPriority } from "./careerTypes";
import { priorityLabels } from "./careerUtils";

type CareerPriorityEditorProps = {
  item: CareerItem;
  onChange: (patch: Partial<CareerItem>) => void;
};

const priorities: CareerPriority[] = ["high", "medium", "low"];

export const CareerPriorityEditor = ({
  item,
  onChange,
}: CareerPriorityEditorProps) => {
  const priority = item.priority ?? "medium";
  const starred = item.starred ?? false;

  return (
    <section className="career-detail-section career-priority-panel">
      <div className="career-section-title-row">
        <div>
          <div className="career-section-title">Priority</div>
          <p className="career-section-sub">
            중요한 지원건은 별표로 고정하고 우선순위를 나눠 관리.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onChange({ starred: !starred })}
          className={["career-star-button", starred ? "is-active" : ""]
            .filter(Boolean)
            .join(" ")}
          title={starred ? "Unstar" : "Star"}
        >
          ★
        </button>
      </div>

      <div className="career-priority-options">
        {priorities.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange({ priority: value })}
            className={[
              "career-priority-button",
              `is-${value}`,
              priority === value ? "is-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {priorityLabels[value]}
          </button>
        ))}
      </div>
    </section>
  );
};