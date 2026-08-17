import { useState } from "react";
import { Activity, Lock, Pencil, RotateCcw } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";

type HealthData = {
  current: number;
  target: number;
  start: number;
  program: string;
};

const defaultHealth: HealthData = {
  current: 54.8,
  target: 48.0,
  start: 58.0,
  program: "Wegovy · Week 3",
};

export const HealthWidget = () => {
  const [editing, setEditing] = useState(false);

  const {
    value: health,
    setValue: setHealth,
    resetValue,
  } = useLocalStorage<HealthData>("glassday.health", defaultHealth);

  const total = health.start - health.target;
  const progressed = health.start - health.current;

  const progress =
    total <= 0 ? 0 : Math.max(0, Math.min(100, (progressed / total) * 100));

  const remaining = Math.max(0, health.current - health.target).toFixed(1);

  const updateField = <K extends keyof HealthData>(
    key: K,
    value: HealthData[K]
  ) => {
    setHealth((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <GlassCard
      title="Health Progress"
      subtitle={editing ? "Editing health data" : `${remaining}kg to go`}
      icon={<Activity className="w-4 h-4" />}
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
      <div className="space-y-4">
        {editing ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <label className="rounded-2xl bg-white/25 border border-white/40 p-3">
                <div className="text-[11px] text-muted-foreground mb-1">
                  Start
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={health.start}
                  onChange={(e) => updateField("start", Number(e.target.value))}
                  className="w-full bg-transparent outline-none text-lg font-semibold"
                />
              </label>

              <label className="rounded-2xl bg-white/25 border border-white/40 p-3">
                <div className="text-[11px] text-muted-foreground mb-1">
                  Current
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={health.current}
                  onChange={(e) =>
                    updateField("current", Number(e.target.value))
                  }
                  className="w-full bg-transparent outline-none text-lg font-semibold"
                />
              </label>

              <label className="rounded-2xl bg-white/25 border border-white/40 p-3">
                <div className="text-[11px] text-muted-foreground mb-1">
                  Goal
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={health.target}
                  onChange={(e) =>
                    updateField("target", Number(e.target.value))
                  }
                  className="w-full bg-transparent outline-none text-lg font-semibold"
                />
              </label>
            </div>

            <label className="block rounded-2xl bg-white/25 border border-white/40 p-3">
              <div className="text-[11px] text-muted-foreground mb-1">
                Program
              </div>
              <input
                value={health.program}
                onChange={(e) => updateField("program", e.target.value)}
                className="w-full bg-transparent outline-none text-sm font-medium"
              />
            </label>

            <button
              type="button"
              onClick={resetValue}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset health data
            </button>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/25 border border-white/40 p-3">
                <div className="text-[11px] text-muted-foreground mb-1">
                  Current
                </div>
                <div className="text-2xl font-semibold">
                  {health.current}
                  <span className="text-sm ml-1 text-muted-foreground">kg</span>
                </div>
              </div>

              <div className="rounded-2xl bg-white/25 border border-white/40 p-3">
                <div className="text-[11px] text-muted-foreground mb-1">
                  Goal
                </div>
                <div className="text-2xl font-semibold">
                  {health.target}
                  <span className="text-sm ml-1 text-muted-foreground">kg</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>

              <div className="h-2 rounded-full bg-white/30 overflow-hidden">
                <div
                  className="h-full rounded-full progress-gradient transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white/25 border border-white/40 p-3">
              <div className="text-xs text-muted-foreground">Program</div>
              <div className="text-sm font-medium mt-1">{health.program}</div>
            </div>
          </>
        )}
      </div>
    </GlassCard>
  );
};