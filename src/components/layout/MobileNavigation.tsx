/**
 * [Figma Mapping] Mobile / Workspace Navigation
 * Uses the same persisted DashboardTab records as the desktop sidebar.
 * In edit mode, stage icon changes across tabs and persist them together with Apply.
 */
import { useEffect, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";

import { getCurrentTheme, type ThemeId } from "../../constants/themes";
import { cn } from "../../lib/utils";
import type { DashboardTab, WorkspaceTabIconChange } from "../../types/workspace";
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
  onChangeTabIcons,
  editMode,
}: {
  tabs: DashboardTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onOpenQuickCapture: () => void;
  onAddTab: (icon: string) => void;
  onChangeTabIcons: (changes: WorkspaceTabIconChange[]) => void;
  editMode: boolean;
}) => {
  const [theme, setTheme] = useState<ThemeId>(() => getCurrentTheme());
  const [pickerTarget, setPickerTarget] = useState<IconPickerTarget>(null);
  const [previewIcon, setPreviewIcon] = useState<{ tabId: string | null; icon: string } | null>(null);
  const [draftIcons, setDraftIcons] = useState<Record<string, WorkspaceTabIconChange>>({});
  const navigationRef = useRef<HTMLElement>(null);

  const cancelPicker = () => {
    setPreviewIcon(null);
    setDraftIcons({});
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
    // Leaving edit mode without Apply discards the whole temporary edit batch.
    if (!editMode && (pickerTarget || Object.keys(draftIcons).length > 0)) {
      setPreviewIcon(null);
      setDraftIcons({});
      setPickerTarget(null);
    }
  }, [editMode, pickerTarget, draftIcons]);

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

  const saveIcon = (icon: string, applyToAllThemes: boolean) => {
    if (pickerTarget?.type === "existing" && targetTab) {
      const pendingChanges = {
        ...draftIcons,
        ...(icon !== (targetTab.iconByTheme?.[theme] ?? targetTab.icon) || applyToAllThemes
          ? { [targetTab.id]: { tabId: targetTab.id, icon, applyToAllThemes, theme } }
          : {}),
      };
      onChangeTabIcons(Object.values(pendingChanges));
    } else if (pickerTarget?.type === "new") {
      if (Object.keys(draftIcons).length > 0) {
        onChangeTabIcons(Object.values(draftIcons));
      }
      onAddTab(icon);
    }
    setPreviewIcon(null);
    setDraftIcons({});
    setPickerTarget(null);
  };

  const stageIcon = (icon: string, applyToAllThemes: boolean) => {
    if (pickerTarget?.type === "existing" && targetTab) {
      setDraftIcons((current) => {
        const next = { ...current };
        const savedIcon = targetTab.iconByTheme?.[theme] ?? targetTab.icon;
        const hasThemeOverrides = Object.keys(targetTab.iconByTheme ?? {}).length > 0;
        const isAlreadySaved = !applyToAllThemes && icon === savedIcon;
        const allThemesAlreadyMatch =
          applyToAllThemes && icon === targetTab.icon && !hasThemeOverrides;

        if (isAlreadySaved || allThemesAlreadyMatch) {
          delete next[targetTab.id];
        } else {
          next[targetTab.id] = { tabId: targetTab.id, icon, applyToAllThemes, theme };
        }
        return next;
      });
      return;
    }

    if (pickerTarget?.type === "new") setPreviewIcon({ tabId: null, icon });
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
          const pendingIcon = draftIcons[tab.id];
          const displayedIcon =
            pendingIcon && (pendingIcon.applyToAllThemes || pendingIcon.theme === theme)
              ? pendingIcon.icon
              : tab.iconByTheme?.[theme] ?? tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              className={cn(
                "mobile-navigation-item",
                activeTabId === tab.id && "is-active",
                pendingIcon && "has-icon-draft",
                isEditingIcon && "is-editing-icon"
              )}
              aria-label={editMode ? `${tab.label}${isEditingIcon ? ", 아이콘 선택 중" : " 아이콘 편집"}` : tab.label}
              aria-current={activeTabId === tab.id ? "page" : undefined}
              aria-pressed={isEditingIcon}
              onClick={() => {
                if (editMode) {
                  openPicker({ type: "existing", tabId: tab.id });
                  return;
                }

                onSelectTab(tab.id);
                cancelPicker();
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
            ? previewIcon?.tabId === null ? "새 탭 아이콘 미리보기" : "새 탭 아이콘 선택 중"
            : "새 탭 추가"}
          title="새 탭 추가"
          aria-expanded={pickerTarget?.type === "new"}
          onClick={() => {
            if (pickerTarget?.type !== "new") openPicker({ type: "new" });
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
          value={targetTab?.iconByTheme?.[theme] ?? targetTab?.icon ?? "✨"}
          draftValue={targetTab && (draftIcons[targetTab.id]?.applyToAllThemes || draftIcons[targetTab.id]?.theme === theme)
            ? draftIcons[targetTab.id]?.icon
            : undefined}
          initialApplyToAllThemes={targetTab ? draftIcons[targetTab.id]?.applyToAllThemes : false}
          canApply={Object.keys(draftIcons).length > 0}
          theme={theme}
          contextLabel={pickerTarget.type === "new" ? "새 탭 아이콘 선택" : `${targetTab?.label ?? "탭"} 아이콘 변경`}
          showThemeScope={pickerTarget.type === "existing"}
          saveLabel={pickerTarget.type === "new" ? "새 탭 만들기" : "적용"}
          onSave={saveIcon}
          onPreview={stageIcon}
          onCancel={cancelPicker}
        />
      )}
    </div>
  );
};
