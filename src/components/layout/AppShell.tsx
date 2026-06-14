import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  children: React.ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 -z-10 bg-[hsl(var(--background))]" />

      <div className="fixed inset-0 -z-10 opacity-90 bg-glass-gradient" />

      <div className="min-h-screen p-4 md:p-6">
        <div className="glass-panel min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] rounded-[2rem] overflow-hidden">
          <div className="flex min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)]">
            <Sidebar />

            <div className="flex-1 min-w-0 flex flex-col">
              <Topbar />

              <main className="flex-1 p-4 md:p-6 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
