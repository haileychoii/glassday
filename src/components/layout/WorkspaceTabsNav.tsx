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
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { getCurrentTheme, type ThemeId } from "../../constants/themes";
import { cn } from "../../lib/utils";
import type { DashboardTab } from "../../types/workspace";
import { WorkspaceIconPicker } from "./WorkspaceIconPicker";
import { WorkspaceTabIcon } from "./WorkspaceTabIcon";

type WorkspaceTabsNavProps = {
  tabs: DashboardTab[];
  activeTabId: string;
  editMode: boolean;
  collapsed?: boolean;
  onSelectTab: (tabId: string) => void;
  onAddTab?: () => void;
  onRenameTab: (tabId: string, label: string) => void;
  onChangeTabIcon: (tabId: string, icon: string, applyToAllThemes: boolean) => void;
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
  onChangeTabIcon,
  onRemoveTab,
  className,
  addButtonClassName,
  showAddButton = false,
}: WorkspaceTabsNavProps) => {
  const [theme, setTheme] = useState<ThemeId>(() => getCurrentTheme());
  const [editingIconTabId, setEditingIconTabId] = useState<string | null>(null);
  const [iconPreviewByTabId, setIconPreviewByTabId] = useState<Record<string, string>>({});
  const iconEditButtons = useRef(new Map<string, HTMLButtonElement>());
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null);

  const clearIconPreview = (tabId: string) => {
    setIconPreviewByTabId((current) => {
      const remaining = { ...current };
      delete remaining[tabId];
      return remaining;
    });
  };

  const toggleIconPicker = (tabId: string) => {
    if (editingIconTabId === tabId) {
      clearIconPreview(tabId);
      setEditingIconTabId(null);
      setPickerPosition(null);
      return;
    }

    if (editingIconTabId) clearIconPreview(editingIconTabId);
    setEditingIconTabId(tabId);
    setPickerPosition(null);
  };

  // The desktop sidebar scroll area clips children that extend past its edge.
  // Position the picker from its trigger, then render it at document level so
  // the full dialog stays visible and usable on desktop screens.
  useEffect(() => {
    if (!editingIconTabId) return;

    const updatePickerPosition = () => {
      const trigger = iconEditButtons.current.get(editingIconTabId);
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const width = Math.min(360, window.innerWidth - 24);
      const height = Math.min(520, window.innerHeight * 0.78, 720);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      const below = rect.bottom + 8;
      const top = below + height <= window.innerHeight - 8
        ? below
        : Math.max(8, rect.top - height - 8);

      setPickerPosition({ top, left });
    };

    updatePickerPosition();
    window.addEventListener("resize", updatePickerPosition);
    // Capture scroll events from the sidebar as well as the page so the
    // floating dialog remains attached to its icon-edit button.
    window.addEventListener("scroll", updatePickerPosition, true);
    return () => {
      window.removeEventListener("resize", updatePickerPosition);
      window.removeEventListener("scroll", updatePickerPosition, true);
    };
  }, [editingIconTabId]);

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

  useEffect(() => {
    // Closing edit mode also closes the icon editor and discards its preview.
    if (!editMode) {
      setEditingIconTabId(null);
      setIconPreviewByTabId({});
      setPickerPosition(null);
    }
  }, [editMode]);

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
                <WorkspaceTabIcon
                  tabId={tab.id}
                  icon={iconPreviewByTabId[tab.id] ?? tab.iconByTheme?.[theme] ?? tab.icon}
                  theme={theme}
                />
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

            {editMode && !collapsed && (
              <div className="sidebar-tab-icon-editor" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  ref={(element) => {
                    if (element) iconEditButtons.current.set(tab.id, element);
                    else iconEditButtons.current.delete(tab.id);
                  }}
                  onClick={() => toggleIconPicker(tab.id)}
                  className="sidebar-tab-icon-edit"
                  title={`${tab.label} 아이콘 변경`}
                  aria-label={`${tab.label} 아이콘 변경`}
                  aria-expanded={editingIconTabId === tab.id}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {editingIconTabId === tab.id && pickerPosition && createPortal(
                  <WorkspaceIconPicker
                    value={tab.iconByTheme?.[theme] ?? tab.icon}
                    theme={theme}
                    contextLabel={`${tab.label} 탭 아이콘 변경`}
                    showThemeScope
                    className="workspace-icon-picker-desktop"
                    style={{ top: pickerPosition.top, left: pickerPosition.left }}
                    onPreview={(icon) =>
                      setIconPreviewByTabId((current) => ({ ...current, [tab.id]: icon }))
                    }
                    onCancel={() => {
                      clearIconPreview(tab.id);
                      setEditingIconTabId(null);
                    }}
                    onSave={(icon, applyToAllThemes) => {
                      onChangeTabIcon(tab.id, icon, applyToAllThemes);
                      clearIconPreview(tab.id);
                      setEditingIconTabId(null);
                    }}
                  />,
                  document.body
                )}
              </div>
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
