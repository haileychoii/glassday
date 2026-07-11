import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { DashboardLayoutMode, DashboardTab } from "../../types/workspace";
// import { PixelDesktopDecor } from "./PixelDesktopDecor";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "glassday.sidebar.collapsed";
const LAPTOP_FRAME_POSITION_STORAGE_KEY = "glassday.laptopPreview.position.v1";

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

  const shellContent = (
    <div
      className={[
        "glass-panel liquid-shell rounded-[2.2rem] overflow-hidden app-shell-surface",
        layoutMode === "laptop"
          ? "is-laptop h-full min-h-0"
          : "is-wide min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-1.5rem)]",
      ].join(" ")}
    >
      <div
        className={[
          "flex app-shell-columns",
          layoutMode === "laptop"
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

        <div className="app-shell-main-column flex-1 min-w-0 flex flex-col">
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

          <main
            className={[
              "app-shell-main flex-1 !overflow-y-auto !overflow-x-hidden bg-transparent",
              layoutMode === "laptop"
                ? "px-1.5 py-1.5 md:px-1.5 md:py-1.5"
                : "px-2 py-1.5 md:px-2.5 md:py-2",
            ].join(" ")}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-mode-stage min-h-screen relative overflow-hidden bg-background text-foreground">
      <div className="fixed inset-0 bg-glass-gradient" />
      {/* <PixelDesktopDecor /> */}

      {layoutMode === "laptop" ? (
        <div className="laptop-preview-stage relative z-10">
          <div
            className="laptop-preview-frame"
            style={{
              transform: `translate(${laptopFramePosition.x}px, ${laptopFramePosition.y}px)`,
            }}
          >
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
                <span className="laptop-preview-subtitle">960 x 640 preview</span>
              </div>

              <div className="laptop-preview-chrome-side laptop-preview-chrome-right">
                <span className="laptop-preview-mode-pill">Laptop Mode</span>
              </div>
            </div>

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
