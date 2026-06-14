import { Activity } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";

export const HealthWidget = () => {
  const current = 54.8;
  const target = 48.0;
  const start = 58.0;

  const progress =
    ((start - current) / (start - target)) * 100;

  return (
    <GlassCard
      title="Health Progress"
      subtitle="Consistency wins."
      icon={<Activity className="w-4 h-4" />}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/30 border border-white/40 p-3">
            <div className="text-xs text-muted-foreground mb-1">
              Current
            </div>

            <div className="text-2xl font-semibold">
              {current}
              <span className="text-sm ml-1 text-muted-foreground">
                kg
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/30 border border-white/40 p-3">
            <div className="text-xs text-muted-foreground mb-1">
              Goal
            </div>

            <div className="text-2xl font-semibold">
              {target}
              <span className="text-sm ml-1 text-muted-foreground">
                kg
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>

          <div className="h-2 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full rounded-full progress-gradient"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white/30 border border-white/40 p-3">
          <div className="text-xs text-muted-foreground">
            Program
          </div>

          <div className="text-sm font-medium mt-1">
            Wegovy · Week 3
          </div>
        </div>
      </div>
    </GlassCard>
  );
};