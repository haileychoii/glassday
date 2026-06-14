import { BookOpen } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";

const subjects = [
  {
    name: "Actuarial Exam",
    progress: 42,
  },
  {
    name: "NCS",
    progress: 58,
  },
  {
    name: "Essay Writing",
    progress: 35,
  },
  {
    name: "English",
    progress: 70,
  },
];

export const StudyWidget = () => {
  return (
    <GlassCard
      title="Study Progress"
      subtitle="Steady progress beats intensity."
      icon={<BookOpen className="w-4 h-4" />}
    >
      <div className="space-y-4">
        {subjects.map((subject) => (
          <div key={subject.name}>
            <div className="flex justify-between text-xs mb-2">
              <span>{subject.name}</span>
              <span className="text-muted-foreground">
                {subject.progress}%
              </span>
            </div>

            <div className="h-2 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${subject.progress}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};