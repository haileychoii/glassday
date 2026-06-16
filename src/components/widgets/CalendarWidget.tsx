import { useState } from "react";
import { CalendarDays, Pencil, Plus, Trash2, Lock } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";

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
  const [editing, setEditing] = useState(false);

  const { value: events, setValue: setEvents } =
    useLocalStorage<CalendarEvent[]>("glassday.calendar", defaultEvents);

  const updateEvent = <K extends keyof CalendarEvent>(
    id: string,
    key: K,
    value: CalendarEvent[K]
  ) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === id ? { ...event, [key]: value } : event
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

  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <GlassCard
      title="Calendar"
      subtitle={editing ? "Editing events" : "Today schedule"}
      icon={<CalendarDays className="w-4 h-4" />}
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
          {editing ? <Lock className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
          {editing ? "Done" : "Edit"}
        </button>
      }
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 space-y-2 overflow-auto">
          {sortedEvents.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl bg-white/25 border border-white/40 p-3 flex items-center gap-2"
            >
              {editing ? (
                <>
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
                    className="flex-1 min-w-0 bg-transparent outline-none text-sm font-medium border-b border-white/30"
                  />

                  <button
                    type="button"
                    onClick={() => removeEvent(event.id)}
                    className="w-7 h-7 rounded-full bg-white/30 border border-white/40 flex items-center justify-center hover:bg-white/50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <div className="w-14 text-xs text-muted-foreground">
                    {event.time}
                  </div>
                  <div className="text-sm font-medium truncate">
                    {event.title}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {editing && (
          <button
            type="button"
            onClick={addEvent}
            className="mt-4 h-10 rounded-2xl accent-soft-card flex items-center justify-center gap-2 hover:bg-white/45 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add Event</span>
          </button>
        )}
      </div>
    </GlassCard>
  );
};