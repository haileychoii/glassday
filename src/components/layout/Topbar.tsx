/**
 * ============================================================
 * [Figma Mapping] Navigation / Topbar
 * ============================================================
 *
 * 화면 역할:
 * - 인사말, Wide/Laptop mode, Settings, Edit 명령을 한 행에 배치한다.
 * - 좁은 shell에서는 Sidebar와 중복되지 않도록 WorkspaceTabsNav를 Topbar 아래에 표시한다.
 *
 * 데이터 연결:
 * - 모든 상태와 callback은 `App.tsx` 및 `AppShell.tsx`에서 전달된다.
 * - 이 컴포넌트는 별도 저장이나 Context를 소유하지 않는다.
 *
 * 스타일 연결:
 * - `src/styles/layout.css`, `layout-modes.css`, `responsive.css`
 * - Theme별 Topbar surface override는 `src/styles/themes/*.css`
 *
 * Figma 구조:
 * - Topbar / Vertical Auto Layout
 *   - Desktop Row / Horizontal Auto Layout / Space Between
 *   - Mobile Workspace Row / Horizontal Scroll
 * ============================================================
 */
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

/**
 * Topbar
 *
 * Figma Variants: `Wide / Laptop`, `View / Edit`, `Desktop / Compact`.
 * Layout mode 버튼은 Grid 데이터를 바꾸지 않고 저장된 mode별 layout을 선택한다.
 */
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
        {/* Figma Frame: Desktop Topbar Row / Horizontal Auto Layout / Space Between */}
        <div className="topbar-heading">
          <div className="topbar-title">
            <div className="topbar-title-row">
              <Sparkles className="topbar-sparkle" />
              <h1>Good Morning, Junhee</h1>
            </div>

            <p>Focus. Create. Elevate.</p>
          </div>

          {/* Figma Component Set: Topbar Actions / Layout, Settings, Edit states */}
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

        {/* Responsive Navigation: 좁은 shell에서만 나타나는 Workspace horizontal scroll */}
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
