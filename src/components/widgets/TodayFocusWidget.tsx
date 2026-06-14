import { Sparkles, Target } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";

export const TodayFocusWidget = () => {
  return (
    <GlassCard
      title="Today's Focus"
      subtitle="Small reps compound."
      icon={<Sparkles className="w-4 h-4" />}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Main Goal
          </p>

          <div className="text-2xl font-semibold tracking-tight">
            Submit one strong application.
          </div>
        </div>

        <div className="rounded-2xl bg-white/30 border border-white/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              Next Action
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            Update project descriptions and finalize resume.
          </p>
        </div>

        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full bg-primary/15 text-xs">
            Career
          </span>

          <span className="px-3 py-1 rounded-full bg-primary/15 text-xs">
            NCS
          </span>

          <span className="px-3 py-1 rounded-full bg-primary/15 text-xs">
            English
          </span>
        </div>
      </div>
    </GlassCard>
  );
};