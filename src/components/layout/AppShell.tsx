import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  children: React.ReactNode;
  editMode: boolean;
  onToggleEditMode: () => void;
};

export const AppShell = ({
  children,
  editMode,
  onToggleEditMode,
}: AppShellProps) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      <div className="fixed inset-0 bg-glass-gradient" />

      <div className="relative z-10 min-h-screen p-4 md:p-6">
        <div className="glass-panel min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] rounded-[2rem] overflow-hidden">
          <div className="flex min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)]">
            <Sidebar />

            <div className="flex-1 min-w-0 flex flex-col">
              <Topbar
                editMode={editMode}
                onToggleEditMode={onToggleEditMode}
              />

              <main className="flex-1 p-4 md:p-6 overflow-auto bg-white/5">
                <div className="mb-5">
                  <div className="text-xs text-muted-foreground mb-1">
                    Sunday, June 14
                  </div>

                  <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                    Good Evening, <span className="text-primary">Junhee</span>
                  </h1>

                  <p className="text-sm text-muted-foreground mt-2">
                   {editMode
    ? "Layout Mode is on. Move or resize widgets without editing their content."
    : "Layout is locked. Edit each widget directly from its own card."}
                </p>
                </div>

                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};