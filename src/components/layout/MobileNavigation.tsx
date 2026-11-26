/**
 * [Figma Mapping] Mobile / Workspace Navigation
 * Uses the same persisted DashboardTab records as the desktop sidebar.
 * In edit mode, tap an existing tab to change its icon; tap Save to persist it.
 */
import { useEffect, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";

import { getCurrentTheme, type ThemeId } from "../../constants/themes";
import { cn } from "../../lib/utils";
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
  const [previewIcon, setPreviewIcon] = useState<{ tabId: string | null; icon: string } | null>(null);
  const navigationRef = useRef<HTMLElement>(null);

  const closePicker = () => {
    setPreviewIcon(null);
    setPickerTarget(null);
  };

  const openPicker = (target: IconPickerTarget) => {
    setPreviewIcon(null);
    setPickerTarget(target);
  };

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<ThemeId>).detail;
      if (nextTheme) setTheme(nextTheme);
    };

    window.addEventListener("glassday-theme-change", handleThemeChange);
    return () => window.removeEventListener("glassday-theme-change", handleThemeChange);
  }, []);

  useEffect(() => {
    // If edit mode is closed while changing an existing tab, discard its draft.
    if (!editMode && pickerTarget?.type === "existing") {
      setPreviewIcon(null);
      setPickerTarget(null);
    }
  }, [editMode, pickerTarget]);

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
    setPreviewIcon(null);
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
          const displayedIcon =
            previewIcon?.tabId === tab.id ? previewIcon.icon : tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              className={cn(
                "mobile-navigation-item",
                activeTabId === tab.id && "is-active",
                isEditingIcon && "is-editing-icon"
              )}
              aria-label={editMode ? `${tab.label}${isEditingIcon ? ", 아이콘 선택 중" : " 아이콘 편집"}` : tab.label}
              aria-current={activeTabId === tab.id ? "page" : undefined}
              aria-pressed={isEditingIcon}
              onClick={() => {
                if (editMode) {
                  if (isEditingIcon) closePicker();
                  else openPicker({ type: "existing", tabId: tab.id });
                  return;
                }

                onSelectTab(tab.id);
                closePicker();
              }}
              title={editMode ? `${tab.label} 아이콘 변경` : tab.label}
            >
              <WorkspaceTabIcon
                tabId={tab.id}
                icon={displayedIcon}
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
          aria-label={pickerTarget?.type === "new"
            ? previewIcon?.tabId === null ? "새 탭 아이콘 미리보기, 선택창 닫기" : "아이콘 선택 닫기"
            : "새 탭 추가"}
          title="새 탭 추가"
          aria-expanded={pickerTarget?.type === "new"}
          onClick={() => {
            if (pickerTarget?.type === "new") closePicker();
            else openPicker({ type: "new" });
          }}
        >
          {pickerTarget?.type === "new" && previewIcon?.tabId === null ? (
            previewIcon.icon.startsWith("/workspace-icons/") ? (
              <img
                className="mobile-navigation-preview-icon"
                src={previewIcon.icon}
                alt=""
                aria-hidden="true"
                draggable={false}
              />
            ) : (
              <span className="mobile-navigation-preview-icon" aria-hidden="true">
                {previewIcon.icon}
              </span>
            )
          ) : (
            <Plus size={22} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      </nav>

      {pickerTarget && (targetTab || pickerTarget.type === "new") && (
        <WorkspaceIconPicker
          value={targetTab?.icon ?? "✨"}
          theme={theme}
          contextLabel={pickerTarget.type === "new" ? "새 탭 아이콘 선택" : `${targetTab?.label ?? "탭"} 아이콘 변경`}
          saveLabel={pickerTarget.type === "new" ? "새 탭 만들기" : "저장"}
          onSave={saveIcon}
          onPreview={(icon) =>
            setPreviewIcon({
              tabId: pickerTarget.type === "existing" ? pickerTarget.tabId : null,
              icon,
            })
          }
          onCancel={closePicker}
        />
      )}
    </div>
  );
};
