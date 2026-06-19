import { useMemo, useState } from "react";
import {
  Check,
  Circle,
  ClipboardCheck,
  Flame,
  Plus,
  Trash2,
} from "lucide-react";

import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";

type TaskPriority = "low" | "normal" | "high";

type TodayTask = {
  id: string;
  title: string;
  done: boolean;
  priority: TaskPriority;
  createdAt: number;
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const defaultTasks: TodayTask[] = [
  {
    id: "task-1",
    title: "오늘 일정 확인하기",
    done: false,
    priority: "normal",
    createdAt: Date.now(),
  },
  {
    id: "task-2",
    title: "지원 마감 회사 체크하기",
    done: false,
    priority: "high",
    createdAt: Date.now(),
  },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];

const sortTasks = (tasks: TodayTask[]) => {
  const priorityRank: Record<TaskPriority, number> = {
    high: 0,
    normal: 1,
    low: 2,
  };

  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (priorityRank[a.priority] !== priorityRank[b.priority]) {
      return priorityRank[a.priority] - priorityRank[b.priority];
    }

    return a.createdAt - b.createdAt;
  });
};

export const TodayTasksWidget = () => {
  const { value: tasks, setValue: setTasks } = useLocalStorage<TodayTask[]>(
    "glassday.today.tasks.v1",
    defaultTasks
  );

  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("normal");

  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks]);

  const doneCount = tasks.filter((task) => task.done).length;
  const totalCount = tasks.length;
  const progress = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const addTask = () => {
    const title = newTask.trim();

    if (!title) return;

    setTasks((prev) => [
      {
        id: createId(),
        title,
        done: false,
        priority: newPriority,
        createdAt: Date.now(),
      },
      ...prev,
    ]);

    setNewTask("");
    setNewPriority("normal");
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              done: !task.done,
            }
          : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const updatePriority = (id: string, priority: TaskPriority) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              priority,
            }
          : task
      )
    );
  };

  return (
    <GlassCard
      title="Today Tasks"
      subtitle={`${doneCount}/${totalCount} done · ${progress}%`}
      icon={<ClipboardCheck className="w-4 h-4" />}
      className="today-tasks-card"
    >
      <div className="today-tasks">
        <section className="today-tasks-progress">
          <div>
            <div className="today-tasks-progress-label">Completion</div>
            <div className="today-tasks-progress-value">{progress}%</div>
          </div>

          <div className="today-tasks-progress-track">
            <div
              className="today-tasks-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <section className="today-task-add-row">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addTask();
              }
            }}
            placeholder="오늘 할 일 추가"
            spellCheck={false}
          />

          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button type="button" onClick={addTask} title="Add task">
            <Plus className="w-4 h-4" />
          </button>
        </section>

        <section className="today-task-list">
          {sortedTasks.length === 0 ? (
            <div className="today-task-empty">
              오늘 할 일이 아직 없어.
            </div>
          ) : (
            sortedTasks.map((task) => (
              <article
                key={task.id}
                className={cn(
                  "today-task-item",
                  task.done && "is-done",
                  task.priority === "high" && "is-high"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className="today-task-check"
                  title={task.done ? "Mark undone" : "Mark done"}
                >
                  {task.done ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>

                <div className="today-task-main">
                  <div className="today-task-title">{task.title}</div>

                  <div className="today-task-meta">
                    {task.priority === "high" && (
                      <span className="today-task-hot">
                        <Flame className="w-3 h-3" />
                        High
                      </span>
                    )}

                    {task.priority !== "high" && (
                      <span>{task.priority}</span>
                    )}
                  </div>
                </div>

                <select
                  value={task.priority}
                  onChange={(e) =>
                    updatePriority(task.id, e.target.value as TaskPriority)
                  }
                  className="today-task-priority"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  className="today-task-delete"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </article>
            ))
          )}
        </section>
      </div>
    </GlassCard>
  );
};