import { useEffect, useState } from "react";
import { Bell, CalendarCheck, Lock, Pencil, Search } from "lucide-react";
import { cn } from "../../lib/utils";

type Theme = "pastel" | "glass" | "ios";

type TopbarProps = {
  editMode: boolean;
  onToggleEditMode: () => void;
};

const themes: { id: Theme; label: string }[] = [
  { id: "pastel", label: "Pastel" },
  { id: "glass", label: "Glass" },
  { id: "ios", label: "iOS" },
];

export const Topbar = ({ editMode, onToggleEditMode }: TopbarProps) => {
  const [theme, setTheme] = useState<Theme>("glass");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-pastel", "theme-glass", "theme-ios");
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <header className="h-[64px] px-5 md:px-6 border-b border-white/35 bg-white/10 backdrop-blur-3xl">
      <div className="h-full flex items-center justify-between gap-4">
        <div className="hidden md:flex items-center gap-2 h-10 px-4 rounded-full bg-white/35 border border-white/50 backdrop-blur-2xl">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search your OS..."
            className="w-52 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onToggleEditMode}
            className={cn(
              "h-10 px-4 rounded-full border text-sm flex items-center gap-2 transition",
              editMode
                ? "bg-foreground text-background border-foreground shadow-soft"
                : "bg-white/35 border-white/50 text-foreground hover:bg-white/55"
            )}
          >
            {editMode ? (
              <Pencil className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            <span>{editMode ? "Edit Mode" : "View Mode"}</span>
          </button>

          <button className="h-10 px-4 rounded-full bg-white/35 border border-white/50 text-sm flex items-center gap-2 hover:bg-white/55 transition">
            <CalendarCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Google Calendar</span>
          </button>

          <div className="h-10 px-1.5 rounded-full bg-white/35 border border-white/50 flex items-center">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs transition-all",
                  theme === t.id
                    ? "bg-foreground text-background shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button className="w-10 h-10 rounded-full bg-white/35 border border-white/50 flex items-center justify-center hover:bg-white/55 transition">
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};