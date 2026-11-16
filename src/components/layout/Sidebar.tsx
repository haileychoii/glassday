/**
 * ============================================================
 * [Figma Mapping] Navigation / Sidebar
 * ============================================================
 *
 * 화면 역할:
 * - Wide/Laptop shell의 왼쪽 Workspace navigation이다.
 * - 실제 Tab 목록 렌더링은 `WorkspaceTabsNav.tsx`에 위임한다.
 *
 * 상태 연결:
 * - Expanded/Collapsed 상태는 Parent `AppShell.tsx`가 소유하고 localStorage에 저장한다.
 * - Edit 상태에서는 Custom Workspace 추가 버튼이 나타난다.
 *
 * 스타일 연결:
 * - Base: `src/styles/layout.css`
 * - Mode: `src/styles/layout-modes.css`, `src/styles/responsive.css`
 * - Theme override: `src/styles/themes/*.css`
 *
 * Figma 구조:
 * - Sidebar / Vertical Auto Layout
 *   - Brand Row
 *   - Workspace Navigation / Fill container
 * Variants: Expanded / Collapsed / Edit
 * ============================================================
 */
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";

import type { DashboardTab } from "../../types/workspace";
import { WorkspaceTabsNav } from "./WorkspaceTabsNav";

type SidebarProps = {
  tabs: DashboardTab[];
  activeTabId: string;
  editMode: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onRenameTab: (tabId: string, label: string) => void;
  onRemoveTab: (tabId: string) => void;
};

/** Sidebar는 배치와 collapse control만 담당하며 Tab interaction은 WorkspaceTabsNav가 담당한다. */
export const Sidebar = ({
  tabs,
  activeTabId,
  editMode,
  collapsed,
  onToggleCollapsed,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onRemoveTab,
}: SidebarProps) => {
  return (
    <aside
      className="app-sidebar sidebar"
      data-collapsed={collapsed ? "true" : "false"}
    >
      {/* Figma Frame: Sidebar Brand / Horizontal Auto Layout / Space Between */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-copy">
          <div className="sidebar-brand-title">Glassday</div>
          <div className="sidebar-brand-subtitle">Personal OS</div>
        </div>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className="glass-button sidebar-collapse-button"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-3 h-3" />
          ) : (
            <PanelLeftClose className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Figma Frame: Workspace Section / Vertical Auto Layout / Fill container */}
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

        {/* Figma Component Set: Workspace Tab / Default · Selected · Collapsed · Edit */}
        <WorkspaceTabsNav
          tabs={tabs}
          activeTabId={activeTabId}
          editMode={editMode}
          collapsed={collapsed}
          onSelectTab={onSelectTab}
          onRenameTab={onRenameTab}
          onRemoveTab={onRemoveTab}
        />
      </div>
    </aside>
  );
};
