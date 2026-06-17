import { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { DashboardGrid } from "./components/grid/DashboardGrid";
import { DashboardDataProvider } from "./context/DashboardDataContext";

function App() {
  const [editMode, setEditMode] = useState(false);

  return (
    <DashboardDataProvider>
      <AppShell
        editMode={editMode}
        onToggleEditMode={() => setEditMode((prev) => !prev)}
      >
        <DashboardGrid editMode={editMode} />
      </AppShell>
    </DashboardDataProvider>
  );
}

export default App;