/**
 * ============================================================
 * [Figma Mapping] Navigation / Workspace Tabs
 * ============================================================
 *
 * 화면 역할:
 * - 동일한 DashboardTab 목록을 Sidebar와 Compact Topbar 양쪽에서 렌더링한다.
 * - 선택, 이름 변경, 삭제 interaction의 공통 구현이다.
 *
 * 데이터 연결:
 * - Tab 데이터와 callback은 `useDashboardTabs`를 사용하는 `App.tsx`에서 내려온다.
 * - Theme icon Variant를 위해 `glassday-theme-change` event를 구독한다.
 *
 * Figma 구조:
 * - Component Set: Workspace Tab
 * - Variants: Default / Selected / Edit / Collapsed / Theme Icon
 * - Sidebar에서는 Vertical, Topbar에서는 CSS override로 Horizontal Auto Layout
 * ============================================================
 */
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { getCurrentTheme, type ThemeId } from "../../constants/themes";
import { cn } from "../../lib/utils";
import type { DashboardTab } from "../../types/workspace";
import { WorkspaceTabIcon } from "./WorkspaceTabIcon";

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

/**
 * WorkspaceTabsNav
 *
 * 한 Tab의 id는 `DashboardTab.layouts`와 activeTab 저장에 사용된다. label이나
 * icon 표시를 바꾸는 것은 안전하지만 id 변경은 저장된 workspace 연결을 끊는다.
 */
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

  return (
    <>
      {/* Figma Component List: Workspace Tabs / 방향은 배치 위치의 CSS가 결정한다. */}
      <nav
        className={cn(
          "sidebar-workspace-list",
          collapsed && "sidebar-workspace-list-collapsed",
          className
        )}
        aria-label="Workspaces"
      >
        {tabs.map((tab) => (
          /* Figma Component: Workspace Tab / Selected와 Collapsed는 Variant */
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
              <span className="sidebar-tab-icon">
                <WorkspaceTabIcon tabId={tab.id} icon={tab.icon} theme={theme} />
              </span>

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

      {/* Secondary Action: Compact Topbar에서 사용하는 Workspace 추가 버튼 */}
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
