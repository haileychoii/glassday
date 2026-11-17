/**
 * [Figma Mapping] Mobile / Workspace Navigation
 * Uses the same tab IDs and selection callback as Desktop Sidebar.
 * Styles: styles/mobile.css. / 탭이나 저장 구조를 새로 만들지 않습니다.
 */
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getCurrentTheme, type ThemeId } from "../../constants/themes";
import type { DashboardTab } from "../../types/workspace";
import { WorkspaceTabIcon } from "./WorkspaceTabIcon";

export const MobileNavigation = ({ tabs, activeTabId, onSelectTab, onOpenQuickCapture }: {
  tabs: DashboardTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onOpenQuickCapture: () => void;
}) => (
  <NavigationContent
    tabs={tabs}
    activeTabId={activeTabId}
    onSelectTab={onSelectTab}
    onOpenQuickCapture={onOpenQuickCapture}
  />
);

const NavigationContent = ({ tabs, activeTabId, onSelectTab, onOpenQuickCapture }: {
  tabs: DashboardTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onOpenQuickCapture: () => void;
}) => {
  const [theme, setTheme] = useState<ThemeId>(() => getCurrentTheme());

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<ThemeId>).detail;
      if (nextTheme) setTheme(nextTheme);
    };
    window.addEventListener("glassday-theme-change", handleThemeChange);
    return () => window.removeEventListener("glassday-theme-change", handleThemeChange);
  }, []);

  return (
    <nav className="mobile-navigation" aria-label="Workspaces">
      {/* Keep Quick Capture in the thumb zone without changing tab behavior.
          기존 탭 동작은 유지하고 자주 쓰는 기록 기능은 엄지 영역에 둡니다. */}
      <button
        type="button"
        className="mobile-navigation-capture"
        aria-label="Open Quick Capture"
        title="Quick Capture"
        onClick={onOpenQuickCapture}
      >
        <Plus size={21} aria-hidden="true" />
      </button>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className="mobile-navigation-item"
          aria-current={activeTabId === tab.id ? "page" : undefined}
          onClick={() => onSelectTab(tab.id)}
          title={tab.label}
        >
          <span className="mobile-navigation-icon">
            <WorkspaceTabIcon tabId={tab.id} theme={theme} />
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};
