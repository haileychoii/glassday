/**
 * ============================================================
 * [Figma Mapping] Dashboard / Health Widget
 * ============================================================
 *
 * 화면 역할: 시작/현재/목표 수치와 진행률을 직접 편집하는 compact life metric Widget.
 * Renderer: DashboardGrid (WidgetId: health)
 * Storage: useLocalStorage / glassday.health
 * Figma 구조: Metrics Grid, Program Field, Progress Bar, Reset Action
 * Variants: Default / Goal Reached / Editable Values
 * ============================================================
 */
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

/** HealthData를 Widget 내부 Source of Truth로 저장하는 editable summary component. */
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
    /* Theme hook:
       Keeps Health-specific surfaces selectable without coupling theme CSS
       to Tailwind utility names. / 테마 CSS에서 의미 있는 이름으로 찾는다. */
    <GlassCard
      title="Health Progress"
      subtitle="Editable and saved locally."
      icon={<Activity className="w-4 h-4" />}
      className="health-widget"
    >
      <div className="health-content space-y-4">
        {/* Figma Frame: Health Metrics / Three-column responsive grid */}
        <div className="health-metrics-grid grid grid-cols-3 gap-2">
          <label className="health-metric-card rounded-2xl bg-white/25 border border-white/40 p-3">
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

          <label className="health-metric-card rounded-2xl bg-white/25 border border-white/40 p-3">
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

          <label className="health-metric-card rounded-2xl bg-white/25 border border-white/40 p-3">
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

        <div className="health-progress-panel">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="tabular-nums">{Math.round(progress)}%</span>
          </div>

          <div className="health-progress-track h-2 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full rounded-full progress-gradient transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-xs text-muted-foreground mt-2">
            {remaining}kg to go
          </div>
        </div>

        <label className="health-program-card block rounded-2xl bg-white/25 border border-white/40 p-3">
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
          className="health-reset-button edit-only flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
          aria-label="Reset health data"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset health data
        </button>
      </div>
    </GlassCard>
  );
};
