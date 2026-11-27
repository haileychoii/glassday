/**
 * [Figma Mapping] Mobile / Workspace Navigation
 * Uses the same persisted DashboardTab records as the desktop sidebar.
 * In edit mode, stage icon changes across tabs and persist them together with Apply.
 * The only bottom plus creates a workspace immediately; the header keeps Quick Capture separate.
 */
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { getCurrentTheme, type ThemeId } from "../../constants/themes";
import { cn } from "../../lib/utils";
import type { DashboardTab, WorkspaceTabIconChange } from "../../types/workspace";
import { WorkspaceTabIcon } from "./WorkspaceTabIcon";
import { WorkspaceIconPicker } from "./WorkspaceIconPicker";

type IconPickerTarget = { tabId: string } | null;

export const MobileNavigation = ({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onChangeTabIcons,
  editMode,
}: {
  tabs: DashboardTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onAddTab: (icon: string) => void;
  onChangeTabIcons: (changes: WorkspaceTabIconChange[]) => void;
  editMode: boolean;
}) => {
  const [theme, setTheme] = useState<ThemeId>(() => getCurrentTheme());
  const [pickerTarget, setPickerTarget] = useState<IconPickerTarget>(null);
  const [draftIcons, setDraftIcons] = useState<Record<string, WorkspaceTabIconChange>>({});
  const navigationRef = useRef<HTMLElement>(null);

  const cancelPicker = () => {
    setDraftIcons({});
    setPickerTarget(null);
  };

  const openPicker = (tabId: string) => setPickerTarget({ tabId });

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

  const targetTab = pickerTarget
    ? tabs.find((tab) => tab.id === pickerTarget.tabId)
    : undefined;

  const saveIcon = (icon: string, applyToAllThemes: boolean) => {
    if (targetTab) {
      const pendingChanges = {
        ...draftIcons,
        ...(icon !== (targetTab.iconByTheme?.[theme] ?? targetTab.icon) || applyToAllThemes
          ? { [targetTab.id]: { tabId: targetTab.id, icon, applyToAllThemes, theme } }
          : {}),
      };
      onChangeTabIcons(Object.values(pendingChanges));
    }
    setDraftIcons({});
    setPickerTarget(null);
  };

  const stageIcon = (icon: string, applyToAllThemes: boolean) => {
    if (targetTab) {
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
    }
  };

  return (
    <div className="mobile-navigation-shell">
      <nav ref={navigationRef} className="mobile-navigation" aria-label="Workspaces">
        {tabs.map((tab) => {
          const isEditingIcon =
            pickerTarget?.tabId === tab.id;
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
                activeTabId === tab.id && "is-active"
              )}
              aria-label={editMode ? `${tab.label}${isEditingIcon ? ", 아이콘 선택 중" : " 아이콘 편집"}` : tab.label}
              aria-current={activeTabId === tab.id ? "page" : undefined}
              aria-pressed={isEditingIcon}
              onClick={() => {
                if (editMode) {
                  openPicker(tab.id);
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
            </button>
          );
        })}

        <button
          type="button"
          className="mobile-navigation-action"
          disabled={Boolean(pickerTarget)}
          aria-label="새 워크스페이스 추가"
          title="새 워크스페이스 추가"
          onClick={() => onAddTab("✨")}
        >
          <Plus size={22} strokeWidth={2} aria-hidden="true" />
        </button>
      </nav>

      {pickerTarget && targetTab && (
        <WorkspaceIconPicker
          value={targetTab?.iconByTheme?.[theme] ?? targetTab?.icon ?? "✨"}
          draftValue={targetTab && (draftIcons[targetTab.id]?.applyToAllThemes || draftIcons[targetTab.id]?.theme === theme)
            ? draftIcons[targetTab.id]?.icon
            : undefined}
          initialApplyToAllThemes={targetTab ? draftIcons[targetTab.id]?.applyToAllThemes : false}
          canApply={Object.keys(draftIcons).length > 0}
          theme={theme}
          contextLabel={`${targetTab.label} 아이콘 변경`}
          showThemeScope
          saveLabel="적용"
          onSave={saveIcon}
          onPreview={stageIcon}
          onCancel={cancelPicker}
        />
      )}
    </div>
  );
};
