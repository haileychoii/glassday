import {
  BookOpen,
  BriefcaseBusiness,
  FolderOpen,
  HeartPulse,
  House,
  NotebookPen,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

import { getCurrentTheme, type ThemeId } from "../../constants/themes";
import { cn } from "../../lib/utils";
import type { DashboardTab } from "../../types/workspace";

type WorkspaceTabsNavProps = {
  tabs: DashboardTab[];
  activeTabId: string;
  editMode: boolean;
  collapsed?: boolean;
  onSelectTab: (tabId: string) => void;
  onAddTab?: () => void;
  onRenameTab: (tabId: string, label: string) => void;
  onRemoveTab: (tabId: string) => void;
  className?: string;
  addButtonClassName?: string;
  showAddButton?: boolean;
};

export const WorkspaceTabsNav = ({
  tabs,
  activeTabId,
  editMode,
  collapsed = false,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onRemoveTab,
  className,
  addButtonClassName,
  showAddButton = false,
}: WorkspaceTabsNavProps) => {
  const [theme, setTheme] = useState<ThemeId>(() => getCurrentTheme());

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<ThemeId>;

      if (customEvent.detail) {
        setTheme(customEvent.detail);
      }
    };

    window.addEventListener("glassday-theme-change", handleThemeChange);

    return () => {
      window.removeEventListener("glassday-theme-change", handleThemeChange);
    };
  }, []);

  const renderTabIcon = (tab: DashboardTab) => {
    const iconClassName = cn(
      "workspace-theme-icon",
      `workspace-theme-icon-${theme}`
    );

    const iconMap: Record<string, typeof House> = {
      home: House,
      career: BriefcaseBusiness,
      study: BookOpen,
      memo: NotebookPen,
      life: HeartPulse,
    };

    const macEmojiMap: Record<string, string> = {
      home: "🏠",
      career: "💼",
      study: "📚",
      memo: "📝",
      life: "🌿",
    };

    if (theme === "mac-core") {
      return <span className={iconClassName}>{macEmojiMap[tab.id] ?? "✨"}</span>;
    }

    const Icon = iconMap[tab.id] ?? FolderOpen;

    return <Icon className={iconClassName} />;
  };

  return (
    <>
      <nav
        className={cn(
          "sidebar-workspace-list",
          collapsed && "sidebar-workspace-list-collapsed",
          className
        )}
        aria-label="Workspaces"
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "sidebar-tab-item",
              collapsed && "is-collapsed",
              activeTabId === tab.id && "is-active"
            )}
          >
            <button
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className="sidebar-tab-main"
              title={collapsed ? tab.label : undefined}
              aria-label={collapsed ? tab.label : undefined}
            >
              <span className="sidebar-tab-icon">{renderTabIcon(tab)}</span>

              {!collapsed && editMode && !tab.locked ? (
                <input
                  value={tab.label}
                  onChange={(event) => onRenameTab(tab.id, event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  className="sidebar-tab-input"
                  spellCheck={false}
                  aria-label={`${tab.label} workspace name`}
                />
              ) : !collapsed ? (
                <span className="sidebar-tab-label">{tab.label}</span>
              ) : (
                <span className="sr-only">{tab.label}</span>
              )}
            </button>

            {editMode && !collapsed && !tab.locked && (
              <button
                type="button"
                onClick={() => onRemoveTab(tab.id)}
                className="sidebar-tab-delete"
                title="Remove workspace"
                aria-label={`Remove ${tab.label}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </nav>

      {showAddButton && editMode && onAddTab && (
        <button
          type="button"
          onClick={onAddTab}
          className={cn(
            "glass-button sidebar-add-button",
            collapsed && "sidebar-add-button-collapsed",
            addButtonClassName
          )}
          title="Add workspace"
          aria-label="Add workspace"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
    </>
  );
};
