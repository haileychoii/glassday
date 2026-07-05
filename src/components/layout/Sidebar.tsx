import { Plus } from "lucide-react";

import type { DashboardTab } from "../../types/workspace";
import { WorkspaceTabsNav } from "./WorkspaceTabsNav";

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

        <WorkspaceTabsNav
          tabs={tabs}
          activeTabId={activeTabId}
          editMode={editMode}
          onSelectTab={onSelectTab}
          onRenameTab={onRenameTab}
          onRemoveTab={onRemoveTab}
        />
      </div>
    </aside>
  );
};
