/**
 * ============================================================
 * [Figma Mapping] Layout / App Shell
 * ============================================================
 *
 * WEB
 * - Wide / Laptop layout preview를 기존 방식으로 유지한다.
 * - Laptop에서는 1080 x 720 preview frame을 사용한다.
 *
 * TAURI
 * - 무조건 Laptop layout을 사용한다.
 * - 웹용 Laptop Preview Chrome을 렌더링하지 않는다.
 * - 실제 Glassday App Shell이 Tauri window 전체를 직접 채운다.
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

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

import type {
  DashboardLayoutMode,
  DashboardTab,
} from "../../types/workspace";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "glassday.sidebar.collapsed";
const LAPTOP_FRAME_POSITION_STORAGE_KEY =
  "glassday.laptopPreview.position.v1";

type AppShellProps = {
  children: ReactNode;
  editMode: boolean;
  layoutMode: DashboardLayoutMode;
  tabs: DashboardTab[];
  activeTabId: string;

  onChangeLayoutMode: (mode: DashboardLayoutMode) => void;
  onToggleEditMode: () => void;
  onOpenSettings: () => void;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onRenameTab: (tabId: string, label: string) => void;
  onRemoveTab: (tabId: string) => void;
};

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
  /*
   * =========================================================
   * Runtime
   * =========================================================
   */

  const isTauriApp = isTauri();
useEffect(() => {
  const root = document.documentElement;

  if (isTauriApp) {
    root.classList.add("desktop-transparent");
  } else {
    root.classList.remove("desktop-transparent");
  }

  return () => {
    root.classList.remove("desktop-transparent");
  };
}, [isTauriApp]);
  
/*
 * Tauri에서는 layout 선택 개념이 필요 없다.
 * Tauri에서는 항상 Laptop layout variant를 사용하되,
 * 실제 viewport 크기는 현재 native window 크기를 따른다.
 */
  const effectiveLayoutMode: DashboardLayoutMode = isTauriApp
    ? "laptop"
    : layoutMode;

  /*
   * =========================================================
   * Sidebar state
   * =========================================================
   */

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    return (
      window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true"
    );
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(sidebarCollapsed)
    );
  }, [sidebarCollapsed]);

  /*
   * =========================================================
   * WEB Laptop Preview position
   *
   * Tauri에서는 사용하지 않는다.
   * Vercel/Web Laptop Preview 기능을 유지하기 위해 남겨둔다.
   * =========================================================
   */

  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const [laptopFramePosition, setLaptopFramePosition] = useState(() => {
    if (typeof window === "undefined") {
      return {
        x: 0,
        y: 0,
      };
    }

    try {
      const raw = window.localStorage.getItem(
        LAPTOP_FRAME_POSITION_STORAGE_KEY
      );

      if (!raw) {
        return {
          x: 0,
          y: 0,
        };
      }

      const parsed = JSON.parse(raw) as {
        x?: number;
        y?: number;
      };

      return {
        x: typeof parsed.x === "number" ? parsed.x : 0,
        y: typeof parsed.y === "number" ? parsed.y : 0,
      };
    } catch {
      return {
        x: 0,
        y: 0,
      };
    }
  });

  useEffect(() => {
    /*
     * Tauri에서는 Preview frame 위치를 저장할 필요가 없다.
     */
    if (isTauriApp) return;

    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      LAPTOP_FRAME_POSITION_STORAGE_KEY,
      JSON.stringify(laptopFramePosition)
    );
  }, [isTauriApp, laptopFramePosition]);

  /*
   * =========================================================
   * WEB Laptop Preview drag
   * =========================================================
   */

  const startLaptopFrameDrag = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (isTauriApp) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: laptopFramePosition.x,
      originY: laptopFramePosition.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveLaptopFrameDrag = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (isTauriApp) return;

    const dragState = dragStateRef.current;

    if (!dragState) return;
    if (dragState.pointerId !== event.pointerId) return;

    const nextX = Math.max(
      0,
      dragState.originX + (event.clientX - dragState.startX)
    );

    const nextY = Math.max(
      0,
      dragState.originY + (event.clientY - dragState.startY)
    );

    setLaptopFramePosition({
      x: nextX,
      y: nextY,
    });
  };

  const finishLaptopFrameDrag = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (isTauriApp) return;

    if (dragStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;

    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  /*
   * =========================================================
   * Actual Glassday App
   *
   * WEB / TAURI 모두 동일한 실제 App DOM을 사용한다.
   * =========================================================
   */

const shellContent = (
  <div
    className={[
      "glass-panel liquid-shell rounded-[2.2rem] overflow-hidden app-shell-surface",
      effectiveLayoutMode === "laptop"
        ? "is-laptop h-full min-h-0"
        : "is-wide min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-1.5rem)]",
      isTauriApp ? "is-tauri-app-surface" : "",
    ]
      .filter(Boolean)
      .join(" ")}
    data-sidebar-collapsed={sidebarCollapsed ? "true" : "false"}
  >
    <div
      className={[
        "flex app-shell-columns",
        effectiveLayoutMode === "laptop"
          ? "h-full min-h-0"
          : "min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-1.5rem)]",
      ].join(" ")}
    >
      <Sidebar
        tabs={tabs}
        activeTabId={activeTabId}
        editMode={editMode}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() =>
          setSidebarCollapsed((current) => !current)
        }
        onSelectTab={onSelectTab}
        onAddTab={onAddTab}
        onRenameTab={onRenameTab}
        onRemoveTab={onRemoveTab}
      />

      <div
        className={[
          "app-shell-main-column flex-1 min-w-0 flex flex-col",
          effectiveLayoutMode === "laptop" ? "min-h-0" : "",
        ].join(" ")}
      >
        <Topbar
          editMode={editMode}
          layoutMode={effectiveLayoutMode}
          tabs={tabs}
          activeTabId={activeTabId}
          onChangeLayoutMode={
            isTauriApp ? () => undefined : onChangeLayoutMode
          }
          onToggleEditMode={onToggleEditMode}
          onOpenSettings={onOpenSettings}
          onSelectTab={onSelectTab}
          onAddTab={onAddTab}
          onRenameTab={onRenameTab}
          onRemoveTab={onRemoveTab}
        />

        <main
          className={[
            "app-shell-main flex-1 min-w-0 bg-transparent",
            effectiveLayoutMode === "laptop"
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

  /*
   * =========================================================
   * TAURI
   * =========================================================
   *
   * 중요:
   *
   * Preview frame 없음.
   * Preview chrome 없음.
   * Preview 위치 이동 없음.
   *
   * Tauri Window 1080 x 720
   *         =
   * Glassday App 1080 x 720
   */

  if (isTauriApp) {
    return (
      <div
        // className={[
        //   "app-mode-stage",
        //   "is-laptop-mode",
        //   "is-tauri-mode",
        //   "relative",
        //   "w-screen",
        //   "h-screen",
        //   "overflow-hidden",
        //   "bg-background",
        //   "text-foreground",
        // ].join(" ")}
        className = "tauri-app-window"
        data-layout-mode="laptop"
        data-runtime="tauri"
      >
        {/*
         * 기존 Glassday gradient는 유지하되
         * 이제 preview 밖 배경이 아니라 실제 앱 window 배경이다.
         */}
        {/* <div className="absolute inset-0 bg-glass-gradient" /> */}

        {/* <div className="relative z-10 w-full h-full">
          {shellContent}
        </div> */}
        {shellContent}
      </div>
    );
  }

  /*
   * =========================================================
   * WEB / VERCEL
   * =========================================================
   *
   * 기존 Preview 기능은 그대로 유지한다.
   */

  return (
    <div
      className={[
        "app-mode-stage",
        "min-h-screen",
        "relative",
        // "overflow-hidden",
        "bg-background",
        "text-foreground",
        effectiveLayoutMode === "laptop"
          ? "is-laptop-mode overflow-hidden"
          : "is-wide-mode overflow-x-hidden",
      ].join(" ")}
      data-layout-mode={effectiveLayoutMode}
      data-runtime="web"
    >
      <div className="fixed inset-0 bg-glass-gradient" />

      {effectiveLayoutMode === "laptop" ? (
        /*
         * ====================================================
         * WEB Laptop Preview
         * ====================================================
         */
        <div className="laptop-preview-stage relative z-10">
          <div
            className="laptop-preview-frame"
            style={{
              transform: `translate(
                ${laptopFramePosition.x}px,
                ${laptopFramePosition.y}px
              )`,
            }}
          >
            {/* WEB 전용 Laptop Preview Chrome */}
            <div
              className="laptop-preview-chrome"
              onPointerDown={startLaptopFrameDrag}
              onPointerMove={moveLaptopFrameDrag}
              onPointerUp={finishLaptopFrameDrag}
              onPointerCancel={finishLaptopFrameDrag}
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
        /*
         * ====================================================
         * WEB Wide
         * ====================================================
         */
        <div className="relative z-10 min-h-screen p-2 md:p-3">
          {shellContent}
        </div>
      )}
    </div>
  );
};
