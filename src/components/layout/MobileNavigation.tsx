/**
 * [Figma Mapping] Mobile / Workspace Navigation
 * Uses the same persisted DashboardTab records as the desktop sidebar.
 * In edit mode, tap an existing tab to change its icon; tap Save to persist it.
 */
import { useEffect, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";

import { getCurrentTheme, type ThemeId } from "../../constants/themes";
import type { DashboardTab } from "../../types/workspace";
import { WorkspaceTabIcon } from "./WorkspaceTabIcon";
import { WorkspaceIconPicker } from "./WorkspaceIconPicker";

type IconPickerTarget =
  | { type: "new" }
  | { type: "existing"; tabId: string }
  | null;

export const MobileNavigation = ({
  tabs,
  activeTabId,
  onSelectTab,
  onOpenQuickCapture,
  onAddTab,
  onChangeTabIcon,
  editMode,
}: {
  tabs: DashboardTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onOpenQuickCapture: () => void;
  onAddTab: (icon: string) => void;
  onChangeTabIcon: (tabId: string, icon: string) => void;
  editMode: boolean;
}) => {
  const [theme, setTheme] = useState<ThemeId>(() => getCurrentTheme());
  const [pickerTarget, setPickerTarget] = useState<IconPickerTarget>(null);
  const navigationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<ThemeId>).detail;
      if (nextTheme) setTheme(nextTheme);
    };

    window.addEventListener("glassday-theme-change", handleThemeChange);
    return () => window.removeEventListener("glassday-theme-change", handleThemeChange);
  }, []);

  useEffect(() => {
    navigationRef.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "smooth",
      });
  }, [activeTabId]);

  const targetTab =
    pickerTarget?.type === "existing"
      ? tabs.find((tab) => tab.id === pickerTarget.tabId)
      : undefined;

  const saveIcon = (icon: string) => {
    if (pickerTarget?.type === "existing" && targetTab) {
      onChangeTabIcon(targetTab.id, icon);
    } else if (pickerTarget?.type === "new") {
      onAddTab(icon);
    }
    setPickerTarget(null);
  };

  return (
    <div className="mobile-navigation-shell">
      <nav ref={navigationRef} className="mobile-navigation" aria-label="Workspaces">
        <button
          type="button"
          className="mobile-navigation-capture"
          aria-label="Open Quick Capture"
          title="Quick Capture"
          onClick={onOpenQuickCapture}
        >
          <Plus size={21} strokeWidth={2.4} aria-hidden="true" />
        </button>

        {tabs.map((tab) => {
          const isEditingIcon =
            pickerTarget?.type === "existing" && pickerTarget.tabId === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              className="mobile-navigation-item"
              aria-label={editMode ? `${tab.label} 아이콘 편집` : tab.label}
              aria-current={!editMode && activeTabId === tab.id ? "page" : undefined}
              aria-pressed={isEditingIcon}
              onClick={() => {
                if (editMode) {
                  setPickerTarget(isEditingIcon ? null : { type: "existing", tabId: tab.id });
                  return;
                }

                onSelectTab(tab.id);
                setPickerTarget(null);
              }}
              title={editMode ? `${tab.label} 아이콘 변경` : tab.label}
            >
              <WorkspaceTabIcon
                tabId={tab.id}
                icon={tab.icon}
                theme={theme}
                mobile
              />
              <span className="mobile-navigation-label">{tab.label}</span>
              {editMode && (
                <Pencil
                  className="mobile-navigation-edit-mark"
                  size={11}
                  strokeWidth={2.4}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}

        <button
          type="button"
          className="mobile-navigation-add-tab"
          aria-label={pickerTarget?.type === "new" ? "아이콘 선택 닫기" : "새 탭 추가"}
          title="새 탭 추가"
          aria-expanded={pickerTarget?.type === "new"}
          onClick={() =>
            setPickerTarget((current) =>
              current?.type === "new" ? null : { type: "new" }
            )
          }
        >
          <Plus size={22} strokeWidth={2} aria-hidden="true" />
        </button>
      </nav>

      {pickerTarget && (targetTab || pickerTarget.type === "new") && (
        <WorkspaceIconPicker
          value={targetTab?.icon ?? "✨"}
          theme={theme}
          saveLabel={pickerTarget.type === "new" ? "새 탭 만들기" : "저장"}
          onSave={saveIcon}
          onCancel={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
};
