import { LayoutGrid, Monitor, Settings, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  applyTheme,
  getCurrentTheme,
  themeOptions,
  topbarThemeOptions,
  type ThemeId,
} from "../../constants/themes";

import { cn } from "../../lib/utils";
import type { DashboardLayoutMode, DashboardTab } from "../../types/workspace";
import { WorkspaceTabsNav } from "./WorkspaceTabsNav";

type TopbarProps = {
  editMode: boolean;
  layoutMode: DashboardLayoutMode;
  tabs: DashboardTab[];
  activeTabId: string;
  onChangeLayoutMode: (mode: DashboardLayoutMode) => void;
  onToggleEditMode: () => void;
  onOpenSettings: () => void;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onRenameTab: (tabId: string, label: string) => void;
  onRemoveTab: (tabId: string) => void;
};

export const Topbar = ({
  editMode,
  layoutMode,
  tabs,
  activeTabId,
  onChangeLayoutMode,
  onToggleEditMode,
  onOpenSettings,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onRemoveTab,
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

  // SettingsModal에서 테마를 바꿨을 때 Topbar도 같이 따라오게 함
  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<ThemeId>;

      if (!customEvent.detail) return;

      setTheme(customEvent.detail);
    };

    window.addEventListener("glassday-theme-change", handleThemeChange);

    return () => {
      window.removeEventListener("glassday-theme-change", handleThemeChange);
    };
  }, []);

  const handleTopbarThemeChange = (nextTheme: ThemeId) => {
    setTheme(nextTheme);
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-heading">
          <div className="topbar-title">
            <div className="topbar-title-row">
              <Sparkles className="topbar-sparkle" />
              <h1>Good Morning, Junhee</h1>
            </div>

            <p>Focus. Create. Elevate.</p>
          </div>

          <div className="topbar-actions">
            <div className="layout-mode-toggle" aria-label="Layout mode">
              <button
                type="button"
                onClick={() => onChangeLayoutMode("wide")}
                className={cn(
                  "layout-mode-button",
                  layoutMode === "wide" && "is-active"
                )}
                title="Wide web layout"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Wide</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeLayoutMode("laptop")}
                className={cn(
                  "layout-mode-button",
                  layoutMode === "laptop" && "is-active"
                )}
                title="Laptop app preview layout"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Laptop</span>
              </button>
            </div>

            <div
              className="theme-segmented-control theme-button-group"
              aria-label="Theme selector"
            >
              {topbarThemeOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTopbarThemeChange(item.id)}
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
              onChange={(event) =>
                handleTopbarThemeChange(event.target.value as ThemeId)
              }
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

        <div className="topbar-mobile-workspaces">
          <WorkspaceTabsNav
            tabs={tabs}
            activeTabId={activeTabId}
            editMode={editMode}
            onSelectTab={onSelectTab}
            onAddTab={onAddTab}
            onRenameTab={onRenameTab}
            onRemoveTab={onRemoveTab}
            className="topbar-mobile-workspace-list"
            addButtonClassName="topbar-mobile-add-button"
            showAddButton
          />
        </div>
      </div>
    </header>
  );
};
