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
    <aside className="hidden lg:flex w-[250px] shrink-0 flex-col border-r border-white/30 bg-white/[0.06] backdrop-blur-3xl">
      <div className="h-[86px] flex items-center px-6 border-b border-white/25">
        <div>
          <div className="text-xl font-semibold tracking-tight">Glassday</div>
          <div className="text-xs text-muted-foreground mt-1">
            Personal OS
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-xs font-semibold text-muted-foreground">
            Workspaces
          </span>

          {editMode && (
            <button
              type="button"
              onClick={onAddTab}
              className="glass-button h-7 w-7 flex items-center justify-center"
              title="Add workspace"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <nav className="space-y-2">
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
                    onChange={(e) => onRenameTab(tab.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="sidebar-tab-input"
                    spellCheck={false}
                  />
                ) : (
                  <span className="truncate">{tab.label}</span>
                )}
              </button>

              {editMode && !tab.locked && (
                <button
                  type="button"
                  onClick={() => onRemoveTab(tab.id)}
                  className="sidebar-tab-delete"
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