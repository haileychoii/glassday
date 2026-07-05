import { Plus, Trash2 } from "lucide-react";

import { cn } from "../../lib/utils";
import type { DashboardTab } from "../../types/workspace";

type WorkspaceTabsNavProps = {
  tabs: DashboardTab[];
  activeTabId: string;
  editMode: boolean;
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
  onSelectTab,
  onAddTab,
  onRenameTab,
  onRemoveTab,
  className,
  addButtonClassName,
  showAddButton = false,
}: WorkspaceTabsNavProps) => {
  return (
    <>
      <nav
        className={cn("sidebar-workspace-list", className)}
        aria-label="Workspaces"
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "sidebar-tab-item",
              activeTabId === tab.id && "is-active"
            )}
          >
            <button
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className="sidebar-tab-main"
            >
              <span className="sidebar-tab-icon">{tab.icon}</span>

              {editMode && !tab.locked ? (
                <input
                  value={tab.label}
                  onChange={(event) => onRenameTab(tab.id, event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  className="sidebar-tab-input"
                  spellCheck={false}
                  aria-label={`${tab.label} workspace name`}
                />
              ) : (
                <span className="sidebar-tab-label">{tab.label}</span>
              )}
            </button>

            {editMode && !tab.locked && (
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
          className={cn("glass-button sidebar-add-button", addButtonClassName)}
          title="Add workspace"
          aria-label="Add workspace"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
    </>
  );
};
