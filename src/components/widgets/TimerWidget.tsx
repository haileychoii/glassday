/**
 * Glassday / TimerWidget
 * 경로: src/components/widgets/TimerWidget.tsx
 *
 * 화면: 모바일/PC 대시보드의 뽀모도로 타이머와 기존 FloatingWindow.
 * 연결: WidgetRenderer.tsx (id="timer") → WidgetSlot.tsx → 이 컴포넌트.
 * 상태: timer/usePomodoroTimer.ts → glassday.study.pomodoro.v1(localStorage).
 * 서식: styles/widgets/timer.css (PC 공통 + 마지막 모바일 전용 섹션).
 *
 * 원칙: usePomodoroTimer()는 TimerWidget에서 한 번만 호출한다.
 * 위젯과 플로팅 창이 같은 controller를 전달받으므로 타이머가 두 번 돌지 않는다.
 * 각 TimerSurface의 팝오버 상태만 화면별 UI 상태로 분리한다.
 */
import { useEffect, useRef, useState } from "react";
import {
  Maximize2, Pause, Play, RotateCcw, SkipForward, TimerReset,
} from "lucide-react";
import { FloatingWindow } from "../common/FloatingWindow";
import { GlassCard } from "../glass/GlassCard";
import { cn } from "../../lib/utils";
import type { StudyPomodoroMode } from "../../types/study";
import {
  formatTimerClock,
  getPomodoroModeDurationSeconds,
  getPomodoroModeLabel,
} from "./study/studyUtils";
import { usePomodoroTimer } from "./timer/usePomodoroTimer";

/** SVG viewBox=120의 원형 진행선. CSS의 점 장식을 없애 반지름 중복 계산을 제거했다. */
const RADIUS = 48;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Controller = ReturnType<typeof usePomodoroTimer>;
type DurationKey = "focusMinutes" | "shortBreakMinutes" | "longBreakMinutes";

/** 버튼·설정 패널이 동일한 정보를 사용하도록 모드 정의를 한 곳에 모은다. */
const MODES: readonly StudyPomodoroMode[] = ["focus", "short-break", "long-break"];
const DURATIONS: readonly { key: DurationKey; label: string; step: number }[] = [
  { key: "focusMinutes", label: "Focus", step: 5 },
  { key: "shortBreakMinutes", label: "Short", step: 1 },
  { key: "longBreakMinutes", label: "Long", step: 5 },
];

const getDurationKey = (mode: StudyPomodoroMode): DurationKey => {
  if (mode === "short-break") return "shortBreakMinutes";
  if (mode === "long-break") return "longBreakMinutes";
  return "focusMinutes";
};

/**
 * TimerSurface
 * - PC Widget / PC Floating / Mobile Widget / Mobile Floating이 공유하는 뷰.
 * - 컴포넌트 안에서 시간을 저장하지 않는다. 모든 타이머 동작은 controller로 전달.
 * - ResizeObserver는 PC의 넓은 타이머에서만 추가 설정 패널을 보여주기 위한 UI 판단.
 */
const TimerSurface = ({ controller, floating = false }: {
  controller: Controller;
  floating?: boolean;
}) => {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const {
    pomodoro, remainingSeconds, completionPrompt, suggestedBreakMode,
    setMode, startMode, toggle, reset, skip, updateMinutes,
    setFocusMinutes, startFocusSession, dismissCompletionPrompt,
  } = controller;

  const durationKey = getDurationKey(pomodoro.mode);
  const durationMinutes = pomodoro[durationKey];
  const [draftMinutes, setDraftMinutes] = useState(String(durationMinutes));

  // 열 때마다 현재 모드의 저장값으로 초기화하므로 값을 동기화하는 별도 Effect가 필요 없다.
  const toggleEditor = () => {
    if (!editorOpen) setDraftMinutes(String(durationMinutes));
    setEditorOpen((current) => !current);
  };

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setShowSettings(width >= 640 && height >= 320);
    });
    observer.observe(surface);
    return () => observer.disconnect();
  }, []);

  const selectMode = (mode: StudyPomodoroMode) => {
    setEditorOpen(false);
    setDraftMinutes(String(pomodoro[getDurationKey(mode)]));
    setMode(mode);
  };

  /** 원형 시계 편집기는 선택한 모드 하나만 수정한다. 별도 휴식 설정 폼 불필요. */
  const saveDuration = () => {
    const parsed = Number(draftMinutes);
    if (!Number.isFinite(parsed)) {
      setDraftMinutes(String(durationMinutes));
      return;
    }
    const next = Math.max(1, Math.min(180, Math.round(parsed)));
    if (next !== durationMinutes) {
      if (durationKey === "focusMinutes") setFocusMinutes(next);
      else updateMinutes(durationKey, next - durationMinutes);
    }
    setDraftMinutes(String(next));
    setEditorOpen(false);
  };

  const step = DURATIONS.find((item) => item.key === durationKey)?.step ?? 5;
  const adjustDraft = (delta: number) => {
    const current = Number(draftMinutes);
    setDraftMinutes(String(Math.max(1, Math.min(180, (Number.isFinite(current) ? current : durationMinutes) + delta))));
  };

  const totalSeconds = getPomodoroModeDurationSeconds(pomodoro, pomodoro.mode);
  const progress = totalSeconds > 0
    ? Math.max(0, Math.min(1, (totalSeconds - remainingSeconds) / totalSeconds))
    : 0;

  return (
    <div ref={surfaceRef} className={cn("timer-widget-layout", showSettings && "is-settings-visible", floating && "is-floating-mode")}>
      {/* 메인 영역: 모드 → 진행 링 → 조작 버튼. 실제 배치는 timer.css가 결정. */}
      <section className="timer-widget-main-card">
        <div className="timer-widget-mode-row" aria-label="Timer mode">
          {MODES.map((mode) => (
            <button key={mode} type="button" onClick={() => selectMode(mode)}
              className={cn("timer-widget-mode-button", pomodoro.mode === mode && "is-active")}
              aria-pressed={pomodoro.mode === mode}>
              {getPomodoroModeLabel(mode)}
            </button>
          ))}
        </div>

        {/* 링 클릭 → 현재 모드의 시간 수정. Focus/휴식용 UI를 중복 구현하지 않는다. */}
        <div className="timer-widget-time-editor-shell">
          <button type="button" className="timer-widget-focus-stage timer-widget-time-button"
            onClick={toggleEditor}
            aria-label={`Change ${getPomodoroModeLabel(pomodoro.mode)} duration`}
            aria-expanded={editorOpen}>
            <svg viewBox="0 0 120 120" className="timer-widget-progress-svg" aria-hidden="true">
              <circle className="timer-widget-progress-track" cx="60" cy="60" r={RADIUS} />
              <circle className="timer-widget-progress-value" cx="60" cy="60" r={RADIUS}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress)} />
            </svg>
            <span className="timer-widget-clock-stack">
              <strong className="timer-widget-clock">{formatTimerClock(remainingSeconds)}</strong>
              <span className="timer-widget-duration-label">{getPomodoroModeLabel(pomodoro.mode)}</span>
            </span>
          </button>

          {editorOpen && (
            <div className="timer-widget-time-popover" role="dialog"
              aria-label={`${getPomodoroModeLabel(pomodoro.mode)} duration`}>
              <strong className="timer-widget-time-popover-title">{getPomodoroModeLabel(pomodoro.mode)} · minutes</strong>
              <div className="timer-widget-time-edit-row">
                <button type="button" onClick={() => adjustDraft(-step)} aria-label={`Decrease ${step} minutes`}>−</button>
                <input type="number" min={1} max={180} inputMode="numeric" aria-label="Duration in minutes"
                  value={draftMinutes} onChange={(event) => setDraftMinutes(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") saveDuration(); }} />
                <button type="button" onClick={() => adjustDraft(step)} aria-label={`Increase ${step} minutes`}>+</button>
              </div>
              <button type="button" className="timer-widget-time-apply" onClick={saveDuration}>Apply</button>
            </div>
          )}
        </div>

        <div className="timer-widget-meta">{pomodoro.completedFocusSessions} focus sessions completed</div>

        {/* controller에서 실행/정지/초기화/다음 모드로 전환. UI는 타이머 로직에 관여하지 않음. */}
        <div className="timer-widget-action-row">
          <button type="button" onClick={toggle} className="timer-widget-primary"
            aria-label={pomodoro.isRunning ? "Pause timer" : "Start timer"}>
            {pomodoro.isRunning ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Start</>}
          </button>
          <button type="button" onClick={reset} className="timer-widget-secondary" aria-label="Reset timer">
            <RotateCcw size={15} /> Reset
          </button>
          <button type="button" onClick={skip} className="timer-widget-secondary" aria-label="Next timer mode">
            <SkipForward size={15} /> Next
          </button>
        </div>

        {/* 완료 시에만 노출. 훅에서 제안한 휴식 모드를 그대로 사용한다. */}
        {completionPrompt && (
          <div className="timer-widget-prompt" role="status">
            <p className="timer-widget-prompt-copy">
              {completionPrompt === "take-break"
                ? "Focus complete. Take a break?"
                : "Break complete. Ready to focus?"}
            </p>
            <div className="timer-widget-prompt-actions">
              {completionPrompt === "take-break" ? (
                <>
                  <button type="button" className="timer-widget-primary" onClick={() => startMode(suggestedBreakMode)}>
                    {getPomodoroModeLabel(suggestedBreakMode)}
                  </button>
                  <button type="button" className="timer-widget-secondary" onClick={() => startFocusSession(pomodoro.focusMinutes)}>
                    Focus again
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="timer-widget-primary" onClick={() => startFocusSession(pomodoro.focusMinutes)}>
                    Start focus
                  </button>
                  <button type="button" className="timer-widget-secondary" onClick={dismissCompletionPrompt}>Later</button>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 넓은 PC 타이머에만 표시되는 기존 Session Lengths. 같은 DURATIONS를 순회해 중복 JSX 제거. */}
      {showSettings && (
        <section className="timer-widget-settings-card" aria-label="Session lengths">
          <h4 className="timer-widget-settings-title">Session Lengths</h4>
          <div className="timer-widget-stepper-grid">
            {DURATIONS.map(({ key, label, step: amount }) => (
              <div key={key} className="timer-widget-setting">
                <span>{label}</span>
                <div className="timer-widget-stepper">
                  <button type="button" onClick={() => updateMinutes(key, -amount)} aria-label={`Decrease ${label}`}>−</button>
                  <strong>{pomodoro[key]}m</strong>
                  <button type="button" onClick={() => updateMinutes(key, amount)} aria-label={`Increase ${label}`}>+</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

/**
 * 하나의 usePomodoroTimer가 메인/플로팅 화면을 통제한다.
 * 새 TimerSurface를 만든다고 새 타이머 훅을 만들면 시간이 서로 어긋나므로 금지.
 */
export const TimerWidget = () => {
  const [floatingOpen, setFloatingOpen] = useState(false);
  const controller = usePomodoroTimer();

  return (
    <>
      <GlassCard className="timer-widget" title="Timer"
        subtitle={`${getPomodoroModeLabel(controller.pomodoro.mode)} · ${formatTimerClock(controller.remainingSeconds)}`}
        icon={<TimerReset size={16} />}
        actions={
          <button type="button" className="glass-button timer-widget-open" title="Open timer window"
            aria-label="Open timer window" onClick={() => setFloatingOpen(true)}>
            <Maximize2 size={15} />
          </button>
        }>
        <TimerSurface controller={controller} />
      </GlassCard>

      {/* FloatingWindow은 별도 포털이지만 같은 controller 사용. PC 좌표 저장은 기존 컴포넌트가 관리. */}
      <FloatingWindow open={floatingOpen} onClose={() => setFloatingOpen(false)}
        title="Floating Timer" subtitle="Pomodoro clock"
        storageKey="glassday.timer.floating.rect.v1"
        defaultRect={{ x: 180, y: 120, w: 360, h: 320 }}
        minWidth={320} minHeight={260} className="timer-floating-window">
        <div className="timer-floating-body">
          <TimerSurface controller={controller} floating />
        </div>
      </FloatingWindow>
    </>
  );
};
