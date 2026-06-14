import { BriefcaseBusiness } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";

const applications = [
  {
    company: "Korean Re",
    status: "Preparing",
  },
  {
    company: "RGA",
    status: "Completed",
  },
  {
    company: "Public Pension Fund",
    status: "Preparing",
  },
];

export const CareerWidget = () => {
  return (
    <GlassCard
      title="Career Command Center"
      subtitle="Insurance · Finance"
      icon={<BriefcaseBusiness className="w-4 h-4" />}
    >
      <div className="space-y-3">
        {applications.map((app) => (
          <div
            key={app.company}
            className="flex items-center justify-between rounded-2xl bg-white/30 border border-white/40 p-3"
          >
            <div>
              <div className="text-sm font-medium">
                {app.company}
              </div>

              <div className="text-xs text-muted-foreground">
                Application Pipeline
              </div>
            </div>

            <span className="text-xs px-3 py-1 rounded-full bg-white/40">
              {app.status}
            </span>
          </div>
        ))}

        <div className="rounded-2xl accent-soft-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Next Deadline
          </div>

          <div className="text-lg font-semibold mt-1">
            D-5
          </div>
        </div>
      </div>
    </GlassCard>
  );
};