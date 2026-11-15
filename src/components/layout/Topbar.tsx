/**
 * ============================================================
 * [Figma Mapping] Navigation / Topbar
 * ============================================================
 *
 * WEB
 * - 인사말, Wide/Laptop mode, Settings, Edit 명령을 표시한다.
 *
 * TAURI
 * - Layout은 Laptop으로 고정되므로 Wide/Laptop selector를 렌더링하지 않는다.
 * - 기존 Topbar 높이를 변경하지 않고 Window Controls를 통합한다.
 * - Title과 Actions 사이의 빈 공간을 Window Drag Region으로 사용한다.
 *
 * 스타일 연결:
 * - src/styles/layout.css
 * - src/styles/layout-modes.css
 * - src/styles/responsive.css
 * ============================================================
 */

import {
  LayoutGrid,
  Monitor,
  Pin,
  PinOff,
  Settings,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import { isTauri } from "@tauri-apps/api/core";

import { cn } from "../../lib/utils";
import type {
  DashboardLayoutMode,
  DashboardTab,
} from "../../types/workspace";
import { WorkspaceTabsNav } from "./WorkspaceTabsNav";
import {
  getTauriWindowPinned,
  setTauriWindowPinned,
} from "../../utils/tauriDesktop";

type TopbarProps = {
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

const TAURI_PINNED_STORAGE_KEY = "glassday.tauri.windowPinned.v1";

export const Topbar = ({
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
}: TopbarProps) => {
  /*
   * 현재 브라우저가 일반 Web인지 Tauri WebView인지 판별.
   *
   * Web     -> false
   * Tauri   -> true
   */
  const isTauriApp = isTauri();

  /*
   * Tauri-only desktop widget state.
   * EN: Keep the pin state in the native window, not dashboard storage.
   * KO: 고정 여부는 위젯 데이터가 아닌 현재 데스크톱 창 설정으로 관리한다.
   */
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (!isTauriApp) return;

    const savedPinned = window.localStorage.getItem(
      TAURI_PINNED_STORAGE_KEY
    );

    if (savedPinned !== null) {
      const pinned = savedPinned === "true";
      void setTauriWindowPinned(pinned)
        .then(() => setIsPinned(pinned))
        .catch(() => setIsPinned(false));
      return;
    }

    void getTauriWindowPinned()
      .then(setIsPinned)
      .catch(() => setIsPinned(false));
  }, [isTauriApp]);

  const togglePinned = () => {
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    window.localStorage.setItem(
      TAURI_PINNED_STORAGE_KEY,
      String(nextPinned)
    );
    void setTauriWindowPinned(nextPinned).catch(() => {
      /* Restore the visible state if the native window rejects the command. */
      setIsPinned(isPinned);
      window.localStorage.setItem(
        TAURI_PINNED_STORAGE_KEY,
        String(isPinned)
      );
    });
  };

  return (
    <header
      className={cn(
        "topbar",
        isTauriApp && "is-tauri-topbar"
      )}
      data-runtime={isTauriApp ? "tauri" : "web"}
    >
      <div className="topbar-inner">
        {/* ===================================================
            Desktop Topbar Row
        =================================================== */}

        <div className="topbar-heading">
          {/* =================================================
              Greeting
          ================================================= */}

          <div className="topbar-title">
            <div className="topbar-title-row">
              <Sparkles className="topbar-sparkle" />

              <h1>Good Morning, Junhee</h1>
            </div>

            <p>Focus. Create. Elevate.</p>
          </div>

          {/* =================================================
              TAURI WINDOW DRAG REGION

              별도 titlebar를 만들지 않는다.

              기존 Topbar의 Title과 Actions 사이에 존재하는
              빈 공간을 실제 Window drag 영역으로 사용한다.

              data-tauri-drag-region은 이 element 자체에만
              적용되므로 오른쪽 버튼 클릭을 방해하지 않는다.
          ================================================= */}

          {isTauriApp && (
            <div
              className="tauri-topbar-drag-region"
              data-tauri-drag-region
              title="Drag Glassday"
              aria-hidden="true"
            />
          )}

          {/* =================================================
              Topbar Actions
          ================================================= */}

          <div className="topbar-actions">
            {/* ===============================================
                WEB ONLY: Wide / Laptop

                Tauri에서는 Window 자체가 Laptop layout이므로
                selector를 아예 렌더링하지 않는다.
            =============================================== */}

            {!isTauriApp && (
              <div
                className="layout-mode-toggle"
                aria-label="Layout mode"
              >
                <button
                  type="button"
                  onClick={() =>
                    onChangeLayoutMode("wide")
                  }
                  className={cn(
                    "layout-mode-button",
                    layoutMode === "wide" &&
                      "is-active"
                  )}
                  title="Wide web layout"
                  aria-label="Use wide dashboard layout"
                  aria-pressed={
                    layoutMode === "wide"
                  }
                >
                  <Monitor className="w-3.5 h-3.5" />

                  <span>Wide</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onChangeLayoutMode("laptop")
                  }
                  className={cn(
                    "layout-mode-button",
                    layoutMode === "laptop" &&
                      "is-active"
                  )}
                  title="Laptop app preview layout"
                  aria-label="Use laptop dashboard layout"
                  aria-pressed={
                    layoutMode === "laptop"
                  }
                >
                  <LayoutGrid className="w-3.5 h-3.5" />

                  <span>Laptop</span>
                </button>
              </div>
            )}

            {/* ===============================================
                Settings
            =============================================== */}

            <button
              type="button"
              onClick={onOpenSettings}
              className="glass-button topbar-action-button"
              title="Open settings"
              aria-label="Open settings"
            >
              <Settings className="w-3.5 h-3.5" />

              <span>Settings</span>
            </button>

            {isTauriApp && (
              <button
                type="button"
                onClick={togglePinned}
                className={cn(
                  "glass-button topbar-action-button",
                  isPinned && "is-active"
                )}
                title={isPinned ? "Unpin from desktop" : "Pin on desktop"}
                aria-label={isPinned ? "Unpin from desktop" : "Pin on desktop"}
                aria-pressed={isPinned}
              >
                {isPinned ? (
                  <PinOff className="w-3.5 h-3.5" />
                ) : (
                  <Pin className="w-3.5 h-3.5" />
                )}
                <span>{isPinned ? "Unpin" : "Pin"}</span>
              </button>
            )}

            {/* ===============================================
                Edit
            =============================================== */}

            <button
              type="button"
              onClick={onToggleEditMode}
              className={cn(
                "glass-button topbar-action-button",
                editMode && "is-active"
              )}
              title={
                editMode
                  ? "Finish editing dashboard"
                  : "Edit dashboard"
              }
              aria-label={
                editMode
                  ? "Finish editing dashboard"
                  : "Edit dashboard"
              }
              aria-pressed={editMode}
            >
              <LayoutGrid className="w-3.5 h-3.5" />

              <span>
                {editMode ? "Done" : "Edit"}
              </span>
            </button>

            {/* Tauri widget mode keeps only real app actions here.
                Tauri 위젯 모드에서는 창 버튼을 렌더링하지 않고 Settings/Edit만 남긴다. */}
          </div>
        </div>

        {/* ===================================================
            Responsive Workspace Navigation
        =================================================== */}

        <div className="topbar-mobile-workspaces">
          <WorkspaceTabsNav
            tabs={tabs}
            activeTabId={activeTabId}
            editMode={editMode}
            onSelectTab={onSelectTab}
            onAddTab={onAddTab}
            onRenameTab={onRenameTab}
            onRemoveTab={onRemoveTab}
            className="topbar-mobile-workspace-list"
            addButtonClassName="topbar-mobile-add-button"
            showAddButton
          />
        </div>
      </div>
    </header>
  );
};
