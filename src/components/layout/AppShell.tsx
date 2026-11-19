
/**
 * ============================================================
 * GLASSDAY — APP SHELL
 * 파일: src/components/layout/AppShell.tsx
 * ============================================================
 *
 * [역할]
 * - Glassday 전체 화면의 외부 레이아웃
 * - Sidebar / Topbar / Main 영역 배치
 * - Wide / Laptop / Tauri 화면 관리
 * - Tauri Native Glass 효과 동기화
 * - 웹 Laptop Preview 이동
 *
 * [연결 구조]
 *
 * App.tsx
 * └─ AppShell.tsx
 *    ├─ Sidebar.tsx
 *    └─ Main Column
 *       ├─ Topbar.tsx
 *       └─ DashboardGrid.tsx
 *
 * [관련 CSS]
 * - src/styles/layout.css
 * - src/styles/layout-modes.css
 * - src/styles/responsive.css
 * - src/styles/overrides.css
 *
 * [구조 원칙]
 * - Tauri는 실제 Window 크기를 그대로 사용한다.
 * - 웹용 Laptop Preview는 Tauri에서 렌더링하지 않는다.
 * - 위젯의 크기와 위치는 DashboardGrid에서 계산한다.
 * - Tauri 외곽 모서리는 전용 CSS에서 관리한다.
 *
 * [Figma Mapping]
 * - App Shell
 * - Sidebar / Expanded · Collapsed
 * - Topbar
 * - Main Content Frame
 * ============================================================
 */

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { isTauri } from "@tauri-apps/api/core";

import { getCurrentTheme } from "../../constants/themes";
import { syncNativeGlassEffect } from "../../lib/nativeGlassEffect";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

import type {
  DashboardLayoutMode,
  DashboardTab,
} from "../../types/workspace";


/* ============================================================
   01. STORAGE CONSTANTS

   기존 Sidebar 상태 및 Laptop Preview 위치를 유지한다.
============================================================ */

const SIDEBAR_COLLAPSED_STORAGE_KEY =
  "glassday.sidebar.collapsed";

const LAPTOP_FRAME_POSITION_STORAGE_KEY =
  "glassday.laptopPreview.position.v1";


/* ============================================================
   02. COMPONENT TYPES

   App.tsx에서 전달받는 Props.
   기존 인터페이스를 변경하지 않는다.
============================================================ */

type AppShellProps = {
  children: ReactNode;

  editMode: boolean;
  layoutMode: DashboardLayoutMode;

  tabs: DashboardTab[];
  activeTabId: string;

  onChangeLayoutMode: (
    mode: DashboardLayoutMode
  ) => void;

  onToggleEditMode: () => void;
  onOpenSettings: () => void;

  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;

  onRenameTab: (
    tabId: string,
    label: string
  ) => void;

  onRemoveTab: (tabId: string) => void;
};

type FramePosition = {
  x: number;
  y: number;
};

type FrameDragState = {
  pointerId: number;

  startX: number;
  startY: number;

  originX: number;
  originY: number;
};


/* ============================================================
   03. RESTORE WEB PREVIEW POSITION

   웹 Laptop Preview의 마지막 위치를 복원한다.

   유효하지 않은 저장 데이터는 초기 위치로 복구한다.
============================================================ */

const restoreFramePosition = (): FramePosition => {
  if (typeof window === "undefined") {
    return { x: 0, y: 0 };
  }

  try {
    const raw = window.localStorage.getItem(
      LAPTOP_FRAME_POSITION_STORAGE_KEY
    );

    if (!raw) {
      return { x: 0, y: 0 };
    }

    const parsed = JSON.parse(raw);

    return {
      x: Number.isFinite(parsed.x)
        ? Math.max(0, parsed.x)
        : 0,

      y: Number.isFinite(parsed.y)
        ? Math.max(0, parsed.y)
        : 0,
    };

  } catch {
    return { x: 0, y: 0 };
  }
};


/* ============================================================
   04. APP SHELL
============================================================ */

export const AppShell = ({
  children,

  editMode,
  layoutMode,

  tabs,
  activeTabId,

  onChangeLayoutMode,
  onToggleEditMode,
  onOpenSettings,

  onSelectTab,
  onAddTab,
  onRenameTab,
  onRemoveTab,

}: AppShellProps) => {

  /* ----------------------------------------------------------
     A. RUNTIME

     Tauri: Laptop 모드
     Web: App.tsx에서 전달받은 모드

     App.tsx에서도 동일한 Layout Mode를 사용하므로
     DashboardGrid의 저장 모드와 화면 모드가 일치한다.
  ---------------------------------------------------------- */

  const isTauriApp = isTauri();

  const effectiveLayoutMode: DashboardLayoutMode =
    isTauriApp ? "laptop" : layoutMode;

  const isLaptopMode =
    effectiveLayoutMode === "laptop";


  /* ----------------------------------------------------------
     B. TRANSPARENT ROOT

     Tauri에서만 Native Window의 투명 배경을 사용한다.
  ---------------------------------------------------------- */

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle(
      "desktop-transparent",
      isTauriApp
    );

    return () => {
      root.classList.remove(
        "desktop-transparent"
      );
    };

  }, [isTauriApp]);


  /* ----------------------------------------------------------
     C. NATIVE GLASS MATERIAL

     연결: src/lib/nativeGlassEffect.ts

     Windows의 Native Acrylic / Blur 효과를
     현재 Glassday 테마와 동기화한다.

     웹 화면에는 영향을 주지 않는다.
  ---------------------------------------------------------- */

  useEffect(() => {
    if (!isTauriApp) return;

    const applyCurrentGlassMaterial = () => {
      void syncNativeGlassEffect(
        getCurrentTheme()
      );
    };

    applyCurrentGlassMaterial();

    window.addEventListener(
      "glassday-theme-change",
      applyCurrentGlassMaterial
    );

    return () => {
      window.removeEventListener(
        "glassday-theme-change",
        applyCurrentGlassMaterial
      );
    };

  }, [isTauriApp]);


  /* ----------------------------------------------------------
     D. SIDEBAR STATE

     Sidebar 확장 / 축소 상태를 관리한다.

     Sidebar 너비가 바뀌면 DashboardGrid의
     ResizeObserver가 실제 Canvas 너비를 다시 측정한다.
  ---------------------------------------------------------- */

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(() => {

    if (typeof window === "undefined") {
      return false;
    }

    return (
      window.localStorage.getItem(
        SIDEBAR_COLLAPSED_STORAGE_KEY
      ) === "true"
    );
  });

  useEffect(() => {

    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(sidebarCollapsed)
    );

  }, [sidebarCollapsed]);


  /* ----------------------------------------------------------
     E. WEB LAPTOP PREVIEW STATE

     웹에서만 사용하는 가상 Laptop Frame.

     Tauri에서는 이 Frame을 표시하지 않는다.
  ---------------------------------------------------------- */

  const dragStateRef =
    useRef<FrameDragState | null>(null);

  const [
    laptopFramePosition,
    setLaptopFramePosition,
  ] = useState<FramePosition>(
    restoreFramePosition
  );

  useEffect(() => {
    if (isTauriApp) return;

    window.localStorage.setItem(
      LAPTOP_FRAME_POSITION_STORAGE_KEY,
      JSON.stringify(laptopFramePosition)
    );

  }, [
    isTauriApp,
    laptopFramePosition,
  ]);


  /* ----------------------------------------------------------
     F. WEB LAPTOP PREVIEW DRAG

     웹용 Preview의 제목 표시줄을 이동할 때만 작동한다.

     실제 Tauri Window 이동과는 별개의 기능이다.
  ---------------------------------------------------------- */

  const startLaptopFrameDrag = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (isTauriApp) return;
    if (event.button !== 0) return;

    dragStateRef.current = {
      pointerId: event.pointerId,

      startX: event.clientX,
      startY: event.clientY,

      originX: laptopFramePosition.x,
      originY: laptopFramePosition.y,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  };

  const moveLaptopFrameDrag = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (isTauriApp) return;

    const dragState = dragStateRef.current;

    if (!dragState) return;

    if (
      dragState.pointerId !== event.pointerId
    ) {
      return;
    }

    setLaptopFramePosition({
      x: Math.max(
        0,
        dragState.originX +
          event.clientX -
          dragState.startX
      ),

      y: Math.max(
        0,
        dragState.originY +
          event.clientY -
          dragState.startY
      ),
    });
  };

  const finishLaptopFrameDrag = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (isTauriApp) return;

    if (
      dragStateRef.current?.pointerId !==
      event.pointerId
    ) {
      return;
    }

    dragStateRef.current = null;

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }
  };


  /* ==========================================================
     G. SHARED APPLICATION SURFACE

     웹과 Tauri에서 공통으로 사용하는 실제 App DOM.

     중요:
     - Tauri에서는 rounded-[2.2rem]을 적용하지 않는다.
     - Main Column은 Sidebar를 제외한 나머지 폭을 사용한다.
     - 자식 위젯 때문에 Main Column이 커지지 않도록
       min-w-0을 유지한다.
     - 세로 스크롤은 main에서 담당한다.
  ========================================================== */

  const shellContent = (
    <div
      className={[
        "glass-panel",
        "liquid-shell",
        "app-shell-surface",
        "overflow-hidden",
        "w-full min-w-0 max-w-full",

        isLaptopMode
          ? "is-laptop h-full min-h-0"
          : "is-wide min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-1.5rem)]",

        // 외부 모서리는 Tauri 전용 CSS에서 관리
        isTauriApp
          ? "is-tauri-app-surface"
          : "rounded-[2.2rem]",
      ].join(" ")}

      data-sidebar-collapsed={
        sidebarCollapsed ? "true" : "false"
      }
    >

      {/* Sidebar와 Main Content를 가로로 배치 */}

      <div
        className={[
          "app-shell-columns",
          "flex w-full min-w-0 max-w-full",

          isLaptopMode
            ? "h-full min-h-0"
            : "min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-1.5rem)]",
        ].join(" ")}
      >

        {/* Workspace Navigation */}

        <Sidebar
          tabs={tabs}
          activeTabId={activeTabId}
          editMode={editMode}

          collapsed={sidebarCollapsed}

          onToggleCollapsed={() =>
            setSidebarCollapsed(
              (current) => !current
            )
          }

          onSelectTab={onSelectTab}
          onAddTab={onAddTab}
          onRenameTab={onRenameTab}
          onRemoveTab={onRemoveTab}
        />


        {/* Sidebar를 제외한 나머지 화면 영역 */}

        <div
          className={[
            "app-shell-main-column",
            "flex flex-1 flex-col",
            "min-w-0 max-w-full",

            isLaptopMode ? "min-h-0" : "",
          ].join(" ")}
        >

          {/* 상단 Toolbar */}

          <Topbar
            editMode={editMode}

            layoutMode={effectiveLayoutMode}

            tabs={tabs}
            activeTabId={activeTabId}

            onChangeLayoutMode={
              isTauriApp
                ? () => undefined
                : onChangeLayoutMode
            }

            onToggleEditMode={onToggleEditMode}
            onOpenSettings={onOpenSettings}

            onSelectTab={onSelectTab}
            onAddTab={onAddTab}
            onRenameTab={onRenameTab}
            onRemoveTab={onRemoveTab}
          />


          {/* 실제 Dashboard / Diary 영역 */}

          <main
            className={[
              "app-shell-main",
              "flex-1",
              "w-full min-w-0 max-w-full",
              "bg-transparent",

              isLaptopMode
                ? "min-h-0 overflow-y-auto overflow-x-hidden"
                : "overflow-visible",
            ].join(" ")}
          >
            {children}
          </main>

        </div>

      </div>

    </div>
  );


  /* ==========================================================
     H. TAURI NATIVE WINDOW

     실제 Windows App.

     불필요한 웹 Preview Frame 없이
     Glassday Surface가 Window 전체를 차지한다.

     외곽 Radius 및 Native Window 관련 스타일은
     layout.css / overrides.css에서 관리한다.
  ========================================================== */

  if (isTauriApp) {
    return (
      <div
        className="tauri-app-window"

        data-layout-mode="laptop"
        data-runtime="tauri"
      >
        {shellContent}
      </div>
    );
  }


  /* ==========================================================
     I. WEB / VERCEL

     기존 Wide / Laptop Preview 기능을 유지한다.
  ========================================================== */

  return (
    <div
      className={[
        "app-mode-stage",
        "min-h-screen relative",
        "bg-background text-foreground",

        isLaptopMode
          ? "is-laptop-mode overflow-hidden"
          : "is-wide-mode overflow-x-hidden",
      ].join(" ")}

      data-layout-mode={effectiveLayoutMode}
      data-runtime="web"
    >

      {/* Web 전용 Background */}

      <div className="fixed inset-0 bg-glass-gradient" />


      {isLaptopMode ? (

        /* ====================================================
           J. WEB LAPTOP PREVIEW
        ==================================================== */

        <div className="laptop-preview-stage relative z-10">

          <div
            className="laptop-preview-frame"

            style={{
              transform:
                `translate(${laptopFramePosition.x}px, ${laptopFramePosition.y}px)`,
            }}
          >

            {/* 웹용 가상 제목 표시줄 */}

            <div
              className="laptop-preview-chrome"

              onPointerDown={startLaptopFrameDrag}
              onPointerMove={moveLaptopFrameDrag}
              onPointerUp={finishLaptopFrameDrag}
              onPointerCancel={finishLaptopFrameDrag}

              onLostPointerCapture={() => {
                dragStateRef.current = null;
              }}
            >

              <div className="laptop-preview-chrome-side laptop-preview-chrome-left">

                <span className="laptop-preview-traffic">
                  <span className="is-close" />
                  <span className="is-minimize" />
                  <span className="is-expand" />
                </span>

              </div>


              <div className="laptop-preview-chrome-center">

                <span className="laptop-preview-title">
                  Glassday Laptop App
                </span>

                <span className="laptop-preview-subtitle">
                  1080 x 720 preview
                </span>

              </div>


              <div className="laptop-preview-chrome-side laptop-preview-chrome-right">

                <span className="laptop-preview-mode-pill">
                  Laptop Mode
                </span>

              </div>

            </div>


            {/* 실제 Glassday App */}

            <div className="laptop-preview-window">
              {shellContent}
            </div>

          </div>

        </div>

      ) : (

        /* ====================================================
           K. WEB WIDE
        ==================================================== */

        <div className="relative z-10 min-h-screen p-2 md:p-3">
          {shellContent}
        </div>

      )}

    </div>
  );
};
