/**
 * ============================================================
 * [Timer Hook] Persistent Pomodoro Controller
 * ============================================================
 * Consumer: src/components/widgets/TimerWidget.tsx
 * Persistence: useLocalStorage / glassday.study.pomodoro.v1
 * 역할: mode, remaining time, running deadline, completed sessions와 완료 prompt를 관리한다.
 * TimerWidget의 Grid/Floating presentation이 같은 Hook instance를 공유하므로 두 화면이 동기화된다.
 * Figma Variant state: Focus/Break, Running/Paused, Completion Prompt Open.
 * ============================================================
 */
import { useEffect, useRef, useState } from "react";

import { useLocalStorage } from "../../../hooks/useLocalStorage";
import type {
  StudyPomodoroMode,
  StudyPomodoroState,
} from "../../../types/study";
import {
  getPomodoroModeDurationSeconds,
  getPomodoroModeLabel,
} from "../study/studyUtils";

const POMODORO_STORAGE_KEY =
  "glassday.study.pomodoro.v1";

const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_SHORT_BREAK_MINUTES = 5;
const DEFAULT_LONG_BREAK_MINUTES = 15;
const DEFAULT_LONG_BREAK_EVERY = 4;

/*
 * 기존 20분 저장값을 25분으로 한 번 교정하기 위한 키.
 * 이전 v1 키가 이미 저장되어 있을 수 있으므로 v2로 올린다.
 */
const FOCUS_DEFAULT_MIGRATION_KEY =
  "glassday.study.pomodoro.focus-default-25.v2";

export const defaultPomodoroState: StudyPomodoroState = {
  mode: "focus",
  remainingSeconds: DEFAULT_FOCUS_MINUTES * 60,
  isRunning: false,
  endsAt: null,
  focusMinutes: DEFAULT_FOCUS_MINUTES,
  shortBreakMinutes: DEFAULT_SHORT_BREAK_MINUTES,
  longBreakMinutes: DEFAULT_LONG_BREAK_MINUTES,
  longBreakEvery: DEFAULT_LONG_BREAK_EVERY,
  completedFocusSessions: 0,
};

const clampMinutes = (minutes: number) => {
  const safeMinutes = Number.isFinite(minutes)
    ? minutes
    : DEFAULT_FOCUS_MINUTES;

  return Math.min(
    180,
    Math.max(1, Math.round(safeMinutes))
  );
};

const clampLongBreakEvery = (sessions: number) => {
  const safeSessions = Number.isFinite(sessions)
    ? sessions
    : DEFAULT_LONG_BREAK_EVERY;

  return Math.min(
    12,
    Math.max(1, Math.round(safeSessions))
  );
};

const getCurrentRemainingSeconds = (
  pomodoro: StudyPomodoroState,
  currentTime = Date.now()
) => {
  if (!pomodoro.isRunning || !pomodoro.endsAt) {
    return Math.max(0, pomodoro.remainingSeconds);
  }

  return Math.max(
    0,
    Math.ceil(
      (pomodoro.endsAt - currentTime) / 1000
    )
  );
};

export const getSuggestedBreakMode = (
  pomodoro: StudyPomodoroState
): StudyPomodoroMode => {
  const nextCompletedCount =
    pomodoro.completedFocusSessions + 1;

  const longBreakEvery = clampLongBreakEvery(
    pomodoro.longBreakEvery
  );

  return nextCompletedCount % longBreakEvery === 0
    ? "long-break"
    : "short-break";
};

/*
 * Study 위젯과 Timer 위젯은 같은 localStorage 키를 사용한다.
 * 따라서 어느 화면에서 사용해도 동일한 타이머 상태를 공유한다.
 */
/** Pomodoro state와 모든 user action을 한 controller object로 반환한다. */
export const usePomodoroTimer = () => {
  const [now, setNow] = useState(() => Date.now());

  const completionRef = useRef<number | null>(
    null
  );

  const [
    completionPrompt,
    setCompletionPrompt,
  ] = useState<
    "take-break" | "resume-focus" | null
  >(null);

  const {
    value: pomodoro,
    setValue: setPomodoro,
  } = useLocalStorage<StudyPomodoroState>(
    POMODORO_STORAGE_KEY,
    defaultPomodoroState
  );

  /*
   * 예전에 저장된 20분 기본값을 25분으로 한 번 교정한다.
   *
   * - 실행 중인 타이머는 현재 세션을 유지한다.
   * - 실행 중이 아닌 Focus 타이머는 즉시 25:00으로 변경한다.
   * - focusMinutes가 이미 25여도 remainingSeconds가 20분이면 교정한다.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const migrationCompleted =
      window.localStorage.getItem(
        FOCUS_DEFAULT_MIGRATION_KEY
      );

    if (migrationCompleted === "1") {
      return;
    }

    window.localStorage.setItem(
      FOCUS_DEFAULT_MIGRATION_KEY,
      "1"
    );

    setPomodoro((previous) => {
      const isIdleFocus =
        previous.mode === "focus" &&
        !previous.isRunning;

      return {
        ...previous,

        focusMinutes: DEFAULT_FOCUS_MINUTES,

        longBreakEvery: clampLongBreakEvery(
          previous.longBreakEvery
        ),

        ...(isIdleFocus
          ? {
              remainingSeconds:
                DEFAULT_FOCUS_MINUTES * 60,
              endsAt: null,
            }
          : {}),
      };
    });
  }, [setPomodoro]);

  const remainingSeconds =
    getCurrentRemainingSeconds(pomodoro, now);

  const activeLabel = getPomodoroModeLabel(
    pomodoro.mode
  );

  const suggestedBreakMode =
    getSuggestedBreakMode(pomodoro);

  const setMode = (
    mode: StudyPomodoroMode
  ) => {
    setCompletionPrompt(null);

    setPomodoro((previous) => ({
      ...previous,
      mode,
      isRunning: false,
      endsAt: null,
      remainingSeconds:
        getPomodoroModeDurationSeconds(
          previous,
          mode
        ),
    }));
  };

  const startMode = (
    mode: StudyPomodoroMode
  ) => {
    setCompletionPrompt(null);

    setPomodoro((previous) => {
      const nextRemainingSeconds =
        getPomodoroModeDurationSeconds(
          previous,
          mode
        );

      return {
        ...previous,
        mode,
        isRunning: true,
        remainingSeconds:
          nextRemainingSeconds,
        endsAt:
          Date.now() +
          nextRemainingSeconds * 1000,
      };
    });
  };

  const toggle = () => {
    setCompletionPrompt(null);

    setPomodoro((previous) => {
      if (previous.isRunning) {
        const pausedRemainingSeconds =
          getCurrentRemainingSeconds(
            previous
          );

        return {
          ...previous,
          isRunning: false,
          remainingSeconds:
            pausedRemainingSeconds,
          endsAt: null,
        };
      }

      const nextRemainingSeconds =
        Math.max(
          0,
          previous.remainingSeconds
        );

      /*
       * 완료된 0초 상태에서 다시 시작을 누르면
       * 현재 모드의 전체 시간으로 다시 시작한다.
       */
      const startSeconds =
        nextRemainingSeconds > 0
          ? nextRemainingSeconds
          : getPomodoroModeDurationSeconds(
              previous,
              previous.mode
            );

      return {
        ...previous,
        isRunning: true,
        remainingSeconds: startSeconds,
        endsAt:
          Date.now() + startSeconds * 1000,
      };
    });
  };

  const reset = () => {
    setCompletionPrompt(null);

    setPomodoro((previous) => ({
      ...previous,
      isRunning: false,
      endsAt: null,
      remainingSeconds:
        getPomodoroModeDurationSeconds(
          previous,
          previous.mode
        ),
    }));
  };

  const skip = () => {
    setCompletionPrompt(null);

    setPomodoro((previous) => {
      const nextMode: StudyPomodoroMode =
        previous.mode === "focus"
          ? getSuggestedBreakMode(previous)
          : "focus";

      return {
        ...previous,
        mode: nextMode,
        isRunning: false,
        endsAt: null,
        remainingSeconds:
          getPomodoroModeDurationSeconds(
            previous,
            nextMode
          ),
      };
    });
  };

  const updateMinutes = (
    key:
      | "focusMinutes"
      | "shortBreakMinutes"
      | "longBreakMinutes",
    delta: number
  ) => {
    setCompletionPrompt(null);

    setPomodoro((previous) => {
      const currentMinutes =
        Number.isFinite(previous[key])
          ? previous[key]
          : key === "focusMinutes"
            ? DEFAULT_FOCUS_MINUTES
            : key === "shortBreakMinutes"
              ? DEFAULT_SHORT_BREAK_MINUTES
              : DEFAULT_LONG_BREAK_MINUTES;

      const nextValue = clampMinutes(
        currentMinutes + delta
      );

      const nextState: StudyPomodoroState = {
        ...previous,
        [key]: nextValue,
      };

      const targetMode: StudyPomodoroMode =
        key === "focusMinutes"
          ? "focus"
          : key === "shortBreakMinutes"
            ? "short-break"
            : "long-break";

      if (previous.mode !== targetMode) {
        return nextState;
      }

      return {
        ...nextState,
        isRunning: false,
        endsAt: null,
        remainingSeconds:
          getPomodoroModeDurationSeconds(
            nextState,
            targetMode
          ),
      };
    });
  };

  const setFocusMinutes = (
    minutes: number
  ) => {
    const nextMinutes =
      clampMinutes(minutes);

    setCompletionPrompt(null);

    setPomodoro((previous) => ({
      ...previous,
      focusMinutes: nextMinutes,
      mode: "focus",
      isRunning: false,
      endsAt: null,
      remainingSeconds:
        nextMinutes * 60,
    }));
  };

  const startFocusSession = (
    minutes = pomodoro.focusMinutes
  ) => {
    const nextMinutes =
      clampMinutes(minutes);

    const nextRemainingSeconds =
      nextMinutes * 60;

    setCompletionPrompt(null);

    setPomodoro((previous) => ({
      ...previous,
      focusMinutes: nextMinutes,
      mode: "focus",
      isRunning: true,
      remainingSeconds:
        nextRemainingSeconds,
      endsAt:
        Date.now() +
        nextRemainingSeconds * 1000,
    }));
  };

  const dismissCompletionPrompt = () => {
    setCompletionPrompt(null);
  };

  useEffect(() => {
    if (!pomodoro.isRunning) {
      return;
    }

    setNow(Date.now());

    const intervalId =
      window.setInterval(() => {
        setNow(Date.now());
      }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [pomodoro.isRunning]);

  useEffect(() => {
    if (
      !pomodoro.isRunning ||
      !pomodoro.endsAt ||
      remainingSeconds > 0
    ) {
      return;
    }

    if (
      completionRef.current ===
      pomodoro.endsAt
    ) {
      return;
    }

    completionRef.current =
      pomodoro.endsAt;

    const completedMode =
      pomodoro.mode;

    setPomodoro((previous) => ({
      ...previous,
      isRunning: false,
      endsAt: null,
      remainingSeconds: 0,
      completedFocusSessions:
        completedMode === "focus"
          ? previous.completedFocusSessions +
            1
          : previous.completedFocusSessions,
    }));

    setCompletionPrompt(
      completedMode === "focus"
        ? "take-break"
        : "resume-focus"
    );
  }, [
    pomodoro.isRunning,
    pomodoro.endsAt,
    pomodoro.mode,
    remainingSeconds,
    setPomodoro,
  ]);

  return {
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
  };
};
