import { Activity, RotateCcw } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";

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
      subtitle="Editable and saved locally."
      icon={<Activity className="w-4 h-4" />}
    >
      <div className="space-y-4">
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
              onChange={(e) => updateField("current", Number(e.target.value))}
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
              onChange={(e) => updateField("target", Number(e.target.value))}
              className="w-full bg-transparent outline-none text-lg font-semibold"
            />
          </label>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="tabular-nums">{Math.round(progress)}%</span>
          </div>

          <div className="h-2 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full rounded-full progress-gradient transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-xs text-muted-foreground mt-2">
            {remaining}kg to go
          </div>
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
          className="edit-only flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset health data
        </button>
      </div>
    </GlassCard>
  );
};