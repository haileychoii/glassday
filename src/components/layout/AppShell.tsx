import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { DashboardTab } from "../../types/workspace";

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
  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      <div className="fixed inset-0 bg-glass-gradient" />

      <div className="relative z-10 min-h-screen p-4 md:p-6">
        <div className="glass-panel liquid-shell min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] rounded-[2.2rem] overflow-hidden">
          <div className="flex min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)]">
            <Sidebar
              tabs={tabs}
              activeTabId={activeTabId}
              editMode={editMode}
              onSelectTab={onSelectTab}
              onAddTab={onAddTab}
              onRenameTab={onRenameTab}
              onRemoveTab={onRemoveTab}
            />

            <div className="flex-1 min-w-0 flex flex-col">
              <Topbar
                editMode={editMode}
                onToggleEditMode={onToggleEditMode}
                onOpenSettings={onOpenSettings}
              />

              <main className="flex-1 p-4 md:p-6 overflow-auto bg-transparent">
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};