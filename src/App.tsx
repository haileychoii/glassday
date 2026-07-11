import { useEffect, useState } from "react";

import { AppShell } from "./components/layout/AppShell";
import { DashboardGrid } from "./components/grid/DashboardGrid";
import { DashboardDataProvider } from "./context/DashboardDataContext";
import { CloudSyncProvider } from "./context/CloudSyncContext";
import { SettingsModal } from "./components/settings/SettingsModal";
import { applyAppFont, getSavedAppFont, loadSavedCustomFonts } from "./constants/fonts";
import { useDashboardTabs } from "./hooks/useDashboardTabs";
import type { DashboardLayoutMode } from "./types/workspace";

const DASHBOARD_LAYOUT_MODE_KEY = "glassday.dashboard.layoutMode.v1";

function App() {
  const [editMode, setEditMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<DashboardLayoutMode>(() => {
    if (typeof window === "undefined") return "wide";

    const savedMode = window.localStorage.getItem(DASHBOARD_LAYOUT_MODE_KEY);
    return savedMode === "laptop" ? "laptop" : "wide";
  });

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(DASHBOARD_LAYOUT_MODE_KEY, layoutMode);
  }, [layoutMode]);

  if (!activeTab) {
    return null;
  }

  return (
    <CloudSyncProvider>
      <DashboardDataProvider>
        <AppShell
          editMode={editMode}
          layoutMode={layoutMode}
          tabs={tabs}
          activeTabId={activeTabId}
          onChangeLayoutMode={setLayoutMode}
          onToggleEditMode={() => setEditMode((prev) => !prev)}
          onOpenSettings={() => setSettingsOpen(true)}
          onSelectTab={setActiveTabId}
          onAddTab={addTab}
          onRenameTab={renameTab}
          onRemoveTab={removeTab}
        >
          <DashboardGrid
            editMode={editMode}
            layoutMode={layoutMode}
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
