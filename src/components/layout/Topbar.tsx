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
  Columns3,
  LayoutGrid,
  Monitor,
  Rows3,
  Settings,
  Sparkles,
} from "lucide-react";

import { isTauri } from "@tauri-apps/api/core";

import { cn } from "../../lib/utils";
import type {
  DashboardLayoutMode,
  DashboardTab,
} from "../../types/workspace";
import { WorkspaceTabsNav } from "./WorkspaceTabsNav";

type TopbarProps = {
  editMode: boolean;
  layoutMode: DashboardLayoutMode;
  tabs: DashboardTab[];
  activeTabId: string;
  homeViewMode: "overview" | "widgets";

  onChangeLayoutMode: (mode: DashboardLayoutMode) => void;
  onChangeHomeViewMode: (mode: "overview" | "widgets") => void;
  onToggleEditMode: () => void;
  onOpenSettings: () => void;

  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onRenameTab: (tabId: string, label: string) => void;
  onRemoveTab: (tabId: string) => void;
};

export const Topbar = ({
  editMode,
  layoutMode,
  tabs,
  activeTabId,
  homeViewMode,
  onChangeLayoutMode,
  onChangeHomeViewMode,
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
            {/* Home view selector / 홈 보기 전환
                Overview reuses TodayFocus + AlertCenter, while Widgets keeps the
                user's saved DashboardGrid untouched. / 저장된 자유 배치를 덮어쓰지 않는다. */}
            {activeTabId === "home" && !editMode && (
              <div className="home-view-toggle" aria-label="Home view">
                <button
                  type="button"
                  className={cn(
                    "home-view-button",
                    homeViewMode === "overview" && "is-active"
                  )}
                  onClick={() => onChangeHomeViewMode("overview")}
                  aria-pressed={homeViewMode === "overview"}
                  title="오늘 모아보기"
                >
                  <Rows3 aria-hidden="true" />
                  <span>Overview</span>
                </button>

                <button
                  type="button"
                  className={cn(
                    "home-view-button",
                    homeViewMode === "widgets" && "is-active"
                  )}
                  onClick={() => onChangeHomeViewMode("widgets")}
                  aria-pressed={homeViewMode === "widgets"}
                  title="전체 위젯 보기"
                >
                  <Columns3 aria-hidden="true" />
                  <span>Widgets</span>
                </button>
              </div>
            )}

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
