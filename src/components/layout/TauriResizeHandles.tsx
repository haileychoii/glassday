/**
 * ============================================================
 * Tauri borderless-window resize handles
 * ============================================================
 *
 * Role / 역할:
 * - Restores native edge and corner resizing for Glassday's decoration-free
 *   Tauri window.
 * - Glassday intentionally disables the OS titlebar in `src-tauri/tauri.conf.json`,
 *   so Windows does not provide visible resize borders for us.
 *
 * Connections / 연결 관계:
 * - Parent: `src/components/layout/AppShell.tsx` renders this only in Tauri.
 * - Native permission: `src-tauri/capabilities/default.json` allows
 *   `core:window:allow-start-resize-dragging`.
 * - Hit-area styling: `src/styles/layout.css` positions the eight transparent
 *   edge/corner zones without changing any theme's visible design.
 * ============================================================
 */

import { getCurrentWindow } from "@tauri-apps/api/window";
import type { PointerEvent as ReactPointerEvent } from "react";

type ResizeDirection =
  | "North"
  | "NorthEast"
  | "East"
  | "SouthEast"
  | "South"
  | "SouthWest"
  | "West"
  | "NorthWest";

const RESIZE_DIRECTIONS: ResizeDirection[] = [
  "North",
  "NorthEast",
  "East",
  "SouthEast",
  "South",
  "SouthWest",
  "West",
  "NorthWest",
];

export const TauriResizeHandles = () => {
  const startResize = (
    direction: ResizeDirection,
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    // Only the primary pointer starts a native resize. This prevents a right
    // click near an edge from unexpectedly moving the window border.
    // 한국어: 좌클릭/기본 터치만 크기 조절을 시작해 우클릭 오작동을 막는다.
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    void getCurrentWindow().startResizeDragging(direction).catch((error) => {
      // Debug point: permission or platform failures remain visible in devtools
      // without crashing the dashboard. / 권한 문제를 추적하되 앱은 유지한다.
      console.warn(`Unable to resize Glassday toward ${direction}`, error);
    });
  };

  return (
    <div className="tauri-resize-layer" aria-hidden="true">
      {RESIZE_DIRECTIONS.map((direction) => (
        <div
          key={direction}
          className="tauri-resize-handle"
          data-resize-direction={direction}
          onPointerDown={(event) => startResize(direction, event)}
        />
      ))}
    </div>
  );
};
