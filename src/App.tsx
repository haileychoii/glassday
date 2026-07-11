import { useEffect, useState } from "react";

import { AppShell } from "./components/layout/AppShell";
import { DashboardGrid } from "./components/grid/DashboardGrid";
import { DashboardDataProvider } from "./context/DashboardDataContext";
import { CloudSyncProvider } from "./context/CloudSyncContext";
import { SettingsModal } from "./components/settings/SettingsModal";
import { applyAppFont, getSavedAppFont, loadSavedCustomFonts } from "./constants/fonts";
import {
  OPEN_WIDGET_EVENT,
  type OpenWidgetDetail,
} from "./constants/widgetNavigation";
import { useDashboardTabs } from "./hooks/useDashboardTabs";
import type { DashboardLayoutMode } from "./types/workspace";

const DASHBOARD_LAYOUT_MODE_KEY = "glassday.dashboard.layoutMode.v1";

const readLayoutModeFromUrl = (): DashboardLayoutMode | null => {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const mode = params.get("layout");

  return mode === "laptop" || mode === "wide" ? mode : null;
};

function App() {
  const [editMode, setEditMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<DashboardLayoutMode>(() => {
    if (typeof window === "undefined") return "wide";

    const urlMode = readLayoutModeFromUrl();
    if (urlMode) return urlMode;

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

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("layout", layoutMode);
    window.history.replaceState({}, "", nextUrl);
  }, [layoutMode]);

  useEffect(() => {
    const handleOpenWidget = (event: Event) => {
      const customEvent = event as CustomEvent<OpenWidgetDetail>;
      const detail = customEvent.detail;

      if (!detail?.widgetId) return;

      const preferredTab =
        detail.preferredTabId &&
        tabs.find((tab) => tab.id === detail.preferredTabId);

      const matchingTab =
        preferredTab && preferredTab.widgetIds.includes(detail.widgetId)
          ? preferredTab
          : tabs.find((tab) => tab.widgetIds.includes(detail.widgetId));

      if (matchingTab) {
        setActiveTabId(matchingTab.id);
      }
    };

    window.addEventListener(OPEN_WIDGET_EVENT, handleOpenWidget);

    return () => {
      window.removeEventListener(OPEN_WIDGET_EVENT, handleOpenWidget);
    };
  }, [setActiveTabId, tabs]);

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
