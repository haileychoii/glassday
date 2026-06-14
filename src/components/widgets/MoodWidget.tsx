import { useState } from "react";
import { Heart } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";
import { cn } from "../../lib/utils";

const metrics = ["Energy", "Focus", "Sleepiness", "Stress", "Appetite"] as const;

export const MoodWidget = () => {
  const [values, setValues] = useState<Record<string, number>>({
    Energy: 3,
    Focus: 3,
    Sleepiness: 4,
    Stress: 2,
    Appetite: 3,
  });

  return (
    <GlassCard
      title="Energy Insights"
      subtitle="Feelings as signals"
      icon={<Heart className="w-4 h-4" />}
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
                  onClick={() =>
                    setValues((prev) => ({
                      ...prev,
                      [metric]: n,
                    }))
                  }
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all",
                    n <= values[metric]
                      ? "bg-primary scale-110"
                      : "bg-white/45 hover:bg-white/75"
                  )}
                />
              ))}
            </div>

            <span className="text-[11px] text-muted-foreground tabular-nums w-8">
              {values[metric]}/5
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};