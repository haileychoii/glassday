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
  controller: ReturnType<typeof usePomodoroTimer>;
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
    startFocusSession,
    dismissCompletionPrompt,
  } = controller;
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

  return (
    <div
      ref={surfaceRef}
      className={cn(
        "timer-widget-layout",
        showSettings && "is-settings-visible",
        floating && "is-floating-mode"
      )}
    >
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
            >
              {getPomodoroModeLabel(mode)}
            </button>
          ))}
        </div>

        <div className="timer-widget-focus-stage" style={progressStyle}>
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
        </div>

        <div className="timer-widget-meta">
          {activeLabel} · {pomodoro.completedFocusSessions} focus sessions
        </div>

        <div className="timer-widget-action-row">
          <button type="button" onClick={toggle} className="timer-widget-primary">
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

          <button type="button" onClick={reset} className="timer-widget-secondary">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <button type="button" onClick={skip} className="timer-widget-secondary">
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

export const TimerWidget = () => {
  const [floatingOpen, setFloatingOpen] = useState(false);
  const timerController = usePomodoroTimer();
  const { pomodoro, remainingSeconds } = timerController;

  return (
    <>
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
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      >
        <TimerSurface controller={timerController} />
      </GlassCard>

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
