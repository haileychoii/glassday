/**
 * [Figma Mapping] Mobile / Workspace Navigation
 * Uses the same tab IDs and selection callback as Desktop Sidebar.
 * Styles: styles/mobile.css. / 탭이나 저장 구조를 새로 만들지 않습니다.
 */
import { BookOpen, BriefcaseBusiness, FolderOpen, HeartPulse, House, NotebookPen } from "lucide-react";
import type { DashboardTab } from "../../types/workspace";

const icons = { home: House, career: BriefcaseBusiness, study: BookOpen, memo: NotebookPen, life: HeartPulse };

export const MobileNavigation = ({ tabs, activeTabId, onSelectTab }: {
  tabs: DashboardTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
}) => (
  <nav className="mobile-navigation" aria-label="Workspaces">
    {tabs.map((tab) => {
      const Icon = icons[tab.id as keyof typeof icons] ?? FolderOpen;
      return (
        <button key={tab.id} type="button" className="mobile-navigation-item"
          aria-current={activeTabId === tab.id ? "page" : undefined}
          onClick={() => onSelectTab(tab.id)} title={tab.label}>
          <Icon size={19} aria-hidden="true" />
          <span>{tab.label}</span>
        </button>
      );
    })}
  </nav>
);
