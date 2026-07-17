import { useEffect, useRef, useState } from "react";

import { useLocalStorage } from "../../../hooks/useLocalStorage";
import type { StudyPomodoroMode, StudyPomodoroState } from "../../../types/study";
import {
  getPomodoroModeDurationSeconds,
  getPomodoroModeLabel,
} from "../study/studyUtils";

export const defaultPomodoroState: StudyPomodoroState = {
  mode: "focus",
  remainingSeconds: 25 * 60,
  isRunning: false,
  endsAt: null,
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  completedFocusSessions: 0,
};

const FOCUS_DEFAULT_MIGRATION_KEY =
  "glassday.study.pomodoro.focus-default-25.v1";

const clampMinutes = (minutes: number) => {
  return Math.min(180, Math.max(1, Math.round(minutes)));
};

export const getSuggestedBreakMode = (
  pomodoro: StudyPomodoroState
): StudyPomodoroMode => {
  const nextCompletedCount = pomodoro.completedFocusSessions + 1;

  return nextCompletedCount % pomodoro.longBreakEvery === 0
    ? "long-break"
    : "short-break";
};

/* Shared pomodoro state.
   Study and Timer widgets intentionally read from the same local storage key
   so the user sees one timer memory across layouts and workspaces. */
export const usePomodoroTimer = () => {
  const [now, setNow] = useState(Date.now());
  const completionRef = useRef<number | null>(null);
  const [completionPrompt, setCompletionPrompt] = useState<
    "take-break" | "resume-focus" | null
  >(null);

  const { value: pomodoro, setValue: setPomodoro } =
    useLocalStorage<StudyPomodoroState>(
      "glassday.study.pomodoro.v1",
      defaultPomodoroState
    );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(FOCUS_DEFAULT_MIGRATION_KEY)) return;

    window.localStorage.setItem(FOCUS_DEFAULT_MIGRATION_KEY, "1");

    setPomodoro((prev) => {
      if (prev.focusMinutes === defaultPomodoroState.focusMinutes) {
        return prev;
      }

      const nextState = {
        ...prev,
        focusMinutes: defaultPomodoroState.focusMinutes,
      };

      return prev.mode === "focus" && !prev.isRunning
        ? {
            ...nextState,
            endsAt: null,
            remainingSeconds: defaultPomodoroState.remainingSeconds,
          }
        : nextState;
    });
  }, [setPomodoro]);

  const remainingSeconds =
    pomodoro.isRunning && pomodoro.endsAt
      ? Math.max(0, Math.ceil((pomodoro.endsAt - now) / 1000))
      : pomodoro.remainingSeconds;

  const activeLabel = getPomodoroModeLabel(pomodoro.mode);
  const suggestedBreakMode = getSuggestedBreakMode(pomodoro);

  const setMode = (mode: StudyPomodoroMode) => {
    setCompletionPrompt(null);
    setPomodoro((prev) => ({
      ...prev,
      mode,
      isRunning: false,
      endsAt: null,
      remainingSeconds: getPomodoroModeDurationSeconds(prev, mode),
    }));
  };

  const startMode = (mode: StudyPomodoroMode) => {
    setCompletionPrompt(null);
    setPomodoro((prev) => {
      const nextRemainingSeconds = getPomodoroModeDurationSeconds(prev, mode);

      return {
        ...prev,
        mode,
        isRunning: true,
        endsAt: Date.now() + nextRemainingSeconds * 1000,
        remainingSeconds: nextRemainingSeconds,
      };
    });
  };

  const toggle = () => {
    setCompletionPrompt(null);
    setPomodoro((prev) => {
      if (prev.isRunning) {
        return {
          ...prev,
          isRunning: false,
          remainingSeconds,
          endsAt: null,
        };
      }

      return {
        ...prev,
        isRunning: true,
        endsAt: Date.now() + remainingSeconds * 1000,
      };
    });
  };

  const reset = () => {
    setCompletionPrompt(null);
    setPomodoro((prev) => ({
      ...prev,
      isRunning: false,
      endsAt: null,
      remainingSeconds: getPomodoroModeDurationSeconds(prev, prev.mode),
    }));
  };

  const skip = () => {
    setCompletionPrompt(null);
    setPomodoro((prev) => {
      const nextMode: StudyPomodoroMode =
        prev.mode === "focus" ? suggestedBreakMode : "focus";

      return {
        ...prev,
        mode: nextMode,
        isRunning: false,
        endsAt: null,
        remainingSeconds: getPomodoroModeDurationSeconds(prev, nextMode),
      };
    });
  };

  const updateMinutes = (
    key: "focusMinutes" | "shortBreakMinutes" | "longBreakMinutes",
    delta: number
  ) => {
    setPomodoro((prev) => {
      const nextValue = clampMinutes(prev[key] + delta);
      const nextState = {
        ...prev,
        [key]: nextValue,
      };
      const targetMode: StudyPomodoroMode =
        key === "focusMinutes"
          ? "focus"
          : key === "shortBreakMinutes"
            ? "short-break"
            : "long-break";

      return prev.mode === targetMode
        ? {
            ...nextState,
            isRunning: false,
            endsAt: null,
            remainingSeconds: getPomodoroModeDurationSeconds(
              nextState,
              targetMode
            ),
          }
        : nextState;
    });
  };

  const setFocusMinutes = (minutes: number) => {
    const nextMinutes = clampMinutes(minutes);

    setCompletionPrompt(null);
    setPomodoro((prev) => ({
      ...prev,
      focusMinutes: nextMinutes,
      mode: "focus",
      isRunning: false,
      endsAt: null,
      remainingSeconds: nextMinutes * 60,
    }));
  };

  const startFocusSession = (minutes = pomodoro.focusMinutes) => {
    setCompletionPrompt(null);
    setPomodoro((prev) => ({
      ...prev,
      focusMinutes: minutes,
      mode: "focus",
      isRunning: true,
      remainingSeconds: minutes * 60,
      endsAt: Date.now() + minutes * 60 * 1000,
    }));
  };

  const dismissCompletionPrompt = () => {
    setCompletionPrompt(null);
  };

  useEffect(() => {
    if (!pomodoro.isRunning) return;

    setNow(Date.now());

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [pomodoro.isRunning]);

  useEffect(() => {
    if (!pomodoro.isRunning || !pomodoro.endsAt || remainingSeconds > 0) {
      return;
    }

    if (completionRef.current === pomodoro.endsAt) {
      return;
    }

    completionRef.current = pomodoro.endsAt;

    setPomodoro((prev) => ({
      ...prev,
      isRunning: false,
      endsAt: null,
      remainingSeconds: 0,
      completedFocusSessions:
        prev.mode === "focus"
          ? prev.completedFocusSessions + 1
          : prev.completedFocusSessions,
    }));

    setCompletionPrompt(
      pomodoro.mode === "focus" ? "take-break" : "resume-focus"
    );
  }, [pomodoro.isRunning, pomodoro.endsAt, pomodoro.mode, remainingSeconds, setPomodoro]);

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
