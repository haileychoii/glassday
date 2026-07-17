import { useState } from "react";
import {
  Clock3,
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
import { formatTimerClock, getPomodoroModeLabel } from "./study/studyUtils";
import { usePomodoroTimer } from "./timer/usePomodoroTimer";

const focusPresets = [15, 25, 50] as const;

type TimerSurfaceProps = {
  controller: ReturnType<typeof usePomodoroTimer>;
  floating?: boolean;
};

const TimerSurface = ({
  controller,
  floating = false,
}: TimerSurfaceProps) => {
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
    applyFocusPreset,
    startFocusSession,
    dismissCompletionPrompt,
  } = controller;

  return (
    <div className={cn("timer-widget-layout", floating && "is-floating-mode")}>
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

        <div className="timer-widget-clock">{formatTimerClock(remainingSeconds)}</div>

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

        <div className="timer-widget-presets">
          {focusPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => applyFocusPreset(preset)}
              className={cn(
                "timer-widget-preset",
                pomodoro.mode === "focus" &&
                  pomodoro.focusMinutes === preset &&
                  !pomodoro.isRunning &&
                  "is-active"
              )}
            >
              {preset}m
            </button>
          ))}
        </div>

        {completionPrompt && (
          <section className="timer-widget-prompt">
            <div className="timer-widget-prompt-copy">
              {completionPrompt === "take-break"
                ? "Focus session complete. Take a break or start another 25 minutes."
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
                    onClick={() => startFocusSession(25)}
                    className="timer-widget-secondary"
                  >
                    Another 25m
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => startFocusSession(25)}
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
