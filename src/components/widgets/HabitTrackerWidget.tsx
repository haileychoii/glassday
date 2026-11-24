import { useMemo, useState, type FormEvent } from "react";
import { Check, Flame, ListChecks, Plus, Trash2 } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";

type Habit = {
  id: string;
  name: string;
  completedDates: string[];
};

const STORAGE_KEY = "glassday.habits.tracker.v1";
const EMPTY_HABITS: Habit[] = [];

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStreak = (completedDates: string[], today: string) => {
  const completed = new Set(completedDates);
  const cursor = new Date(`${today}T12:00:00`);

  if (!completed.has(today)) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (completed.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const createHabitId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `habit-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeHabits = (value: Habit[]) => {
  if (!Array.isArray(value)) return EMPTY_HABITS;

  return value.filter(
    (habit): habit is Habit =>
      Boolean(habit) &&
      typeof habit.id === "string" &&
      typeof habit.name === "string" &&
      Array.isArray(habit.completedDates) &&
      habit.completedDates.every((date) => typeof date === "string")
  );
};

export const HabitTrackerWidget = () => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const { value, setValue } = useLocalStorage<Habit[]>(STORAGE_KEY, EMPTY_HABITS);
  const habits = useMemo(() => normalizeHabits(value), [value]);
  const today = getDateKey(new Date());
  const completedCount = habits.filter((habit) =>
    habit.completedDates.includes(today)
  ).length;
  const progress = habits.length
    ? Math.round((completedCount / habits.length) * 100)
    : 0;

  const addHabit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setValue((current) => [
      ...normalizeHabits(current),
      { id: createHabitId(), name: trimmedName, completedDates: [] },
    ]);
    setName("");
    setShowForm(false);
  };

  const toggleHabit = (habitId: string) => {
    setValue((current) =>
      normalizeHabits(current).map((habit) => {
        if (habit.id !== habitId) return habit;
        const completed = new Set(habit.completedDates);
        if (completed.has(today)) completed.delete(today);
        else completed.add(today);
        return { ...habit, completedDates: [...completed].sort() };
      })
    );
  };

  const removeHabit = (habitId: string) => {
    setValue((current) =>
      normalizeHabits(current).filter((habit) => habit.id !== habitId)
    );
  };

  return (
    <GlassCard
      title="Habit Tracker"
      subtitle={habits.length ? `오늘 ${completedCount}/${habits.length} 완료` : "오늘의 습관"}
      icon={<ListChecks className="h-4 w-4" />}
      className="habit-tracker-widget"
      actions={(
        <button
          type="button"
          className="habit-tracker__add-toggle"
          aria-label={showForm ? "습관 추가 닫기" : "습관 추가"}
          aria-expanded={showForm}
          onClick={() => setShowForm((open) => !open)}
        >
          {showForm ? <Check size={17} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
        </button>
      )}
    >
      <div className="habit-tracker__content">
        <div className="habit-tracker__progress">
          <div className="habit-tracker__progress-copy">
            <span>오늘의 진행률</span>
            <strong>{progress}%</strong>
          </div>
          <div
            className="habit-tracker__progress-track"
            role="progressbar"
            aria-label="오늘의 습관 진행률"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        {showForm && (
          <form className="habit-tracker__form" onSubmit={addHabit}>
            <label className="sr-only" htmlFor="habit-tracker-new-name">
              새 습관 이름
            </label>
            <input
              id="habit-tracker-new-name"
              autoFocus
              maxLength={32}
              placeholder="예: 10분 산책하기"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button type="submit" disabled={!name.trim()}>
              추가
            </button>
          </form>
        )}

        {habits.length ? (
          <ul className="habit-tracker__list">
            {habits.map((habit) => {
              const isComplete = habit.completedDates.includes(today);
              const streak = getStreak(habit.completedDates, today);

              return (
                <li className="habit-tracker__item" key={habit.id}>
                  <button
                    type="button"
                    className={`habit-tracker__check${isComplete ? " is-complete" : ""}`}
                    aria-label={`${habit.name} ${isComplete ? "완료 취소" : "완료"}`}
                    aria-pressed={isComplete}
                    onClick={() => toggleHabit(habit.id)}
                  >
                    {isComplete && <Check size={15} aria-hidden="true" />}
                  </button>
                  <span className={`habit-tracker__name${isComplete ? " is-complete" : ""}`}>
                    {habit.name}
                  </span>
                  <span className="habit-tracker__streak" aria-label={`연속 ${streak}일`}>
                    <Flame size={14} aria-hidden="true" />
                    {streak}
                  </span>
                  <button
                    type="button"
                    className="habit-tracker__remove"
                    aria-label={`${habit.name} 삭제`}
                    onClick={() => removeHabit(habit.id)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="habit-tracker__empty">
            <span>작은 습관부터 꾸준히 쌓아봐요.</span>
            <button type="button" onClick={() => setShowForm(true)}>
              <Plus size={15} aria-hidden="true" /> 첫 습관 추가
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
