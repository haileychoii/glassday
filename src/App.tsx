import { useEffect, useState } from "react";

import { AppShell } from "./components/layout/AppShell";
import { DashboardGrid } from "./components/grid/DashboardGrid";
import { DashboardDataProvider } from "./context/DashboardDataContext";
import { CloudSyncProvider } from "./context/CloudSyncContext";
import { SettingsModal } from "./components/settings/SettingsModal";
import { applyAppFont, getSavedAppFont, loadSavedCustomFonts } from "./constants/fonts";
import { useDashboardTabs } from "./hooks/useDashboardTabs";

function App() {
  const [editMode, setEditMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    updateActiveTabLayouts,
    addWidgetToActiveTab,
    removeWidgetFromActiveTab,
    addTab,
    renameTab,
    removeTab,
  } = useDashboardTabs();

  useEffect(() => {
    void loadSavedCustomFonts();
    applyAppFont(getSavedAppFont());
  }, []);

  if (!activeTab) {
    return null;
  }

  return (
    <CloudSyncProvider>
      <DashboardDataProvider>
        <AppShell
          editMode={editMode}
          tabs={tabs}
          activeTabId={activeTabId}
          onToggleEditMode={() => setEditMode((prev) => !prev)}
          onOpenSettings={() => setSettingsOpen(true)}
          onSelectTab={setActiveTabId}
          onAddTab={addTab}
          onRenameTab={renameTab}
          onRemoveTab={removeTab}
        >
          <DashboardGrid
            editMode={editMode}
            activeTab={activeTab}
            onLayoutsChange={updateActiveTabLayouts}
            onAddWidget={addWidgetToActiveTab}
            onRemoveWidget={removeWidgetFromActiveTab}
          />
        </AppShell>

        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </DashboardDataProvider>
    </CloudSyncProvider>
  );
}

export default App;
