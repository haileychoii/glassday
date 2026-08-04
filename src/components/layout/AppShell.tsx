/**
 * ============================================================
 * [Figma Mapping] Layout / App Shell
 * ============================================================
 *
 * 화면 역할:
 * - Sidebar, Topbar, Dashboard Content의 공통 배치 Frame이다.
 * - Wide에서는 viewport를 채우고, Laptop에서는 1080 x 720 preview window 안에
 *   동일한 shellContent를 렌더링한다.
 *
 * 렌더링 위치:
 * - Parent: `src/App.tsx`
 * - Children: `Sidebar.tsx`, `Topbar.tsx`, `DashboardGrid.tsx`
 *
 * 저장 연결:
 * - `glassday.sidebar.collapsed`: Sidebar Component Variant
 * - `glassday.laptopPreview.position.v1`: Laptop preview의 canvas 위치
 *
 * 스타일 연결:
 * - `src/styles/layout.css`: Sidebar/Topbar/Shell 기본 배치
 * - `src/styles/layout-modes.css`: Wide/Laptop frame 차이
 * - 각 Theme CSS: shell surface와 desktop chrome override
 *
 * Figma 구조:
 * - Root Stage
 *   - Laptop Preview Chrome (Laptop Variant only)
 *   - App Shell / Horizontal Auto Layout
 *     - Sidebar / Fixed width
 *     - Main Column / Fill container
 * ============================================================
 */
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { DashboardLayoutMode, DashboardTab } from "../../types/workspace";
// import { PixelDesktopDecor } from "./PixelDesktopDecor";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "glassday.sidebar.collapsed";
const LAPTOP_FRAME_POSITION_STORAGE_KEY = "glassday.laptopPreview.position.v1";

type AppShellProps = {
  /** DashboardGrid를 포함하는 Main Content. Shell은 내용의 데이터에 관여하지 않는다. */
  children: ReactNode;
  /** Sidebar Tab 편집과 Grid drag/resize UI를 동시에 전환한다. */
  editMode: boolean;
  /** Wide viewport 또는 고정 Laptop preview Frame을 선택한다. */
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

/**
 * AppShell
 *
 * Figma Component: `App Shell`
 * Variants: `Wide / Laptop`, `Sidebar Expanded / Collapsed`.
 * Laptop chrome의 drag는 preview 위치만 바꾸며 Dashboard Grid layout에는
 * 영향을 주지 않는다.
 */
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
  });
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [laptopFramePosition, setLaptopFramePosition] = useState(() => {
    if (typeof window === "undefined") {
      return { x: 0, y: 0 };
    }

    try {
      const raw = window.localStorage.getItem(LAPTOP_FRAME_POSITION_STORAGE_KEY);

      if (!raw) {
        return { x: 0, y: 0 };
      }

      const parsed = JSON.parse(raw) as { x?: number; y?: number };

      return {
        x: typeof parsed.x === "number" ? parsed.x : 0,
        y: typeof parsed.y === "number" ? parsed.y : 0,
      };
    } catch {
      return { x: 0, y: 0 };
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(sidebarCollapsed)
    );
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      LAPTOP_FRAME_POSITION_STORAGE_KEY,
      JSON.stringify(laptopFramePosition)
    );
  }, [laptopFramePosition]);

  const startLaptopFrameDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: laptopFramePosition.x,
      originY: laptopFramePosition.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveLaptopFrameDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const nextX = Math.max(0, dragState.originX + (event.clientX - dragState.startX));
    const nextY = Math.max(0, dragState.originY + (event.clientY - dragState.startY));

    setLaptopFramePosition({
      x: nextX,
      y: nextY,
    });
  };

  const finishLaptopFrameDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  /* Shared Shell Content:
     Wide와 Laptop에서 같은 Sidebar/Topbar/Grid DOM을 재사용한다. Figma에서도
     두 Page가 동일 Component instance를 사용하고 크기 Token만 달라야 한다. */
  const shellContent = (
    <div
      className={[
        "glass-panel liquid-shell rounded-[2.2rem] overflow-hidden app-shell-surface",
        layoutMode === "laptop"
          ? "is-laptop h-full min-h-0"
          : "is-wide min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-1.5rem)]",
      ].join(" ")}
      data-sidebar-collapsed={sidebarCollapsed ? "true" : "false"}
    >
      <div
        className={[
          "flex app-shell-columns",
          layoutMode === "laptop"
            ? "h-full min-h-0"
            : "min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-1.5rem)]",
        ].join(" ")}
      >
        {/* Figma Component: Sidebar / Fixed width / Expanded-Collapsed Variant */}
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

        <div className="app-shell-main-column flex-1 min-w-0 flex flex-col">
          {/* Figma Component: Topbar / Horizontal Auto Layout / Space Between */}
          <Topbar
            editMode={editMode}
            layoutMode={layoutMode}
            tabs={tabs}
            activeTabId={activeTabId}
            onChangeLayoutMode={onChangeLayoutMode}
            onToggleEditMode={onToggleEditMode}
            onOpenSettings={onOpenSettings}
            onSelectTab={onSelectTab}
            onAddTab={onAddTab}
            onRenameTab={onRenameTab}
            onRemoveTab={onRemoveTab}
          />

          {/* Scroll Container: Dashboard 전체 세로 스크롤은 이 Main Frame이 담당한다. */}
          <main
            className="app-shell-main flex-1 !overflow-y-auto !overflow-x-hidden bg-transparent"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={[
        "app-mode-stage min-h-screen relative overflow-hidden bg-background text-foreground",
        layoutMode === "laptop" ? "is-laptop-mode" : "is-wide-mode",
      ].join(" ")}
      data-layout-mode={layoutMode}
    >
      <div className="fixed inset-0 bg-glass-gradient" />
      {/* <PixelDesktopDecor /> */}

      {layoutMode === "laptop" ? (
        /* Figma Frame: Laptop Preview / movable desktop canvas object.
           브라우저 viewport가 아니라 이 고정 Frame 크기가 내부 반응형 기준이다. */
        <div className="laptop-preview-stage relative z-10">
          <div
            className="laptop-preview-frame"
            style={{
              transform: `translate(${laptopFramePosition.x}px, ${laptopFramePosition.y}px)`,
            }}
          >
            {/* Figma Component: Desktop Window Title Bar / drag handle */}
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
                <span className="laptop-preview-title">Glassday Laptop App</span>
                <span className="laptop-preview-subtitle">1080 x 720 preview</span>
              </div>

              <div className="laptop-preview-chrome-side laptop-preview-chrome-right">
                <span className="laptop-preview-mode-pill">Laptop Mode</span>
              </div>
            </div>

            {/* Figma Frame: Window Content / 실제 App Shell instance */}
            <div className="laptop-preview-window">{shellContent}</div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 min-h-screen p-2 md:p-3">
          {shellContent}
        </div>
      )}
    </div>
  );
};
