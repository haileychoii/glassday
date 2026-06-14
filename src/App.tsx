import { AppShell } from "./components/layout/AppShell";
import { DashboardGrid } from "./components/grid/DashboardGrid";



function App() {
  return (
    <AppShell>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Dashboard
        </h2>

        <div className="glass-card p-6">
          Dashboard Grid here
        </div>
      </div>
      <DashboardGrid />
    </AppShell>
  );
}

export default App;