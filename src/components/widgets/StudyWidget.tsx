import { useState } from "react";
import { BookOpen, Lock, Pencil, RotateCcw } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";

type StudySubject = {
  id: string;
  name: string;
  progress: number;
};

const defaultSubjects: StudySubject[] = [
  { id: "actuarial", name: "Actuarial Exam", progress: 42 },
  { id: "ncs", name: "NCS", progress: 58 },
  { id: "essay", name: "Essay Writing", progress: 35 },
  { id: "english", name: "English", progress: 70 },
];

export const StudyWidget = () => {
  const [editing, setEditing] = useState(false);

  const {
    value: subjects,
    setValue: setSubjects,
    resetValue,
  } = useLocalStorage<StudySubject[]>("glassday.study", defaultSubjects);

  const updateProgress = (id: string, progress: number) => {
    const safeProgress = Math.max(0, Math.min(100, progress));

    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === id ? { ...subject, progress: safeProgress } : subject
      )
    );
  };

  const updateName = (id: string, name: string) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === id ? { ...subject, name } : subject
      )
    );
  };

  const average =
    subjects.length === 0
      ? 0
      : Math.round(
          subjects.reduce((sum, subject) => sum + subject.progress, 0) /
            subjects.length
        );

  return (
    <GlassCard
      title="Study Progress"
      subtitle={
        editing
          ? "Editing study data"
          : `Average progress ${average}%`
      }
      icon={<BookOpen className="w-4 h-4" />}
      actions={
        <button
          type="button"
          onClick={() => setEditing((prev) => !prev)}
          className={cn(
            "h-8 px-3 rounded-full text-xs border transition flex items-center gap-1.5",
            editing
              ? "bg-foreground text-background border-foreground"
              : "bg-white/35 border-white/50 text-muted-foreground hover:text-foreground"
          )}
        >
          {editing ? (
            <Lock className="w-3.5 h-3.5" />
          ) : (
            <Pencil className="w-3.5 h-3.5" />
          )}
          {editing ? "Done" : "Edit"}
        </button>
      }
    >
      <div className="space-y-4">
        {subjects.map((subject) => (
          <div key={subject.id} className="space-y-2">
            {editing ? (
              <div className="flex items-center justify-between gap-3">
                <input
                  value={subject.name}
                  onChange={(e) => updateName(subject.id, e.target.value)}
                  className="w-full bg-transparent text-xs font-medium outline-none border-b border-white/30 focus:border-white/60"
                />

                <input
                  type="number"
                  min={0}
                  max={100}
                  value={subject.progress}
                  onChange={(e) =>
                    updateProgress(subject.id, Number(e.target.value))
                  }
                  className="w-14 bg-white/30 border border-white/40 rounded-xl px-2 py-1 text-xs text-right outline-none"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium truncate">{subject.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {subject.progress}%
                </span>
              </div>
            )}

            <div className="h-2 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full rounded-full progress-gradient transition-all duration-300"
                style={{
                  width: `${subject.progress}%`,
                }}
              />
            </div>
          </div>
        ))}

        {editing && (
          <button
            type="button"
            onClick={resetValue}
            className="mt-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset study data
          </button>
        )}
      </div>
    </GlassCard>
  );
};