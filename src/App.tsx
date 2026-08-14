/**
 * ============================================================
 * [Figma Mapping] Root / Glassday Application
 * ============================================================
 *
 * 화면 역할:
 * - 전역 Provider, AppShell, DashboardGrid, Settings Window를 조립한다.
 * - Wide/Laptop 표시 모드와 Edit/Settings 상태의 최상위 Source of Truth다.
 *
 * 렌더링 위치:
 * - Parent: `src/main.tsx`
 * - Shell: `src/components/layout/AppShell.tsx`
 * - Grid: `src/components/grid/DashboardGrid.tsx`
 * - Overlay: `src/components/settings/SettingsModal.tsx`
 *
 * 데이터 연결:
 * - `CloudSyncProvider`: localStorage snapshot과 Supabase 동기화
 * - `DashboardDataProvider`: Calendar와 Career 공유 데이터
 * - `useDashboardTabs`: Tab별 widgetId와 Wide/Laptop Grid layout 저장
 *
 * Figma 구조:
 * - Root Frame
 *   - App Shell Component
 *   - Settings Floating Window Variant
 *
 * 수정 영향:
 * - Provider 순서를 바꾸면 Context를 읽는 모든 Widget과 Settings에 영향이 간다.
 * - layoutMode 저장 키는 OAuth 복귀와 연결되므로 임의 변경하지 않는다.
 * ============================================================
 */
import { useEffect, useState } from "react";

import { AppShell } from "./components/layout/AppShell";
import { CommandPalette } from "./components/command/CommandPalette";
import { DashboardGrid } from "./components/grid/DashboardGrid";
import { DashboardDataProvider } from "./context/DashboardDataContext";
import { CloudSyncProvider } from "./context/CloudSyncContext";
import { QuickCapture } from "./components/quick-capture/QuickCapture";
import { SettingsModal } from "./components/settings/SettingsModal";
import { GlobalSyncIndicator } from "./components/sync/GlobalSyncIndicator";
import {
  DASHBOARD_LAYOUT_MODE_KEY,
  DASHBOARD_PENDING_AUTH_LAYOUT_MODE_KEY,
} from "./constants/dashboardStorage";
import { applyAppFont, getSavedAppFont, loadSavedCustomFonts } from "./constants/fonts";
import { applyTheme, getCurrentTheme } from "./constants/themes";
import {
  applyScrollbarVisibility,
  getSavedScrollbarVisibility,
} from "./constants/uiPreferences";
import {
  OPEN_WIDGET_EVENT,
  type OpenWidgetDetail,
} from "./constants/widgetNavigation";
import { GLASSDAY_STORAGE_EVENT } from "./lib/glassdayStorage";
import { useDashboardTabs } from "./hooks/useDashboardTabs";
import type { DashboardLayoutMode } from "./types/workspace";

const readLayoutModeFromUrl = (): DashboardLayoutMode | null => {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const mode = params.get("layout");

  return mode === "laptop" || mode === "wide" ? mode : null;
};

/**
 * App
 *
 * URL/localStorage의 layoutMode를 복원하고 현재 DashboardTab을 AppShell과
 * DashboardGrid에 전달한다. Figma에서는 화면 전체 Page와 Overlay Host에
 * 해당하며, Wide/Laptop은 별도 기능이 아니라 동일 UI의 Layout Variant다.
 */
function App() {
  const [editMode, setEditMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [captureStatus, setCaptureStatus] = useState("");
  const [layoutMode, setLayoutMode] = useState<DashboardLayoutMode>(() => {
    if (typeof window === "undefined") return "wide";

    const urlMode = readLayoutModeFromUrl();
    if (urlMode) return urlMode;

    const pendingAuthMode = window.localStorage.getItem(
      DASHBOARD_PENDING_AUTH_LAYOUT_MODE_KEY
    );
    if (pendingAuthMode === "laptop" || pendingAuthMode === "wide") {
      return pendingAuthMode;
    }

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
    applyTheme(getCurrentTheme());
    applyScrollbarVisibility(getSavedScrollbarVisibility());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(DASHBOARD_LAYOUT_MODE_KEY, layoutMode);
    window.localStorage.removeItem(DASHBOARD_PENDING_AUTH_LAYOUT_MODE_KEY);

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("layout", layoutMode);
    window.history.replaceState({}, "", nextUrl);
  }, [layoutMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageModeChange = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string; type: string }>).detail;

      if (detail?.type !== "bulk" && detail?.key !== DASHBOARD_LAYOUT_MODE_KEY) {
        return;
      }

      const savedMode = window.localStorage.getItem(DASHBOARD_LAYOUT_MODE_KEY);

      if (savedMode === "laptop" || savedMode === "wide") {
        setLayoutMode(savedMode);
      }
    };

    window.addEventListener(GLASSDAY_STORAGE_EVENT, handleStorageModeChange);

    return () => {
      window.removeEventListener(GLASSDAY_STORAGE_EVENT, handleStorageModeChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    /* Keyboard command hub:
       Ctrl/Cmd+K opens navigation and search. Ctrl/Cmd+Shift+Space and
       Ctrl/Cmd+N open Quick Capture. Keep this at the app root so every
       workspace shares the same desktop-like shortcuts. / 앱 어디서든 같은
       단축키가 동작하도록 루트에서만 처리한다. */
    const handleKeyDown = (event: KeyboardEvent) => {
      const hasCommandModifier = event.metaKey || event.ctrlKey;
      if (!hasCommandModifier) return;

      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      if ((event.shiftKey && event.code === "Space") || event.key.toLowerCase() === "n") {
        if (isTyping && event.key.toLowerCase() === "n") return;

        event.preventDefault();
        setQuickCaptureOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
    /* Data Provider Stack:
       Cloud snapshot이 localStorage를 복원한 뒤 Dashboard Context와 각 Widget의
       useLocalStorage가 동일 데이터를 다시 읽는 순서다. */
    <CloudSyncProvider>
      <DashboardDataProvider>
        {/* Figma Frame: App Shell / Sidebar + Topbar + Dashboard Content */}
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

        {/* Figma Overlay: Settings Floating Window / Dashboard Grid와 형제 계층 */}
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />

        <CommandPalette
          open={commandPaletteOpen}
          editMode={editMode}
          layoutMode={layoutMode}
          tabs={tabs}
          activeTabId={activeTabId}
          onClose={() => setCommandPaletteOpen(false)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenQuickCapture={() => setQuickCaptureOpen(true)}
          onToggleEditMode={() => setEditMode((prev) => !prev)}
          onSelectTab={setActiveTabId}
          onChangeLayoutMode={setLayoutMode}
        />

        <QuickCapture
          open={quickCaptureOpen}
          onClose={() => setQuickCaptureOpen(false)}
          onCaptured={setCaptureStatus}
        />

        <GlobalSyncIndicator />

        {captureStatus && (
          <div
            className="quick-capture-toast"
            role="status"
            onAnimationEnd={() => setCaptureStatus("")}
          >
            {captureStatus}
          </div>
        )}
      </DashboardDataProvider>
    </CloudSyncProvider>
  );
}

export default App;
