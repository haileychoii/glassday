import { CalendarDays, Plus } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";

const events = [
  {
    time: "08:40",
    title: "Work Start",
  },
  {
    time: "19:30",
    title: "NCS Study",
  },
  {
    time: "22:00",
    title: "English Practice",
  },
];

export const CalendarWidget = () => {
  return (
    <GlassCard
      title="Calendar"
      subtitle="Google Calendar Sync"
      icon={<CalendarDays className="w-4 h-4" />}
    >
      <div className="h-full flex flex-col">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 space-y-2 overflow-auto">
          {events.map((event) => (
            <div
              key={event.time}
              className="rounded-2xl bg-white/30 border border-white/40 p-3"
            >
              <div className="text-xs text-muted-foreground">
                {event.time}
              </div>

              <div className="text-sm font-medium mt-1">
                {event.title}
              </div>
            </div>
          ))}
        </div>

        <button className="mt-4 h-10 rounded-2xl bg-white/35 border border-white/45 flex items-center justify-center gap-2 hover:bg-white/50 transition">
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add Event</span>
        </button>
      </div>
    </GlassCard>
  );
};