import { useEffect, useState } from "react";
import { Bell, CalendarCheck, Grid3X3, Lock, Search } from "lucide-react";
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
    <header className="h-[68px] px-5 md:px-6 border-b border-white/35 bg-white/[0.08] backdrop-blur-3xl">
      <div className="h-full flex items-center justify-between gap-4">
        <div className="hidden md:flex items-center gap-2 h-10 px-4 rounded-full glass-control min-w-[270px]">
          <Search className="w-4 h-4 text-muted-foreground" />

          <input
            placeholder="Search your OS..."
            className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            spellCheck={false}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onToggleEditMode}
            className={cn(
              "glass-button h-10 px-4 text-sm flex items-center gap-2",
              editMode && "is-active"
            )}
          >
            {editMode ? (
              <Grid3X3 className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}

            <span>{editMode ? "Layout Mode" : "Layout Locked"}</span>
          </button>

          <button className="glass-button h-10 px-4 text-sm flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Google Calendar</span>
          </button>

          <div className="glass-control h-10 px-1.5 rounded-full flex items-center gap-1">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={cn(
                  "theme-pill",
                  theme === t.id && "is-active"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button className="glass-button w-10 h-10 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};