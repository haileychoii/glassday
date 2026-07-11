import { LayoutGrid, Monitor, Settings, Sparkles } from "lucide-react";

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
