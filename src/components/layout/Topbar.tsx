import { useEffect, useState } from "react";
import {
  Bell,
  LayoutGrid,
  Moon,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";

import { cn } from "../../lib/utils";

type ThemeId = "pastel" | "glass" | "ios";
type ModeId = "apply" | "study" | "rest";

type TopbarProps = {
  editMode: boolean;
  onToggleEditMode: () => void;
  onOpenSettings: () => void;
};

const themeOptions: { id: ThemeId; label: string }[] = [
  { id: "pastel", label: "Pastel" },
  { id: "glass", label: "Glass" },
  { id: "ios", label: "iOS" },
];

const modeOptions: { id: ModeId; label: string }[] = [
  { id: "apply", label: "Apply" },
  { id: "study", label: "Study" },
  { id: "rest", label: "Rest" },
];

const getInitialTheme = (): ThemeId => {
  const saved = localStorage.getItem("glassday.theme.v1");

  if (saved === "pastel" || saved === "glass" || saved === "ios") {
    return saved;
  }

  return "glass";
};

export const Topbar = ({
  editMode,
  onToggleEditMode,
  onOpenSettings,
}: TopbarProps) => {
  const [theme, setTheme] = useState<ThemeId>(getInitialTheme);
  const [mode, setMode] = useState<ModeId>("apply");

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("theme-pastel", "theme-glass", "theme-ios");
    root.classList.add(`theme-${theme}`);

    localStorage.setItem("glassday.theme.v1", theme);
  }, [theme]);

  return (
    <header className="h-[86px] shrink-0 border-b border-white/30 bg-white/[0.06] backdrop-blur-3xl px-4 md:px-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="glass-icon-box">
            <Sparkles className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold tracking-tight truncate">
              Good Morning, Junhee
            </h1>

            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Focus. Create. Elevate.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden xl:flex items-center gap-3 flex-1 max-w-[420px]">
        <div className="glass-control h-10 px-3 flex items-center gap-2 w-full">
          <Search className="w-4 h-4 text-muted-foreground" />

          <input
            className="bg-transparent outline-none border-none text-sm w-full placeholder:text-muted-foreground"
            placeholder="Search memo, schedule, career..."
            spellCheck={false}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden lg:flex glass-control h-10 p-1 items-center gap-1">
          {modeOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-medium transition",
                mode === item.id
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/40"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex glass-control h-10 p-1 items-center gap-1">
          {themeOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-medium transition",
                theme === item.id
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/40"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onToggleEditMode}
          className={cn(
            "glass-button h-10 px-3 text-xs flex items-center gap-1.5",
            editMode && "is-active"
          )}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          {editMode ? "Done Layout" : "Layout Mode"}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="glass-button h-10 px-3 text-xs flex items-center gap-1.5"
        >
          <Settings className="w-3.5 h-3.5" />
          Settings
        </button>

        <button
          type="button"
          className="glass-button h-10 w-10 flex items-center justify-center"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        <button
          type="button"
          className="glass-button h-10 w-10 flex items-center justify-center"
          title="Night mode"
        >
          <Moon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};