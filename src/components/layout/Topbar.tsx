import { LayoutGrid, Settings, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {
  applyTheme,
  getCurrentTheme,
  themeOptions,
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

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <header className="topbar h-[86px] shrink-0 border-b border-white/30 bg-white/[0.08] backdrop-blur-3xl">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        <div className="topbar-title min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />

            <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">
              Good Morning, Junhee
            </h1>
          </div>

          <p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">
            Focus. Create. Elevate.
          </p>
        </div>

        <div className="topbar-actions flex items-center gap-2">
          <div
            className="theme-segmented-control theme-button-group"
           