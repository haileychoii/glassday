import { Heart, RotateCcw } from "lucide-react";
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
  const {
    value: values,
    setValue: setValues,
    resetValue,
  } = useLocalStorage<MoodValues>("glassday.mood", defaultMood);

  const updateMetric = (metric: Metric, value: number) => {
    setValues((prev) => ({
      ...prev,
      [metric]: value,
    }));
  };

  return (
    <GlassCard
      title="Energy Insights"
      subtitle="Saved locally."
      icon={<Heart className="w-4 h-4" />}
      className="mood-widget"
    >
      <div className="space-y-3">
        {metrics.map((metric) => (
          <div key={metric} className="flex items-center gap-3">
            <span className="text-xs font-medium w-20">{metric}</span>

            <div className="flex gap-1.5 flex-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => updateMetric(metric, n)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all",
                    n <= values[metric]
                      ? "mood-dot-active scale-110"
                      : "bg-white/35 hover:bg-white/65"
                  )}
                />
              ))}
            </div>

            <span className="text-[11px] text-muted-foreground tabular-nums w-8">
              {values[metric]}/5
            </span>
          </div>
        ))}

        <button
          type="button"
          onClick={resetValue}
          className="pt-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset mood data
        </button>
      </div>
    </GlassCard>
  );
};