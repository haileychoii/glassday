import { LayoutGrid, Settings, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  applyTheme,
  getCurrentTheme,
  themeOptions,
  topbarThemeOptions,
  type ThemeId,
} from "../../constants/themes";

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

  const isTopbarTheme = useMemo(() => {
    return topbarThemeOptions.some((item) => item.id === theme);
  }, [theme]);

  const currentThemeLabel = useMemo(() => {
    return themeOptions.find((item) => item.id === theme)?.label ?? "Theme";
  }, [theme]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-title">
          <div className="topbar-title-row">
            <Sparkles className="topbar-sparkle" />
            <h1>Good Morning, Junhee</h1>
          </div>

          <p>Focus. Create. Elevate.</p>
        </div>

        <div className="topbar-actions">
          <div
            className="theme-segmented-control theme-button-group"
            aria-label="Theme selector"
          >
            {topbarThemeOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTheme(item.id)}
                className={cn(
                  "theme-segment-button",
                  theme === item.id && "is-active"
                )}
                title={item.description}
              >
                {item.label}
              </button>
            ))}
          </div>

          <select
            className="theme-select-mobile"
            value={isTopbarTheme ? theme : ""}
            onChange={(event) => setTheme(event.target.value as ThemeId)}
            aria-label="Theme selector"
          >
            {!isTopbarTheme && (
              <option value="" disabled>
                {currentThemeLabel}
              </option>
            )}

            {topbarThemeOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenSettings}
            className="glass-button topbar-action-button"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={onToggleEditMode}
            className={cn(
              "glass-button topbar-action-button",
              editMode && "is-active"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{editMode ? "Done" : "Edit"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};