import { Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { isTauriApp } from "../utils/runtime";

export const TauriWindowControls = () => {
  if (!isTauriApp) return null;

  const appWindow = getCurrentWindow();

  return (
    <>
      <div
        className="tauri-drag-region"
        data-tauri-drag-region
        aria-hidden="true"
      />

      <div className="tauri-window-controls">
        <button
          type="button"
          className="tauri-window-control"
          aria-label="Minimize"
          onClick={() => appWindow.minimize()}
        >
          <Minus size={14} strokeWidth={1.8} />
        </button>

        <button
          type="button"
          className="tauri-window-control"
          aria-label="Maximize"
          onClick={() => appWindow.toggleMaximize()}
        >
          <Square size={12} strokeWidth={1.7} />
        </button>

        <button
          type="button"
          className="tauri-window-control tauri-window-control-close"
          aria-label="Close"
          onClick={() => appWindow.close()}
        >
          <X size={15} strokeWidth={1.8} />
        </button>
      </div>
    </>
  );
};