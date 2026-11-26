/**
 * [Figma Mapping] Mobile / Workspace Navigation
 * Uses the same tab IDs and selection callback as Desktop Sidebar.
 * Styles: styles/mobile.css. / 탭이나 저장 구조를 새로 만들지 않습니다.
 */
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { getCurrentTheme, type ThemeId } from "../../constants/themes";
import type { DashboardTab } from "../../types/workspace";
import { WorkspaceTabIcon } from "./WorkspaceTabIcon";

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
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
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

  const iconChoices = [
    { id: "home", icon: "🏠", label: "Home icon" },
    { id: "career", icon: "💼", label: "Career icon" },
    { id: "study", icon: "📚", label: "Study icon" },
    { id: "memo", icon: "📔", label: "Diary icon" },
    { id: "life", icon: "🌿", label: "Life icon" },
  ];

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
            aria-current={activeTabId === tab.id ? "page" : undefined}
            onClick={() => {
              onSelectTab(tab.id);
              setIconPickerOpen(false);
            }}
            title={tab.label}
          >
            {/* Render the chosen glyph directly, without a decorative icon tile. */}
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
          {iconChoices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className="mobile-tab-icon-choice"
              aria-label={`Add workspace with ${choice.label}`}
              title={choice.label}
              onClick={() => {
                onAddTab(choice.icon);
                setIconPickerOpen(false);
              }}
            >
              <WorkspaceTabIcon
                tabId={choice.id}
                icon={choice.icon}
                theme={theme}
                mobile
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
