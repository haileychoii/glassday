import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { DashboardTab } from "../../types/workspace";
// import { PixelDesktopDecor } from "./PixelDesktopDecor";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "glassday.sidebar.collapsed";

type AppShellProps = {
  children: ReactNode;
  editMode: boolean;
  tabs: DashboardTab[];
  activeTabId: string;
  onToggleEditMode: () => void;
  onOpenSettings: () => void;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onRenameTab: (tabId: string, label: string) => void;
  onRemoveTab: (tabId: string) => void;
};

export const AppShell = ({
  children,
  editMode,
  tabs,
  activeTabId,
  onToggleEditMode,
  onOpenSettings,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onRemoveTab,
}: AppShellProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(sidebarCollapsed)
    );
  }, [sidebarCollapsed]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      <div className="fixed inset-0 bg-glass-gradient" />
      {/* <PixelDesktopDecor /> */}

      <div className="relative z-10 min-h-screen p-2 md:p-3">
        <div className="glass-panel liquid-shell min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-1.5rem)] rounded-[2.2rem] overflow-hidden">
          <div className="flex min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-1.5rem)]">
            <Sidebar
              tabs={tabs}
              activeTabId={activeTabId}
              editMode={editMode}
              collapsed={sidebarCollapsed}
              onToggleCollapsed={() =>
                setSidebarCollapsed((current) => !current)
              }
              onSelectTab={onSelectTab}
              onAddTab={onAddTab}
              onRenameTab={onRenameTab}
              onRemoveTab={onRemoveTab}
            />

            <div className="flex-1 min-w-0 flex flex-col">
              <Topbar
                editMode={editMode}
                tabs={tabs}
                activeTabId={activeTabId}
                onToggleEditMode={onToggleEditMode}
                onOpenSettings={onOpenSettings}
                onSelectTab={onSelectTab}
                onAddTab={onAddTab}
                onRenameTab={onRenameTab}
                onRemoveTab={onRemoveTab}
              />

              <main className="flex-1 px-2 py-1.5 md:px-2.5 md:py-2 !overflow-y-auto !overflow-x-hidden bg-transparent">
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
