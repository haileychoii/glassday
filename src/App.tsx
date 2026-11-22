
/**
 * ============================================================
 * GLASSDAY — ROOT APPLICATION
 * 파일: src/App.tsx
 * ============================================================
 *
 * [역할]
 * - 앱 전체 Provider 및 화면 구성
 * - Wide / Laptop / Mobile Web / Tauri 화면 분기
 * - PC 및 모바일 위젯 편집 상태 관리
 * - Settings / Search / Quick Capture 관리
 * - 분리된 위젯 창 렌더링
 *
 * [화면 연결 구조]
 *
 * App.tsx
 * ├─ AppShell.tsx
 * │  └─ DashboardGrid.tsx
 * ├─ MobileLayout.tsx
 * │  ├─ MobileDashboard.tsx
 * │  └─ MobileWidgetEditor.tsx
 * ├─ WidgetRenderer.tsx
 * └─ DetachedWidgetWindow.tsx
 *
 * [저장 구조]
 *
 * PC:
 * - glassday.dashboard.tabs.v1
 * - Wide / Laptop 레이아웃 개별 저장
 *
 * Mobile:
 * - glassday.mobile.widgets.v1
 * - 탭별 위젯 순서 / 표시 여부 / 크기
 *
 * [Runtime 규칙]
 * - Tauri: Laptop 모드 고정
 * - Desktop Web: Wide / Laptop 선택 가능
 * - Mobile Web: 모바일 전용 레이아웃 사용
 *
 * ============================================================
 */

import { useEffect, useMemo, useState } from "react";
import { isNativeDesktopShell } from "./utils/runtime";

/* 01. APP SHELLS */

import { AppShell } from "./components/layout/AppShell";
import { MobileLayout } from "./components/layout/MobileLayout";

/* 02. MOBILE COMPONENTS */

import { MobileDashboard } from "./components/mobile/MobileDashboard";
import { MobileWidgetEditor } from "./components/mobile/MobileWidgetEditor";

/* 03. SHARED WIDGETS */

import { WidgetRenderer } from "./components/widgets/WidgetRenderer";
import { DetachedWidgetWindow } from "./components/widgets/DetachedWidgetWindow";

/* 04. DASHBOARD */

import { DashboardGrid } from "./components/grid/DashboardGrid";

/* 05. GLOBAL OVERLAYS */

import { CommandPalette } from "./components/command/CommandPalette";
import { QuickCapture } from "./components/quick-capture/QuickCapture";
import { SettingsModal } from "./components/settings/SettingsModal";
import { GlobalSyncIndicator } from "./components/sync/GlobalSyncIndicator";

/* 06. DATA PROVIDERS */

import { DashboardDataProvider } from "./context/DashboardDataContext";
import { CloudSyncProvider } from "./context/CloudSyncContext";

/* 07. HOOKS */

import { useDashboardTabs } from "./hooks/useDashboardTabs";
import { useResponsiveLayout } from "./hooks/useResponsiveLayout";
import { useMobileWidgetLayout } from "./hooks/useMobileWidgetLayout";

/* 08. STORAGE CONSTANTS */

import {
  DASHBOARD_LAYOUT_MODE_KEY,
  DASHBOARD_PENDING_AUTH_LAYOUT_MODE_KEY,
} from "./constants/dashboardStorage";

/* 09. FONT / THEME */

import {
  applyAppFont,
  getSavedAppFont,
  hasUserSelectedAppFont,
  loadSavedCustomFonts,
} from "./constants/fonts";

import {
  applyTheme,
  getCurrentTheme,
} from "./constants/themes";

import {
  applyScrollbarVisibility,
  getSavedScrollbarVisibility,
} from "./constants/uiPreferences";

/* 10. WIDGET NAVIGATION */

import {
  OPEN_WIDGET_EVENT,
  type OpenWidgetDetail,
} from "./constants/widgetNavigation";

import { GLASSDAY_STORAGE_EVENT } from "./lib/glassdayStorage";

/* 11. TYPES */

import type { DashboardLayoutMode } from "./types/workspace";
import type { PopoutWidgetId } from "./lib/widgetPopup";


/* ============================================================
   12. DESKTOP LAYOUT RESTORATION

   웹에서 마지막으로 사용한 Wide / Laptop 모드를 복원한다.

   우선순위:
   1. URL
   2. 로그인 직전 Layout Mode
   3. LocalStorage
   4. 기본값 Wide

   Tauri에서 실제 사용하는 모드는 App 내부에서 결정한다.
============================================================ */

const readLayoutModeFromUrl = (): DashboardLayoutMode | null => {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const mode = params.get("layout");

  return mode === "laptop" || mode === "wide"
    ? mode
    : null;
};

const restoreDesktopLayoutMode = (): DashboardLayoutMode => {
  if (typeof window === "undefined") return "wide";

  const urlMode = readLayoutModeFromUrl();

  if (urlMode) return urlMode;

  const pendingMode = window.localStorage.getItem(
    DASHBOARD_PENDING_AUTH_LAYOUT_MODE_KEY
  );

  if (pendingMode === "laptop" || pendingMode === "wide") {
    return pendingMode;
  }

  const savedMode = window.localStorage.getItem(
    DASHBOARD_LAYOUT_MODE_KEY
  );

  return savedMode === "laptop" ? "laptop" : "wide";
};


/* ============================================================
   13. MAIN APPLICATION
============================================================ */

function App() {

  /* ----------------------------------------------------------
     A. RUNTIME / RESPONSIVE SCREEN

     Tauri에서는 창의 가로 길이가 좁아지더라도
     MobileLayout으로 전환하지 않는다.

     창 크기 대응은 DashboardGrid가 담당한다.
  ---------------------------------------------------------- */

  const isTauriApp = isNativeDesktopShell;

  const responsiveMobile = useResponsiveLayout();

  const isMobileWeb = !isTauriApp && responsiveMobile;


  /* ----------------------------------------------------------
     B. DETACHED WIDGET WINDOW

     URL에 floatingWidget이 있는 경우
     전체 Dashboard가 아닌 개별 위젯 창을 표시한다.

     연결: DetachedWidgetWindow.tsx
  ---------------------------------------------------------- */

  const floatingWidgetId: PopoutWidgetId | null = (() => {
    if (typeof window === "undefined") return null;

    const value = new URLSearchParams(
      window.location.search
    ).get("floatingWidget");

    return value === "money" || value === "journal"
      ? value
      : null;
  })();


  /* ----------------------------------------------------------
     C. DESKTOP EDIT STATE

     PC 및 Tauri DashboardGrid의 편집 모드.
     모바일 위젯 편집 상태와 별도로 관리한다.
  ---------------------------------------------------------- */

  const [editMode, setEditMode] = useState(false);


  /* ----------------------------------------------------------
     D. GLOBAL OVERLAY STATES
  ---------------------------------------------------------- */

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [commandPaletteOpen, setCommandPaletteOpen] =
    useState(false);

  const [quickCaptureOpen, setQuickCaptureOpen] =
    useState(false);

  const [captureStatus, setCaptureStatus] = useState("");


  /* ----------------------------------------------------------
     E. DESKTOP LAYOUT MODE

     preferredLayoutMode:
     - 웹에서 사용자가 선택한 Wide / Laptop 모드

     layoutMode:
     - 실제 현재 화면에서 사용하는 모드

     중요:
     Tauri에서는 항상 laptop을 사용한다.

     AppShell, DashboardGrid, CommandPalette가
     모두 동일한 layoutMode를 전달받는다.
  ---------------------------------------------------------- */

  const [preferredLayoutMode, setPreferredLayoutMode] =
    useState<DashboardLayoutMode>(restoreDesktopLayoutMode);

  const layoutMode: DashboardLayoutMode =
    isTauriApp ? "laptop" : preferredLayoutMode;


  /**
   * Layout 변경 요청
   *
   * 웹에서는 Wide / Laptop 변경을 허용한다.
   * Tauri에서는 변경 요청을 무시한다.
   */

  const handleChangeLayoutMode = (
    mode: DashboardLayoutMode
  ) => {
    if (isTauriApp) return;

    setPreferredLayoutMode(mode);
  };


  /* ----------------------------------------------------------
     F. WORKSPACE / DASHBOARD TABS

     연결: src/hooks/useDashboardTabs.ts

     각 탭의 위젯 목록과 PC 레이아웃 좌표를 관리한다.
     위젯의 실제 이동 및 크기 변경 결과도
     updateActiveTabLayouts를 통해 저장된다.
  ---------------------------------------------------------- */

  const {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,

    updateActiveTabLayouts,
    addWidgetToActiveTab,
    removeWidgetFromActiveTab,

    addTab,
    updateTabAppearance,
    renameTab,
    removeTab,
  } = useDashboardTabs();


  /* ----------------------------------------------------------
     G. MOBILE EDIT STATE

     현재 모바일 탭의 위젯 편집 화면을 관리한다.
     PC editMode와는 독립적이다.
  ---------------------------------------------------------- */

  const [mobileEditState, setMobileEditState] = useState<{
    activeTabId: string | null;
    isMobileWeb: boolean;
    open: boolean;
  }>({
    activeTabId: null,
    isMobileWeb: false,
    open: false,
  });

  const mobileEditMode =
    isMobileWeb &&
    mobileEditState.activeTabId === activeTabId &&
    mobileEditState.isMobileWeb === isMobileWeb &&
    mobileEditState.open;


  /* ----------------------------------------------------------
     H. MOBILE WIDGET LAYOUT

     연결: src/hooks/useMobileWidgetLayout.tsx

     모바일 위젯의 순서, 크기, 표시 여부 등을 관리한다.
     PC DashboardTab.layouts는 수정하지 않는다.
  ---------------------------------------------------------- */

  const mobileWidgetLayout = useMobileWidgetLayout(activeTab);


  /* ----------------------------------------------------------
     I. SHARED WIDGET RENDERER

     연결: WidgetRenderer.tsx

     Detached:
     - 분리된 위젯 하나만 렌더링

     PC / Tauri:
     - 현재 DashboardTab의 위젯 사용

     Mobile:
     - 기존 PC 위젯 + 모바일에서 추가한 위젯
     - Set을 사용해 중복 제거
  ---------------------------------------------------------- */

  const rendererWidgetIds = useMemo(() => {
    if (floatingWidgetId) {
      return [floatingWidgetId];
    }

    const baseIds = activeTab.widgetIds;

    if (!isMobileWeb) {
      return baseIds;
    }

    return [
      ...new Set([
        ...baseIds,
        ...mobileWidgetLayout.allWidgetIds,
      ]),
    ];
  }, [
    floatingWidgetId,
    isMobileWeb,
    activeTab.widgetIds,
    mobileWidgetLayout.allWidgetIds,
  ]);


  /* ----------------------------------------------------------
     J. INITIAL FONT / THEME RESTORATION

     앱 시작 시 사용자가 마지막으로 설정한
     폰트, 테마, 스크롤바 설정을 복원한다.
  ---------------------------------------------------------- */

  useEffect(() => {
    void loadSavedCustomFonts();

    const appFontWasUserSelected =
      hasUserSelectedAppFont();

    applyAppFont(getSavedAppFont(), {
      persist: appFontWasUserSelected,
      markUserChoice: false,
    });

    applyTheme(getCurrentTheme());

    applyScrollbarVisibility(
      getSavedScrollbarVisibility()
    );
  }, []);


  /* ----------------------------------------------------------
     K. DESKTOP LAYOUT PERSISTENCE

     웹:
     - 선택한 Wide / Laptop 값을 저장한다.

     Tauri:
     - 실제 모드는 Laptop으로 고정한다.
     - 웹용 Layout Mode 설정을 강제로 덮어쓰지 않는다.

     기존 OAuth 복귀용 저장 키는 유지한다.
  ---------------------------------------------------------- */

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isTauriApp) {
      window.localStorage.setItem(
        DASHBOARD_LAYOUT_MODE_KEY,
        layoutMode
      );
    }

    window.localStorage.removeItem(
      DASHBOARD_PENDING_AUTH_LAYOUT_MODE_KEY
    );

    const nextUrl = new URL(window.location.href);

    nextUrl.searchParams.set("layout", layoutMode);

    window.history.replaceState(
      window.history.state,
      "",
      nextUrl
    );
  }, [layoutMode, isTauriApp]);


  /* ----------------------------------------------------------
     L. CROSS-COMPONENT LAYOUT SYNC

     다른 컴포넌트 또는 CloudSync가 웹 Layout Mode를
     변경하면 현재 화면에 반영한다.

     Tauri는 Laptop 고정이므로 해당 이벤트를
     구독하지 않는다.
  ---------------------------------------------------------- */

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isTauriApp) return;

    const handleStorageModeChange = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          key?: string;
          type: string;
        }>
      ).detail;

      if (
        detail?.type !== "bulk" &&
        detail?.key !== DASHBOARD_LAYOUT_MODE_KEY
      ) {
        return;
      }

      const savedMode = window.localStorage.getItem(
        DASHBOARD_LAYOUT_MODE_KEY
      );

      if (savedMode === "laptop" || savedMode === "wide") {
        setPreferredLayoutMode(savedMode);
      }
    };

    window.addEventListener(
      GLASSDAY_STORAGE_EVENT,
      handleStorageModeChange
    );

    return () => {
      window.removeEventListener(
        GLASSDAY_STORAGE_EVENT,
        handleStorageModeChange
      );
    };
  }, [isTauriApp]);


  /* ----------------------------------------------------------
     M. GLOBAL KEYBOARD SHORTCUTS

     Ctrl / Cmd + K : Search
     Ctrl / Cmd + N : Quick Capture
     Ctrl / Cmd + Shift + Space : Quick Capture
  ---------------------------------------------------------- */

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (floatingWidgetId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const hasCommandModifier =
        event.metaKey || event.ctrlKey;

      if (!hasCommandModifier) return;

      const target = event.target as HTMLElement | null;

      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      const key = event.key.toLowerCase();

      if (key === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      if (
        (event.shiftKey && event.code === "Space") ||
        key === "n"
      ) {
        if (isTyping && key === "n") return;

        event.preventDefault();
        setQuickCaptureOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [floatingWidgetId]);


  /* ----------------------------------------------------------
     N. WIDGET DETAIL NAVIGATION

     다른 위젯에서 Career / Calendar 등의 상세 화면을
     요청하면 해당 위젯이 있는 Workspace로 이동한다.
  ---------------------------------------------------------- */

  useEffect(() => {
    const handleOpenWidget = (event: Event) => {
      const customEvent =
        event as CustomEvent<OpenWidgetDetail>;

      const detail = customEvent.detail;

      if (!detail?.widgetId) return;

      const preferredTab =
        detail.preferredTabId &&
        tabs.find(
          (tab) => tab.id === detail.preferredTabId
        );

      const matchingTab =
        preferredTab &&
        preferredTab.widgetIds.includes(detail.widgetId)
          ? preferredTab
          : tabs.find((tab) =>
              tab.widgetIds.includes(detail.widgetId)
            );

      if (matchingTab) {
        setActiveTabId(matchingTab.id);
      }
    };

    window.addEventListener(
      OPEN_WIDGET_EVENT,
      handleOpenWidget
    );

    return () => {
      window.removeEventListener(
        OPEN_WIDGET_EVENT,
        handleOpenWidget
      );
    };
  }, [setActiveTabId, tabs]);


  /* ----------------------------------------------------------
     O. EDIT MODE ACTIONS

     Topbar와 CommandPalette에서 동일한 편집 로직을 사용한다.

     PC / Tauri:
     - DashboardGrid 편집 모드 전환

     Mobile:
     - MobileWidgetEditor 열기 / 닫기

     실제 위젯 좌표 저장은 DashboardGrid에서 담당한다.
  ---------------------------------------------------------- */

  const openMobileWidgetEditor = () => {
    setMobileEditState({
      activeTabId,
      isMobileWeb,
      open: true,
    });
  };

  const closeMobileWidgetEditor = () => {
    setMobileEditState({
      activeTabId,
      isMobileWeb,
      open: false,
    });
  };

  const handleToggleEditMode = () => {
    if (isMobileWeb) {
      if (mobileEditMode) {
        closeMobileWidgetEditor();
      } else {
        openMobileWidgetEditor();
      }

      return;
    }

    setEditMode((previous) => !previous);
  };


  /* 현재 활성 Workspace가 없는 경우 안전하게 처리 */

  if (!activeTab) {
    return null;
  }


  /* ==========================================================
     P. ROOT PROVIDER STACK

     CloudSyncProvider
     └─ DashboardDataProvider
        ├─ WidgetRenderer
        │  └─ Application Layout
        ├─ SettingsModal
        ├─ CommandPalette
        └─ QuickCapture

     기존 Provider 순서는 변경하지 않는다.
  ========================================================== */

  return (
    <CloudSyncProvider>
      <DashboardDataProvider>

        <WidgetRenderer widgetIds={rendererWidgetIds}>

          {floatingWidgetId ? (

            /* ================================================
               Q. DETACHED WIDGET WINDOW
               개별 위젯 창
            ================================================ */

            <DetachedWidgetWindow
              widgetId={floatingWidgetId}
            />

          ) : isMobileWeb ? (

            /* ================================================
               R. MOBILE WEB
               모바일 전용 화면 및 위젯 편집
            ================================================ */

            <MobileLayout
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={setActiveTabId}
              onOpenSearch={() =>
                setCommandPaletteOpen(true)
              }
              onOpenQuickCapture={() =>
                setQuickCaptureOpen(true)
              }
              onOpenSettings={() =>
                setSettingsOpen(true)
              }
              widgetEditMode={mobileEditMode}
              onOpenWidgetEditor={openMobileWidgetEditor}
            >

              {mobileEditMode ? (

                /* 모바일 위젯 편집 화면 */

                <MobileWidgetEditor
                  layout={mobileWidgetLayout}
                  onClose={closeMobileWidgetEditor}
                />

              ) : (

                /* 일반 모바일 Dashboard */

                <MobileDashboard
                  activeTab={activeTab}
                  layout={mobileWidgetLayout}
                />

              )}

            </MobileLayout>

          ) : (

            /* ================================================
               S. DESKTOP / TAURI

               웹: Wide / Laptop
               Tauri: Laptop 고정

               AppShell과 DashboardGrid에 반드시
               동일한 layoutMode를 전달한다.
            ================================================ */

            <AppShell
              editMode={editMode}
              layoutMode={layoutMode}
              tabs={tabs}
              activeTabId={activeTabId}
              onChangeLayoutMode={handleChangeLayoutMode}
              onToggleEditMode={handleToggleEditMode}
              onOpenSettings={() =>
                setSettingsOpen(true)
              }
              onSelectTab={setActiveTabId}
              onAddTab={addTab}
              onRenameTab={renameTab}
              onRemoveTab={removeTab}
              onUpdateTabAppearance={updateTabAppearance}
            >

              {/* 실제 위젯 배치 및 크기 변경 영역 */}

              <DashboardGrid
                editMode={editMode}
                layoutMode={layoutMode}
                activeTab={activeTab}
                onLayoutsChange={updateActiveTabLayouts}
                onAddWidget={addWidgetToActiveTab}
                onRemoveWidget={removeWidgetFromActiveTab}
              />

            </AppShell>

          )}

        </WidgetRenderer>


        {/* ====================================================
            T. GLOBAL OVERLAYS

            분리 위젯 창에서는 전체 앱의
            Settings / Search / QuickCapture를 표시하지 않는다.
        ==================================================== */}

        {!floatingWidgetId && (
          <>
            <SettingsModal
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
            />

            <CommandPalette
              open={commandPaletteOpen}
              editMode={
                isMobileWeb ? mobileEditMode : editMode
              }
              layoutMode={layoutMode}
              tabs={tabs}
              activeTabId={activeTabId}
              onClose={() =>
                setCommandPaletteOpen(false)
              }
              onOpenSettings={() =>
                setSettingsOpen(true)
              }
              onOpenQuickCapture={() =>
                setQuickCaptureOpen(true)
              }
              onToggleEditMode={handleToggleEditMode}
              onSelectTab={setActiveTabId}
              onChangeLayoutMode={handleChangeLayoutMode}
            />

            <QuickCapture
              open={quickCaptureOpen}
              onClose={() => setQuickCaptureOpen(false)}
              onCaptured={setCaptureStatus}
            />

            <GlobalSyncIndicator />

            {/* Quick Capture 저장 완료 알림 */}

            {captureStatus && (
              <div
                className="quick-capture-toast"
                role="status"
                onAnimationEnd={() => setCaptureStatus("")}
              >
                {captureStatus}
              </div>
            )}
          </>
        )}

      </DashboardDataProvider>
    </CloudSyncProvider>
  );
}

export default App;
