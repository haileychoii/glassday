import { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { DashboardGrid } from "./components/grid/DashboardGrid";

function App() {
  const [editMode, setEditMode] = useState(false);

  return (
    <AppShell
      editMode={editMode}
      onToggleEditMode={() => setEditMode((prev) => !prev)}
    >
      <DashboardGrid editMode={editMode} />
    </AppShell>
  );
}

export default App;