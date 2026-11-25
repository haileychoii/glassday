import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { Check, Flame, ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";

type Habit = {
  id: string;
  name: string;
  completedDates: string[];
  color?: string;
};

const STORAGE_KEY = "glassday.habits.tracker.v1";
const EMPTY_HABITS: Habit[] = [];
const HABIT_ACCENTS = ["#8b7df2", "#e6668d", "#43aa91", "#ef9a4d", "#4c94d8"];

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekDates = (date: Date) => {
  const monday = new Date(date);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
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
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(HABIT_ACCENTS[0]);
  const [name, setName] = useState("");
  const { value, setValue } = useLocalStorage<Habit[]>(STORAGE_KEY, EMPTY_HABITS);
  const habits = useMemo(() => normalizeHabits(value), [value]);
  const now = new Date();
  const today = getDateKey(now);
  const weekDates = useMemo(() => getWeekDates(now), [today]);
  const heatmapDates = useMemo(
    () => Array.from({ length: 28 }, (_, index) => {
      const day = new Date(now);
      day.setHours(12, 0, 0, 0);
      day.setDate(day.getDate() - (27 - index));
      return day;
    }),
    [today],
  );
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
      {
        id: createHabitId(),
        name: trimmedName,
        completedDates: [],
        color: HABIT_ACCENTS[normalizeHabits(value).length % HABIT_ACCENTS.length],
      },
    ]);
    setName("");
    setShowForm(false);
  };

  const toggleHabitDate = (habitId: string, date: string) => {
    setValue((current) =>
      normalizeHabits(current).map((habit) => {
        if (habit.id !== habitId) return habit;
        const completed = new Set(habit.completedDates);
        if (completed.has(date)) completed.delete(date);
        else completed.add(date);
        return { ...habit, completedDates: [...completed].sort() };
      })
    );
  };

  const startEditingHabit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setEditName(habit.name);
    const index = habits.findIndex((item) => item.id === habit.id);
    setEditColor(habit.color ?? HABIT_ACCENTS[Math.max(index, 0) % HABIT_ACCENTS.length]);
  };

  const saveHabit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = editName.trim();
    if (!editingHabitId || !trimmedName) return;

    setValue((current) => normalizeHabits(current).map((habit) =>
      habit.id === editingHabitId
        ? { ...habit, name: trimmedName, color: editColor }
        : habit
    ));
    setEditingHabitId(null);
    setEditName("");
    setEditColor(HABIT_ACCENTS[0]);
  };

  const cancelEditingHabit = () => {
    setEditingHabitId(null);
    setEditName("");
    setEditColor(HABIT_ACCENTS[0]);
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
              maxLength={24}
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
                    onClick={() => toggleHabitDate(habit.id, today)}
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

      <div className="habit-tracker__mobile" role="region" aria-label="주간 습관 기록">
        <div className="habit-tracker__mobile-summary">
          <div>
            <span>오늘의 달성</span>
            <strong>{completedCount}<small> / {habits.length}</small></strong>
          </div>
          <strong className="habit-tracker__mobile-percent">{progress}%</strong>
          <div className="habit-tracker__mobile-progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        {showForm && (
          <form className="habit-tracker__form habit-tracker__mobile-form" onSubmit={addHabit}>
            <label className="sr-only" htmlFor="habit-tracker-mobile-new-name">
              새 습관 이름
            </label>
            <input
              id="habit-tracker-mobile-new-name"
              maxLength={24}
              placeholder="새 습관 이름"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button type="submit" disabled={!name.trim()}>추가</button>
          </form>
        )}

        {habits.length ? (
          <>
            <div className="habit-tracker__week-heading">
              <span>이번 주</span>
              <span>{weekDates[0].getMonth() + 1}.{weekDates[0].getDate()} – {weekDates[6].getMonth() + 1}.{weekDates[6].getDate()}</span>
            </div>
            <div className="habit-tracker__week-labels" aria-hidden="true">
              {weekDates.map((day) => (
                <span key={getDateKey(day)}>
                  {new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(day)}
                </span>
              ))}
            </div>
            <ul className="habit-tracker__mobile-list">
              {habits.map((habit, index) => {
                const accent = habit.color ?? HABIT_ACCENTS[index % HABIT_ACCENTS.length];
                const streak = getStreak(habit.completedDates, today);
                const monthCount = heatmapDates.filter((day) =>
                  habit.completedDates.includes(getDateKey(day))
                ).length;
                const expanded = expandedHabitId === habit.id;
                const editing = editingHabitId === habit.id;

                return (
                  <li
                    className="habit-tracker__mobile-card"
                    key={habit.id}
                    style={{ "--habit-accent": accent } as CSSProperties}
                  >
                    <div className="habit-tracker__mobile-card-head">
                      <span className="habit-tracker__mobile-mark" aria-hidden="true">
                        <Check size={15} />
                      </span>
                      <strong className="habit-tracker__mobile-name">{habit.name}</strong>
                      <span className="habit-tracker__mobile-streak">
                        <Flame size={13} aria-hidden="true" /> {streak}일
                      </span>
                      <button
                        type="button"
                        className="habit-tracker__edit-toggle"
                        aria-label={`${habit.name} 이름 편집`}
                        onClick={() => startEditingHabit(habit)}
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="habit-tracker__history-toggle"
                        aria-expanded={expanded}
                        aria-label={`${habit.name} ${expanded ? "28일 기록 접기" : "28일 기록 보기"}`}
                        onClick={() => setExpandedHabitId(expanded ? null : habit.id)}
                      >
                        {expanded ? "주간" : "기록"}
                      </button>
                    </div>
                    {editing && (
                      <form className="habit-tracker__edit-form" onSubmit={saveHabit}>
                        <label className="sr-only" htmlFor={`habit-tracker-edit-${habit.id}`}>
                          {habit.name} 이름 수정
                        </label>
                        <input
                          id={`habit-tracker-edit-${habit.id}`}
                          maxLength={24}
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                        />
                        <div className="habit-tracker__edit-colors" role="group" aria-label="습관 색상">
                          {HABIT_ACCENTS.map((color, colorIndex) => (
                            <button
                              key={color}
                              type="button"
                              className={editColor === color ? "is-selected" : ""}
                              style={{ "--habit-swatch": color } as CSSProperties}
                              aria-label={`색상 ${colorIndex + 1}`}
                              aria-pressed={editColor === color}
                              onClick={() => setEditColor(color)}
                            />
                          ))}
                        </div>
                        <button type="submit" aria-label="습관 수정 저장" disabled={!editName.trim()}>
                          <Check size={15} aria-hidden="true" />
                        </button>
                        <button type="button" aria-label="이름 수정 취소" onClick={cancelEditingHabit}>
                          <X size={15} aria-hidden="true" />
                        </button>
                      </form>
                    )}
                    <div className="habit-tracker__week-days">
                      {weekDates.map((day) => {
                        const date = getDateKey(day);
                        const complete = habit.completedDates.includes(date);
                        const future = date > today;
                        const label = new Intl.DateTimeFormat("ko-KR", {
                          month: "long", day: "numeric", weekday: "long",
                        }).format(day);
                        return (
                          <button
                            key={date}
                            type="button"
                            className={`habit-tracker__day${complete ? " is-complete" : ""}${date === today ? " is-today" : ""}`}
                            style={{ "--habit-accent": accent } as CSSProperties}
                            aria-label={`${habit.name}, ${label}, ${complete ? "완료" : "미완료"}`}
                            aria-pressed={complete}
                            disabled={future}
                            onClick={() => toggleHabitDate(habit.id, date)}
                          >
                            <span>{complete ? <Check size={14} aria-hidden="true" /> : day.getDate()}</span>
                          </button>
                        );
                      })}
                    </div>
                    {expanded && (
                      <div className="habit-tracker__heatmap-wrap">
                        <div className="habit-tracker__heatmap-caption">
                          <span>최근 28일</span>
                          <span>{monthCount}/28 완료</span>
                        </div>
                        <div className="habit-tracker__heatmap">
                          {heatmapDates.map((day) => {
                            const date = getDateKey(day);
                            const complete = habit.completedDates.includes(date);
                            const label = new Intl.DateTimeFormat("ko-KR", {
                              month: "long", day: "numeric",
                            }).format(day);
                            return (
                              <button
                                key={date}
                                type="button"
                                className={`habit-tracker__heatmap-cell${complete ? " is-complete" : ""}${date === today ? " is-today" : ""}`}
                                style={{ "--habit-accent": accent } as CSSProperties}
                                aria-label={`${habit.name}, ${label}, ${complete ? "완료" : "미완료"}`}
                                aria-pressed={complete}
                                onClick={() => toggleHabitDate(habit.id, date)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="habit-tracker__mobile-empty">
            <span>작은 습관을 하나씩 기록해 보세요.</span>
            <button type="button" onClick={() => setShowForm(true)}>
              <Plus size={16} aria-hidden="true" /> 습관 추가
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
