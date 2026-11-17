/**
 * ============================================================
 * [Figma Mapping] Dashboard / Mood Widget
 * ============================================================
 *
 * 화면 역할: Energy, Focus, Sleepiness, Stress, Appetite를 1~5 단계로 기록한다.
 * Renderer: DashboardGrid (WidgetId: mood)
 * Storage: useLocalStorage / glassday.mood
 * Style: src/styles/widgets/mood.css + theme-specific surface overrides
 * Figma 구조: Header Edit Action + Metric Row Component Set
 * Variants: Read Only / Editing / Score 1..5
 * ============================================================
 */
import { useState } from "react";
import {
  Activity,
  Brain,
  Heart,
  Lock,
  Moon,
  Pencil,
  RotateCcw,
  Utensils,
  Zap,
} from "lucide-react";
import { GlassCard } from "../glass/GlassCard";
import { cn } from "../../lib/utils";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const metrics = [
  { key: "Energy", icon: Zap },
  { key: "Focus", icon: Brain },
  { key: "Sleepiness", icon: Moon },
  { key: "Stress", icon: Activity },
  { key: "Appetite", icon: Utensils },
] as const;

type Metric = (typeof metrics)[number]["key"];

type MoodValues = Record<Metric, number>;

const defaultMood: MoodValues = {
  Energy: 3,
  Focus: 3,
  Sleepiness: 4,
  Stress: 2,
  Appetite: 3,
};

// Each scale translates the saved 1-5 value into plain language.
// 기존 숫자 저장값은 유지하고, 화면에서만 지표별 의미를 분명히 보여준다.
const metricScaleLabels: Record<Metric, readonly string[]> = {
  Energy: ["Very low", "Low", "Steady", "High", "Very high"],
  Focus: ["Scattered", "Light", "Steady", "Focused", "Deep focus"],
  Sleepiness: ["Alert", "A little tired", "Moderate", "Sleepy", "Very sleepy"],
  Stress: ["Calm", "Slight", "Moderate", "High", "Overwhelming"],
  Appetite: ["Very low", "Low", "Usual", "Good", "Very strong"],
};

/** Edit mode에서만 score dot interaction을 허용하는 life signal component. */
export const MoodWidget = () => {
  const [editing, setEditing] = useState(false);

  const {
    value: values,
    setValue: setValues,
    resetValue,
  } = useLocalStorage<MoodValues>("glassday.mood", defaultMood);

  const updateMetric = (metric: Metric, value: number) => {
    if (!editing) return;

    setValues((prev) => ({
      ...prev,
      [metric]: value,
    }));
  };

  return (
    <GlassCard
      title="Mood"
      subtitle={editing ? "Editing signals" : "Feelings as signals"}
      icon={<Heart className="w-4 h-4" />}
      className="mood-widget"
      actions={
        <button
          type="button"
          onClick={() => setEditing((prev) => !prev)}
          className={cn(
            "h-8 px-3 rounded-full text-xs border transition flex items-center gap-1.5",
            editing
              ? "bg-foreground text-background border-foreground"
              : "bg-white/35 border-white/50 text-muted-foreground hover:text-foreground"
          )}
          aria-label={editing ? "Finish editing mood" : "Edit mood"}
        >
          {editing ? (
            <Lock className="w-3.5 h-3.5" />
          ) : (
            <Pencil className="w-3.5 h-3.5" />
          )}
          {editing ? "Done" : "Edit"}
        </button>
      }
    >
      {/*
       * Metric rows keep the existing five 1-5 values, while adding a named
       * interpretation and an explicit selection control for each signal.
       * 기존 저장 호환성은 그대로 두고 점만 보이던 척도를 읽을 수 있게 한다.
       */}
      <div className="mood-list">
        {metrics.map(({ key: metric, icon: Icon }) => (
          <div
            key={metric}
            className="mood-row"
            data-metric={metric.toLowerCase()}
          >
            <div className="mood-row-heading">
              <span className="mood-label">
                <Icon aria-hidden="true" />
                {metric}
              </span>
              <span className="mood-value">
                <strong>{values[metric]}/5</strong>
                <span>{metricScaleLabels[metric][values[metric] - 1]}</span>
              </span>
            </div>

            <div className="mood-track" role="group" aria-label={`${metric} level`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => updateMetric(metric, n)}
                  className={cn(
                    "mood-dot",
                    n <= values[metric] && "mood-dot-active",
                    values[metric] === n && "is-selected"
                  )}
                  disabled={!editing}
                  aria-label={`${metric}: ${metricScaleLabels[metric][n - 1]}`}
                  aria-pressed={values[metric] === n}
                  title={`${n} · ${metricScaleLabels[metric][n - 1]}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}

        {editing && (
          <button
            type="button"
            onClick={resetValue}
            className="mood-reset-button"
            aria-label="Reset mood data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset mood data
          </button>
        )}
      </div>
    </GlassCard>
  );
};
