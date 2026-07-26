import { useState } from "react";
import { Heart, Lock, Pencil, RotateCcw } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";
import { cn } from "../../lib/utils";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const metrics = ["Energy", "Focus", "Sleepiness", "Stress", "Appetite"] as const;

type Metric = (typeof metrics)[number];

type MoodValues = Record<Metric, number>;

const defaultMood: MoodValues = {
  Energy: 3,
  Focus: 3,
  Sleepiness: 4,
  Stress: 2,
  Appetite: 3,
};

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
      <div className="mood-list">
        {metrics.map((metric) => (
          <div
            key={metric}
            className="mood-row"
            data-metric={metric.toLowerCase()}
          >
            <span className="mood-label">{metric}</span>

            <div className="mood-track">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => updateMetric(metric, n)}
                  className={cn(
                    "mood-dot",
                    editing && "cursor-pointer",
                    n <= values[metric] ? "mood-dot-active" : "hover:bg-white/65",
                    !editing && "pointer-events-none"
                  )}
                />
              ))}
            </div>

            <span className="mood-value">
              {values[metric]}/5
            </span>
          </div>
        ))}

        {editing && (
          <button
            type="button"
            onClick={resetValue}
            className="mood-reset-button"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset mood data
          </button>
        )}
      </div>
    </GlassCard>
  );
};
