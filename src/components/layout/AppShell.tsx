<div className="min-h-screen bg-glass-gradient text-foreground overflow-hidden"></div>
import type { ReactNode } from "react";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  children: ReactNode;
  editMode: boolean;
  onToggleEditMode: () => void;
  onOpenSettings: () => void;
};

export const AppShell = ({
  children,
  editMode,
  onToggleEditMode,
  onOpenSettings,
}: AppShellProps) => {
  return (
    <div className="min-h-screen bg-glass-gradient text-foreground overflow-hidden">
      <div className="min-h-screen flex">
        <Sidebar />

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
  );
};