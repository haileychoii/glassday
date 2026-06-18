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

      <div className="fixed inset-0 pointer-events-none opacity-70">
        <div className="absolute left-[8%] top-[10%] w-[360px] h-[360px] rounded-full bg-sky-200/30 blur-[90px]" />
        <div className="absolute right-[10%] top-[8%] w-[320px] h-[320px] rounded-full bg-violet-200/28 blur-[90px]" />
        <div className="absolute left-[18%] bottom-[8%] w-[300px] h-[300px] rounded-full bg-emerald-100/28 blur-[90px]" />
        <div className="absolute right-[18%] bottom-[12%] w-[300px] h-[300px] rounded-full bg-pink-100/28 blur-[90px]" />
      </div>

      <div className="relative z-10 min-h-screen p-4 md:p-6">
        <div className="glass-panel liquid-shell min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] rounded-[2.2rem] overflow-hidden">
          <div className="flex min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)]">
            <Sidebar />

            <div className="flex-1 min-w-0 flex flex-col">
              <Topbar
                editMode={editMode}
                onToggleEditMode={onToggleEditMode}
              />

              <main className="flex-1 p-4 md:p-6 overflow-auto bg-white/[0.035]">
                <div className="mb-5">
                  <div className="glass-chip mb-3 w-fit">
                    Sunday, June 14
                  </div>

                  <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                    Good Evening,{" "}
                    <span className="liquid-text">Junhee</span>
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