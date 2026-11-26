/**
 * [Figma Mapping] Mobile Web / Header + Scroll Area + Bottom Navigation
 * App owns actions/providers; this shell only arranges their entry points.
 * Styles: styles/mobile.css. / 모바일 웹 전용이며 Tauri에는 렌더링하지 않습니다.
 */
import { Check, Pencil, Plus, Search, Settings, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DashboardTab } from "../../types/workspace";
import { MobileNavigation } from "./MobileNavigation";

export const MobileLayout = ({
  tabs,
  activeTabId,
  onSelectTab,
  onOpenSearch,
  onOpenQuickCapture,
  onOpenSettings,
  onAddTab,
  onRenameTab,
  onChangeTabIcon,
  onRemoveTab,
  editMode,
  onToggleEditMode,
  children,
}: {
  tabs: DashboardTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onOpenSearch: () => void;
  onOpenQuickCapture: () => void;
  onOpenSettings: () => void;
  onAddTab: (icon: string) => void;
  onRenameTab: (tabId: string, label: string) => void;
  onChangeTabIcon: (tabId: string, icon: string) => void;
  onRemoveTab: (tabId: string) => void;
  editMode: boolean;
  onToggleEditMode: () => void;
  children: ReactNode;
}) => {
  const scroller = useRef<HTMLDivElement>(null);
  const cancelLabelCommit = useRef(false);
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const label = activeTab?.label ?? "Glassday";
  const [draftLabel, setDraftLabel] = useState(label);

  useEffect(() => {
    setDraftLabel(label);
  }, [activeTabId, label]);

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

  const saveTabLabel = () => {
    if (cancelLabelCommit.current) {
      cancelLabelCommit.current = false;
      return;
    }
    if (!activeTab || activeTab.locked) return;
    onRenameTab(activeTab.id, draftLabel.trim() || "New Tab");
  };

  return (
    <div className="mobile-layout" data-runtime="web" data-display-layout="mobile">
      <header className="mobile-header">
        <div className="mobile-heading">
          <span>Glassday</span>
          {editMode && activeTab && !activeTab.locked ? (
            <div className="mobile-heading-edit-row">
              <input
                className="mobile-heading-name-input"
                value={draftLabel}
                aria-label="워크스페이스 이름 수정"
                onChange={(event) => setDraftLabel(event.target.value)}
                onBlur={saveTabLabel}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.blur();
                  } else if (event.key === "Escape") {
                    cancelLabelCommit.current = true;
                    setDraftLabel(label);
                    event.currentTarget.blur();
                  }
                }}
              />
              <button
                type="button"
                className="mobile-heading-delete"
                title="탭 삭제"
                aria-label={`${label} 탭 삭제`}
                onClick={() => onRemoveTab(activeTab.id)}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <h1>{label}</h1>
          )}
        </div>
        <div className="mobile-header-actions">
          <button type="button" aria-label="Search Glassday" title="Search" onClick={onOpenSearch}><Search size={19} /></button>
          <button type="button" className="mobile-header-quick-capture" aria-label="Quick Capture" title="Quick Capture" onClick={onOpenQuickCapture}><Plus size={21} strokeWidth={2.4} /></button>
          <button
            type="button"
            aria-label={editMode ? "Finish workspace editing" : "Edit workspace"}
            title={editMode ? "Done" : "Edit workspace"}
            aria-pressed={editMode}
            onClick={onToggleEditMode}
          >
            {editMode ? <Check size={19} /> : <Pencil size={18} />}
          </button>
          <button type="button" aria-label="Open settings" title="Settings" onClick={onOpenSettings}><Settings size={19} /></button>
        </div>
      </header>
      <div ref={scroller} className="mobile-main" role="main" aria-label={`${label} workspace`}>
        {children}
      </div>
      <MobileNavigation
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={onSelectTab}
        onOpenQuickCapture={onOpenQuickCapture}
        onAddTab={onAddTab}
        onChangeTabIcon={onChangeTabIcon}
        editMode={editMode}
      />
    </div>
  );
};
