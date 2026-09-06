/**
 * [Figma Mapping] Mobile Web / Header + Scroll Area + Bottom Navigation
 * App owns actions/providers; this shell only arranges their entry points.
 * Styles: styles/mobile.css. / 모바일 웹 전용이며 Tauri에는 렌더링하지 않습니다.
 */
import { Plus, Search, Settings } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import type { DashboardTab } from "../../types/workspace";
import { MobileNavigation } from "./MobileNavigation";

export const MobileLayout = ({ tabs, activeTabId, onSelectTab, onOpenSearch,
  onOpenQuickCapture, onOpenSettings, children }: {
  tabs: DashboardTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onOpenSearch: () => void;
  onOpenQuickCapture: () => void;
  onOpenSettings: () => void;
  children: ReactNode;
}) => {
  const scroller = useRef<HTMLDivElement>(null);
  const label = tabs.find((tab) => tab.id === activeTabId)?.label ?? "Glassday";
  useEffect(() => {
    const active = document.activeElement;
    // Keep the restored input visible after a breakpoint change; a workspace
    // navigation without an active editor starts at the top. / 입력 위치 유지.
    if (active instanceof HTMLElement && scroller.current?.contains(active)) {
      active.scrollIntoView({ block: "nearest" });
    } else {
      scroller.current?.scrollTo({ top: 0 });
    }
  }, [activeTabId]);

  return (
    <div className="mobile-layout" data-runtime="web" data-display-layout="mobile">
      <header className="mobile-header">
        <div className="mobile-heading"><span>Glassday</span><h1>{label}</h1></div>
        <div className="mobile-header-actions">
          <button type="button" aria-label="Search Glassday" title="Search" onClick={onOpenSearch}><Search size={19} /></button>
          <button type="button" aria-label="Quick Capture" title="Quick Capture" onClick={onOpenQuickCapture}><Plus size={21} /></button>
          <button type="button" aria-label="Open settings" title="Settings" onClick={onOpenSettings}><Settings size={19} /></button>
        </div>
      </header>
      <div ref={scroller} className="mobile-main" role="main" aria-label={`${label} workspace`}>
        {children}
      </div>
      <MobileNavigation tabs={tabs} activeTabId={activeTabId} onSelectTab={onSelectTab} />
    </div>
  );
};
