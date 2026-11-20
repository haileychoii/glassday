
/**
 * ============================================================
 * GLASSDAY — WORKSPACE TABS NAVIGATION
 * 파일: src/components/layout/WorkspaceTabsNav.tsx
 * ============================================================
 *
 * [역할]
 * - Sidebar 및 Compact Topbar의 Workspace 목록 표시
 * - Workspace 선택, 이름 수정, 추가, 삭제
 * - 테마별 아이콘 업데이트
 *
 * [연결 파일]
 * - App.tsx
 * - useDashboardTabs.ts
 * - Sidebar.tsx
 * - Topbar.tsx
 * - WorkspaceTabIcon.tsx
 * - layout.css
 *
 * [Figma Mapping]
 * Workspace Tab
 * └─ Default / Selected / Edit / Collapsed
 * ============================================================
 */

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { getCurrentTheme, type ThemeId } from "../../constants/themes";
import { cn } from "../../lib/utils";
import type { DashboardTab } from "../../types/workspace";

import { WorkspaceTabIcon } from "./WorkspaceTabIcon";
import { WorkspaceAppearanceDialog } from "./WorkspaceAppearanceDialog";


/* ============================================================
   01. COMPONENT PROPS
   ============================================================ */

type WorkspaceTabsNavProps = {
  tabs: DashboardTab[];
  activeTabId: string;
  editMode: boolean;
  collapsed?: boolean;

  onSelectTab: (tabId: string) => void;
  onAddTab?: () => void;
  onRenameTab: (tabId: string, label: string) => void;
  onRemoveTab: (tabId: string) => void;
  onUpdateTabAppearance?: (
    tabId: string,
    appearance: { icon: string; background: string; iconSource?: string }
  ) => void;

  className?: string;
  addButtonClassName?: string;
  showAddButton?: boolean;
};


/* ============================================================
   02. WORKSPACE TABS COMPONENT
   ============================================================ */

export const WorkspaceTabsNav = ({
  tabs,
  activeTabId,
  editMode,
  collapsed = false,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onRemoveTab,
  onUpdateTabAppearance,
  className,
  addButtonClassName,
  showAddButton = false,
}: WorkspaceTabsNavProps) => {

  const [theme, setTheme] = useState<ThemeId>(
    () => getCurrentTheme()
  );
  const [appearanceTabId, setAppearanceTabId] = useState<string | null>(null);

  // Settings에서 테마를 변경하면 아이콘도 변경한다.
  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<ThemeId>).detail;

      if (nextTheme) {
        setTheme(nextTheme);
      }
    };

    window.addEventListener(
      "glassday-theme-change",
      handleThemeChange
    );

    return () => {
      window.removeEventListener(
        "glassday-theme-change",
        handleThemeChange
      );
    };
  }, []);


  /* ==========================================================
     03. WORKSPACE TAB LIST

     Sidebar와 Topbar에서 동일한 구조를 사용한다.
     배치 방향은 CSS에서 결정한다.
     ========================================================== */

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
            {/* 이름 편집 모드:
                input을 button 안에 중첩하지 않는다. */}

            {!collapsed && editMode && !tab.locked ? (
              <div className="sidebar-tab-main">

                <button
                  type="button"
                  className="sidebar-tab-icon"
                  onClick={() => {
                    if (editMode && onUpdateTabAppearance) {
                      setAppearanceTabId(tab.id);
                      return;
                    }
                    onSelectTab(tab.id);
                  }}
                  aria-label={`Select ${tab.label}`}
                  aria-current={
                    activeTabId === tab.id ? "page" : undefined
                  }
                >
                  <WorkspaceTabIcon
                    tabId={tab.id}
                    tabLabel={tab.label}
                    theme={theme}
                    icon={tab.icon}
                  />
                </button>

                <input
                  value={tab.label}
                  onChange={(event) =>
                    onRenameTab(tab.id, event.target.value)
                  }
                  className="sidebar-tab-input"
                  spellCheck={false}
                  aria-label={`${tab.label} workspace name`}
                />

              </div>
            ) : (

              /* 일반 선택 모드 */

              <button
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className="sidebar-tab-main"
                title={collapsed ? tab.label : undefined}
                aria-label={tab.label}
                aria-current={
                  activeTabId === tab.id ? "page" : undefined
                }
              >
                <span className="sidebar-tab-icon">
                  <WorkspaceTabIcon
                    tabId={tab.id}
                    tabLabel={tab.label}
                    theme={theme}
                    icon={tab.icon}
                  />
                </span>

                <span
                  className={
                    collapsed ? "sr-only" : "sidebar-tab-label"
                  }
                >
                  {tab.label}
                </span>
              </button>
            )}

            {/* 잠겨 있지 않은 Workspace만 삭제 가능 */}

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

      {/* Workspace 추가 버튼 */}

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

      {appearanceTabId && onUpdateTabAppearance && (() => {
        const appearanceTab = tabs.find((tab) => tab.id === appearanceTabId);
        if (!appearanceTab) return null;
        return (
          <WorkspaceAppearanceDialog
            tab={appearanceTab}
            theme={theme}
            onSave={onUpdateTabAppearance}
            onClose={() => setAppearanceTabId(null)}
          />
        );
      })()}
    </>
  );
};
