import { Plus, Trash2 } from "lucide-react";

import { cn } from "../../lib/utils";
import type { DashboardTab } from "../../types/workspace";

type SidebarProps = {
  tabs: DashboardTab[];
  activeTabId: string;
  editMode: boolean;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onRenameTab: (tabId: string, label: string) => void;
  onRemoveTab: (tabId: string) => void;
};

export const Sidebar = ({
  tabs,
  activeTabId,
  editMode,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onRemoveTab,
}: SidebarProps) => {
  return (
    <aside className="app-sidebar sidebar">
      <div className="sidebar-brand">
        <div>
          <div className="sidebar-brand-title">Glassday</div>
          <div className="sidebar-brand-subtitle">Personal OS</div>
        </div>
      </div>

      <div className="sidebar-body">
        <div className="sidebar-section-header">
          <span className="sidebar-section-title">Workspaces</span>

          {editMode && (
            <button
              type="button"
              onClick={onAddTab}
              className="glass-button sidebar-add-button"
              title="Add workspace"
              aria-label="Add workspace"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <nav className="sidebar-workspace-list" aria-label="Workspaces">
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
                    onChange={(event) =>
                      onRenameTab(tab.id, event.target.value)
                    }
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
      </div>
    </aside>
  );
};