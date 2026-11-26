/**
 * [Figma Mapping] Mobile / Workspace Navigation
 * Uses the same tab IDs and selection callback as Desktop Sidebar.
 * Styles: styles/mobile.css. / 탭이나 저장 구조를 새로 만들지 않습니다.
 */
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { getCurrentTheme, type ThemeId } from "../../constants/themes";
import type { DashboardTab } from "../../types/workspace";
import {
  workspaceIconCollections,
  type WorkspaceIconCollectionId,
} from "../../constants/workspaceIconChoices";
import { WorkspaceTabIcon } from "./WorkspaceTabIcon";

const iconCollectionForTheme = (theme: ThemeId): WorkspaceIconCollectionId =>
  theme === "pixel-desk" || theme === "retro" ? "retro-pixel" : "pink-iphone";

const iconCollectionOptions: Array<{
  id: WorkspaceIconCollectionId;
  label: string;
}> = [
  { id: "pink-iphone", label: "핑크 스티커" },
  { id: "retro-pixel", label: "픽셀 아트" },
  { id: "folder-art", label: "폴더 디자인" },
];

export const MobileNavigation = ({
  tabs,
  activeTabId,
  onSelectTab,
  onOpenQuickCapture,
  onAddTab,
}: {
  tabs: DashboardTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onOpenQuickCapture: () => void;
  onAddTab: (icon: string) => void;
}) => {
  const [theme, setTheme] = useState<ThemeId>(() => getCurrentTheme());
  const [iconCollection, setIconCollection] = useState<WorkspaceIconCollectionId>(
    () => iconCollectionForTheme(getCurrentTheme())
  );
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const navigationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<ThemeId>).detail;
      if (nextTheme) {
        setTheme(nextTheme);
        setIconCollection(iconCollectionForTheme(nextTheme));
      }
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

  // Each entry points at a standalone transparent image in public/. Store that
  // path on the new tab so desktop and mobile keep displaying the chosen art.
  const iconChoices = workspaceIconCollections[iconCollection];

  return (
    <div className="mobile-navigation-shell">
      <nav ref={navigationRef} className="mobile-navigation" aria-label="Workspaces">
        {/* Keep Quick Capture in the thumb zone without changing tab behavior. */}
        <button
          type="button"
          className="mobile-navigation-capture"
          aria-label="Open Quick Capture"
          title="Quick Capture"
          onClick={onOpenQuickCapture}
        >
          <Plus size={21} strokeWidth={2.4} aria-hidden="true" />
        </button>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="mobile-navigation-item"
            aria-label={tab.label}
            aria-current={activeTabId === tab.id ? "page" : undefined}
            onClick={() => {
              onSelectTab(tab.id);
              setIconPickerOpen(false);
            }}
            title={tab.label}
          >
            {/* Render the chosen glyph or sticker directly, without a tile. */}
            <WorkspaceTabIcon
              tabId={tab.id}
              icon={tab.icon}
              theme={theme}
              mobile
            />
            <span className="mobile-navigation-label">{tab.label}</span>
          </button>
        ))}
        <button
          type="button"
          className="mobile-navigation-add-tab"
          aria-label={
            iconPickerOpen ? "Close workspace icon picker" : "Add workspace tab"
          }
          title="Add workspace"
          aria-expanded={iconPickerOpen}
          onClick={() => setIconPickerOpen((open) => !open)}
        >
          <Plus size={22} strokeWidth={2} aria-hidden="true" />
        </button>
      </nav>
      {iconPickerOpen && (
        <div
          className="mobile-tab-icon-picker"
          role="group"
          aria-label="Choose a workspace icon"
        >
          {/* Browse by clear artwork families; folder skins stay easy to find. */}
          <div className="mobile-tab-icon-collections" role="group" aria-label="Icon style">
            {iconCollectionOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className="mobile-tab-icon-collection"
                aria-pressed={iconCollection === option.id}
                onClick={() => setIconCollection(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div
            className="mobile-tab-icon-grid"
            role="group"
            aria-label={`${iconCollectionOptions.find((option) => option.id === iconCollection)?.label} 아이콘`}
          >
            {iconChoices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className="mobile-tab-icon-choice"
                aria-label={`Add workspace with ${choice.label}`}
                title={choice.label}
                onClick={() => {
                  // The asset URL is the tab's persisted icon identifier.
                  onAddTab(choice.src);
                  setIconPickerOpen(false);
                }}
              >
                <img
                  src={choice.src}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
