import { LayoutGrid, Settings, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { applyTheme, getCurrentTheme, themeOptions, type ThemeId } from "../../constants/themes";
import { cn } from "../../lib/utils";

type TopbarProps = {
  editMode: boolean;
  onToggleEditMode: () => void;
  onOpenSettings: () => void;
};

export const Topbar = ({
  editMode,
  onToggleEditMode,
  onOpenSettings,
}: TopbarProps) => {
  const [theme, setTheme] = useState<ThemeId>(() => getCurrentTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <header className="topbar h-[86px] shrink-0 border-b border-white/30 bg-white/[0.08] backdrop-blur-3xl">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Good Morning, Junhee
            </h1>
          </div>

          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Focus. Create. Elevate.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value as ThemeId)}
            className="theme-select"
          >
            {themeOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenSettings}
            className="glass-button h-9 px-3 text-xs flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </button>

          <button
            type="button"
            onClick={onToggleEditMode}
            className={cn(
              "glass-button h-9 px-3 text-xs flex items-center gap-1.5",
              editMode && "is-active"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            {editMode ? "Done" : "Edit"}
          </button>
        </div>
      </div>
    </header>
  );
};