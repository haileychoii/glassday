import { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { DashboardGrid } from "./components/grid/DashboardGrid";
import { DashboardDataProvider } from "./context/DashboardDataContext";
import { SettingsModal } from "./components/settings/SettingsModal";

function App() {
  const [editMode, setEditMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <DashboardDataProvider>
      <AppShell
        editMode={editMode}
        onToggleEditMode={() => setEditMode((prev) => !prev)}
        onOpenSettings={() => setSettingsOpen(true)}
      >
        <DashboardGrid editMode={editMode} />
      </AppShell>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </DashboardDataProvider>
  );
}

export default App;