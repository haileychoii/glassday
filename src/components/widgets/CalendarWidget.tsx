import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";

type CalendarEvent = {
  id: string;
  time: string;
  title: string;
};

const defaultEvents: CalendarEvent[] = [
  { id: "work", time: "08:40", title: "Work Start" },
  { id: "study", time: "19:30", title: "NCS Study" },
  { id: "english", time: "22:00", title: "English Practice" },
];

export const CalendarWidget = () => {
  const {
    value: events,
    setValue: setEvents,
  } = useLocalStorage<CalendarEvent[]>(
    "glassday.calendar",
    defaultEvents
  );

  const updateEvent = <K extends keyof CalendarEvent>(
    id: string,
    key: K,
    value: CalendarEvent[K]
  ) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === id
          ? {
              ...event,
              [key]: value,
            }
          : event
      )
    );
  };

  const addEvent = () => {
    setEvents((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        time: "09:00",
        title: "New Event",
      },
    ]);
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const sortedEvents = [...events].sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  return (
    <GlassCard
      title="Calendar"
      subtitle="Editable now · Google sync later."
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
          {sortedEvents.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl bg-white/25 border border-white/40 p-3 flex items-center gap-2"
            >
              <input
                type="time"
                value={event.time}
                onChange={(e) =>
                  updateEvent(event.id, "time", e.target.value)
                }
                className="w-24 bg-white/25 border border-white/35 rounded-xl px-2 py-1 text-xs outline-none"
              />

              <input
                value={event.title}
                onChange={(e) =>
                  updateEvent(event.id, "title", e.target.value)
                }
                className="flex-1 min-w-0 bg-transparent outline-none text-sm font-medium border-b border-transparent focus:border-white/50"
              />

              <button
                type="button"
                onClick={() => removeEvent(event.id)}
                className="w-7 h-7 rounded-full bg-white/30 border border-white/40 flex items-center justify-center hover:bg-white/50 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addEvent}
          className="mt-4 h-10 rounded-2xl accent-soft-card flex items-center justify-center gap-2 hover:bg-white/45 transition"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add Event</span>
        </button>
      </div>
    </GlassCard>
  );
};