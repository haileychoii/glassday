/**
 * [Figma Mapping] Mobile / Workspace Navigation
 * Uses the same tab IDs and selection callback as Desktop Sidebar.
 * Styles: styles/mobile.css. / 탭이나 저장 구조를 새로 만들지 않습니다.
 */
import { BookOpen, BriefcaseBusiness, FolderOpen, HeartPulse, House, NotebookPen, Plus } from "lucide-react";
import type { DashboardTab } from "../../types/workspace";

const icons = { home: House, career: BriefcaseBusiness, study: BookOpen, memo: NotebookPen, life: HeartPulse };

export const MobileNavigation = ({ tabs, activeTabId, onSelectTab, onOpenQuickCapture }: {
  tabs: DashboardTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onOpenQuickCapture: () => void;
}) => (
  <nav className="mobile-navigation" aria-label="Workspaces">
    {/* Quick Capture is the primary mobile action: keep it in the thumb zone
        instead of making users reopen the header to record something. /
        모바일에서 가장 자주 쓰는 기록 동작을 하단 엄지 영역에 고정한다. */}
    <button
      type="button"
      className="mobile-navigation-capture"
      aria-label="Open Quick Capture"
      title="Quick Capture"
      onClick={onOpenQuickCapture}
    >
      <Plus size={21} aria-hidden="true" />
    </button>
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
