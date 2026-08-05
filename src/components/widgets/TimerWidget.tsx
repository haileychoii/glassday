/**
 * ============================================================
 * [Figma Mapping] Dashboard / Pomodoro Timer Widget
 * ============================================================
 *
 * 화면 역할:
 * - Focus/Short Break/Long Break timer를 실행하고 완료 후 다음 session을 제안한다.
 * - 같은 timer controller를 Grid Widget과 작은 Floating Window에서 공유한다.
 *
 * 연결:
 * - Renderer: DashboardGrid (WidgetId: timer)
 * - State/Persistence: src/components/widgets/timer/usePomodoroTimer.ts
 * - Types/helpers: src/types/study.ts, studyUtils
 * - Floating shell: src/components/common/FloatingWindow.tsx
 * - Style: src/styles/widgets/timer.css + theme/responsive overrides
 *
 * Figma 구조:
 * - Mode Segmented Control, Progress Clock, Primary Controls, Completion Prompt,
 *   optional Session Settings
 * - Variants: Focus / Break / Running / Paused / Complete / Compact / Floating
 * ============================================================
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  TimerReset,
} from "lucide-react";

import { FloatingWindow } from "../common/FloatingWindow";
import { GlassCard } from "../glass/GlassCard";
import { cn } from "../../lib/utils";
import {
  formatTimerClock,
  getPomodoroModeDurationSeconds,
  getPomodoroModeLabel,
} from "./study/studyUtils";
import { usePomodoroTimer } from "./timer/usePomodoroTimer";

const progressRadius = 48;
const progressCircumference = 2 * Math.PI * progressRadius;

type TimerSurfaceProps = {
  /** Widget와 Floating Window가 공유하는 Pomodoro state/action controller. */
  controller: ReturnType<typeof usePomodoroTimer>;
  /** 작은 floating presentation에 필요한 class Variant를 켠다. */
  floating?: boolean;
};

const TimerSurface = ({
  controller,
  floating = false,
}: TimerSurfaceProps) => {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const {
    pomodoro,
    remainingSeconds,
    activeLabel,
    suggestedBreakMode,
    completionPrompt,
    setMode,
    startMode,
    toggle,
    reset,
    skip,
    updateMinutes,
    setFocusMinutes,
    startFocusSession,
    dismissCompletionPrompt,
  } = controller;
  const [timeEditorOpen, setTimeEditorOpen] = useState(false);
  const [draftFocusMinutes, setDraftFocusMinutes] = useState("25");
  const totalSeconds = getPomodoroModeDurationSeconds(pomodoro, pomodoro.mode);
  const elapsedSeconds = Math.max(0, totalSeconds - remainingSeconds);
  const progressRatio =
    totalSeconds > 0 ? Math.min(1, elapsedSeconds / totalSeconds) : 0;
  const progressDashOffset =
    progressCircumference * (1 - progressRatio);
  const modeLabel =
    pomodoro.mode === "focus"
      ? "Focus"
      : pomodoro.mode === "short-break"
        ? "Short break"
        : "Long break";
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingRestSeconds = remainingSeconds % 60;
  const remainingLabel =
    remainingMinutes > 0
      ? `${remainingMinutes}m ${remainingRestSeconds}s left`
      : `${remainingRestSeconds}s left`;
  const progressStyle = {
    "--timer-progress": progressRatio,
  } as CSSProperties;

  useEffect(() => {
    setDraftFocusMinutes(String(pomodoro.focusMinutes || 25));
  }, [pomodoro.focusMinutes]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const updateSettingsVisibility = (width: number, height: number) => {
      // The stepper panel only belongs in a clearly expanded timer.
      // Compact widget/floating sizes stay glanceable with no hidden lower UI.
      setShowSettings(width >= 640 && height >= 320);
    };

    updateSettingsVisibility(surface.clientWidth, surface.clientHeight);

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      updateSettingsVisibility(entry.contentRect.width, entry.contentRect.height);
    });

    observer.observe(surface);

    return () => observer.disconnect();
  }, []);

  const applyDraftFocusMinutes = (closeEditor = true) => {
    const parsedMinutes = Number(draftFocusMinutes);

    if (!Number.isFinite(parsedMinutes)) {
      setDraftFocusMinutes(String(pomodoro.focusMinutes || 25));
      return;
    }

    setFocusMinutes(parsedMinutes);

    if (closeEditor) {
      setTimeEditorOpen(false);
    }
  };

  const adjustFocusMinutes = (delta: number) => {
    const nextMinutes = Math.min(
      180,
      Math.max(1, Math.round((pomodoro.focusMinutes || 25) + delta))
    );

    setDraftFocusMinutes(String(nextMinutes));
    setFocusMinutes(nextMinutes);
  };

  return (
    <div
      ref={surfaceRef}
      className={cn(
        "timer-widget-layout",
        showSettings && "is-settings-visible",
        floating && "is-floating-mode"
      )}
    >
      {/* Figma Frame: Primary Timer Surface / Mode + Clock + Actions */}
      <section className="timer-widget-main-card">
        <div className="timer-widget-mode-row">
          {(["focus", "short-break", "long-break"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setMode(mode)}
              className={cn(
                "timer-widget-mode-button",
                pomodoro.mode === mode && "is-active"
              )}
              aria-pressed={pomodoro.mode === mode}
            >
              {getPomodoroModeLabel(mode)}
            </button>
          ))}
        </div>

        <div className="timer-widget-time-editor-shell">
          <button
            type="button"
            className="timer-widget-focus-stage timer-widget-time-button"
            style={progressStyle}
            onClick={() => setTimeEditorOpen((open) => !open)}
            aria-label="Change focus timer length"
            aria-expanded={timeEditorOpen}
          >
            <svg
              className="timer-widget-progress-svg"
              viewBox="0 0 120 120"
              aria-hidden="true"
            >
              <circle
                className="timer-widget-progress-track"
                cx="60"
                cy="60"
                r={progressRadius}
              />
              <circle
                className="timer-widget-progress-value"
                cx="60"
                cy="60"
                r={progressRadius}
                strokeDasharray={progressCircumference}
                strokeDashoffset={progressDashOffset}
              />
            </svg>

            <span className="timer-widget-progress-dot" aria-hidden="true" />

            <div className="timer-widget-clock-stack">
              <div className="timer-widget-clock">
                {formatTimerClock(remainingSeconds)}
              </div>
              <div className="timer-widget-duration-label">
                {Math.round(totalSeconds / 60)}m {modeLabel}
              </div>
              <div className="timer-widget-remaining-label">{remainingLabel}</div>
            </div>
          </button>

          {timeEditorOpen && (
            <div className="timer-widget-time-popover" role="dialog">
              <div className="timer-widget-time-popover-title">
                Focus minutes
              </div>

              <div className="timer-widget-time-edit-row">
                <button
                  type="button"
                  onClick={() => adjustFocusMinutes(-5)}
                  aria-label="Decrease focus minutes"
                >
                  -
                </button>
                <input
                  value={draftFocusMinutes}
                  onChange={(event) =>
                    setDraftFocusMinutes(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      applyDraftFocusMinutes();
                    }
                  }}
                  inputMode="numeric"
                  type="number"
                  min={1}
                  max={180}
                />
                <button
                  type="button"
                  onClick={() => adjustFocusMinutes(5)}
                  aria-label="Increase focus minutes"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="timer-widget-time-apply"
                onClick={() => applyDraftFocusMinutes()}
              >
                Apply
              </button>
            </div>
          )}
        </div>

        <div className="timer-widget-meta">
          {activeLabel} · {pomodoro.completedFocusSessions} focus sessions
        </div>

        <div className="timer-widget-action-row">
          <button
            type="button"
            onClick={toggle}
            className="timer-widget-primary"
            aria-label={pomodoro.isRunning ? "Pause timer" : "Start timer"}
          >
            {pomodoro.isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Start
              </>
            )}
          </button>

          <button
            type="button"
            onClick={reset}
            className="timer-widget-secondary"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <button
            type="button"
            onClick={skip}
            className="timer-widget-secondary"
            aria-label="Skip to next timer mode"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Next
          </button>
        </div>

        {completionPrompt && (
          <section className="timer-widget-prompt">
            <div className="timer-widget-prompt-copy">
              {completionPrompt === "take-break"
                ? "Focus session complete. Take a break or start another focus."
                : "Break complete. Ready to start another focus session?"}
            </div>

            <div className="timer-widget-prompt-actions">
              {completionPrompt === "take-break" ? (
                <>
                  <button
                    type="button"
                    onClick={() => startMode(suggestedBreakMode)}
                    className="timer-widget-primary"
                  >
                    {getPomodoroModeLabel(suggestedBreakMode)}
                  </button>

                  <button
                    type="button"
                    onClick={() => startFocusSession(pomodoro.focusMinutes)}
                    className="timer-widget-secondary"
                  >
                    Another Focus
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => startFocusSession(pomodoro.focusMinutes)}
                    className="timer-widget-primary"
                  >
                    Start Focus
                  </button>

                  <button
                    type="button"
                    onClick={dismissCompletionPrompt}
                    className="timer-widget-secondary"
                  >
                    Later
                  </button>
                </>
              )}
            </div>
          </section>
        )}
      </section>

      {/* Figma Variant: Expanded Session Length Settings */}
      {showSettings && (
        <section className="timer-widget-settings-card">
          <div className="timer-widget-settings-title">Session Lengths</div>

          <div className="timer-widget-stepper-grid">
            <label>
              <span>Focus</span>
              <div className="timer-widget-stepper">
                <button
                  type="button"
                  onClick={() => updateMinutes("focusMinutes", -5)}
                >
                  -
                </button>
                <strong>{pomodoro.focusMinutes}m</strong>
                <button
                  type="button"
                  onClick={() => updateMinutes("focusMinutes", 5)}
                >
                  +
                </button>
              </div>
            </label>

            <label>
              <span>Short</span>
              <div className="timer-widget-stepper">
                <button
                  type="button"
                  onClick={() => updateMinutes("shortBreakMinutes", -1)}
                >
                  -
                </button>
                <strong>{pomodoro.shortBreakMinutes}m</strong>
                <button
                  type="button"
                  onClick={() => updateMinutes("shortBreakMinutes", 1)}
                >
                  +
                </button>
              </div>
            </label>

            <label>
              <span>Long</span>
              <div className="timer-widget-stepper">
                <button
                  type="button"
                  onClick={() => updateMinutes("longBreakMinutes", -5)}
                >
                  -
                </button>
                <strong>{pomodoro.longBreakMinutes}m</strong>
                <button
                  type="button"
                  onClick={() => updateMinutes("longBreakMinutes", 5)}
                >
                  +
                </button>
              </div>
            </label>
          </div>
        </section>
      )}
    </div>
  );
};

/** Grid와 Floating presentation이 동일한 usePomodoroTimer instance를 공유하는 host. */
export const TimerWidget = () => {
  const [floatingOpen, setFloatingOpen] = useState(false);
  const timerController = usePomodoroTimer();
  const { pomodoro, remainingSeconds } = timerController;

  return (
    <>
      {/* Figma Component: Timer Widget / compact responsive surface */}
      <GlassCard
        className="timer-widget"
        title="Timer"
        subtitle={`${getPomodoroModeLabel(pomodoro.mode)} · ${formatTimerClock(
          remainingSeconds
        )}`}
        icon={<TimerReset className="w-4 h-4" />}
        actions={
          <div className="timer-widget-header-actions">
            <button
              type="button"
              onClick={() => setFloatingOpen(true)}
              className="glass-button h-8 w-8 flex items-center justify-center"
              title="Open floating timer"
              aria-label="Open floating timer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      >
        <TimerSurface controller={timerController} />
      </GlassCard>

      {/* Figma Component: Floating Timer / Always-on-top style compact Variant */}
      <FloatingWindow
        open={floatingOpen}
        onClose={() => setFloatingOpen(false)}
        title="Floating Timer"
        subtitle="Keep the pomodoro clock above other widgets"
        storageKey="glassday.timer.floating.rect.v1"
        defaultRect={{ x: 180, y: 120, w: 360, h: 320 }}
        minWidth={320}
        minHeight={260}
        className="timer-floating-window"
      >
        <div className="timer-floating-body">
          <TimerSurface controller={timerController} floating />
        </div>
      </FloatingWindow>
    </>
  );
};
