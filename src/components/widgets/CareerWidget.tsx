import { BriefcaseBusiness, Plus, Trash2 } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";

type CareerStatus = "Preparing" | "Submitted" | "Completed";

type CareerItem = {
  id: string;
  company: string;
  role: string;
  status: CareerStatus;
};

const defaultApplications: CareerItem[] = [
  {
    id: "korean-re",
    company: "Korean Re",
    role: "Reinsurance Underwriter",
    status: "Preparing",
  },
  {
    id: "rga",
    company: "RGA",
    role: "Actuarial Analyst",
    status: "Completed",
  },
  {
    id: "pension",
    company: "Public Pension Fund",
    role: "Investment Strategy",
    status: "Preparing",
  },
];

export const CareerWidget = () => {
  const {
    value: applications,
    setValue: setApplications,
  } = useLocalStorage<CareerItem[]>(
    "glassday.career",
    defaultApplications
  );

  const updateApplication = <K extends keyof CareerItem>(
    id: string,
    key: K,
    value: CareerItem[K]
  ) => {
    setApplications((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    );
  };

  const addApplication = () => {
    const id = crypto.randomUUID();

    setApplications((prev) => [
      ...prev,
      {
        id,
        company: "New Company",
        role: "New Role",
        status: "Preparing",
      },
    ]);
  };

  const removeApplication = (id: string) => {
    setApplications((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <GlassCard
      title="Career Command Center"
      subtitle="Editable application pipeline."
      icon={<BriefcaseBusiness className="w-4 h-4" />}
    >
      <div className="space-y-3">
        {applications.map((app) => (
          <div
            key={app.id}
            className="rounded-2xl bg-white/25 border border-white/40 p-3 space-y-2"
          >
            <div className="flex gap-2">
              <input
                value={app.company}
                onChange={(e) =>
                  updateApplication(app.id, "company", e.target.value)
                }
                className="flex-1 min-w-0 bg-transparent outline-none text-sm font-semibold border-b border-transparent focus:border-white/50"
              />

              <button
                type="button"
                onClick={() => removeApplication(app.id)}
                className="edit-only w-7 h-7 rounded-full bg-white/30 border border-white/40 flex items-center justify-center hover:bg-white/50 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <input
              value={app.role}
              onChange={(e) =>
                updateApplication(app.id, "role", e.target.value)
              }
              className="w-full bg-transparent outline-none text-xs text-muted-foreground border-b border-transparent focus:border-white/50"
            />

            <select
              value={app.status}
              onChange={(e) =>
                updateApplication(
                  app.id,
                  "status",
                  e.target.value as CareerStatus
                )
              }
              className="w-full rounded-xl bg-white/30 border border-white/40 px-3 py-2 text-xs outline-none"
            >
              <option value="Preparing">Preparing</option>
              <option value="Submitted">Submitted</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        ))}

        <button
          type="button"
          onClick={addApplication}
          className="edit-only w-full h-10 rounded-2xl accent-soft-card flex items-center justify-center gap-2 text-sm hover:bg-white/45 transition"        >
          <Plus className="w-4 h-4" />
          Add application
        </button>
      </div>
    </GlassCard>
  );
};