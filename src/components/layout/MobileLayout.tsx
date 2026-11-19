
/**
 * ============================================================
 * GLASSDAY — MOBILE APPLICATION LAYOUT
 * 파일: src/components/layout/MobileLayout.tsx
 * ============================================================
 *
 * [화면 역할]
 * 모바일 웹의 전체 화면 구조를 담당한다.
 *
 * MobileLayout
 * ├─ mobile-header
 * │  ├─ 현재 Workspace 제목
 * │  ├─ Search
 * │  ├─ Quick Capture
 * │  ├─ Widget Edit
 * │  └─ Settings
 * │
 * ├─ mobile-main
 * │  ├─ MobileDashboard.tsx (일반 모드)
 * │  └─ MobileWidgetEditor.tsx (편집 모드)
 * │
 * └─ MobileNavigation.tsx
 *    └─ 하단 Workspace 탭 이동
 *
 * [연결 파일]
 * - src/App.tsx
 * - src/components/layout/MobileNavigation.tsx
 * - src/components/mobile/MobileDashboard.tsx
 * - src/components/mobile/MobileWidgetEditor.tsx
 * - src/styles/mobile.css
 *
 * [설계 원칙]
 * - App.tsx에서 전달받은 상태와 이벤트만 사용한다.
 * - 위젯 데이터와 레이아웃은 직접 저장하지 않는다.
 * - 불필요한 HTML 래퍼를 추가하지 않는다.
 * - 데스크톱 AppShell 및 Tauri에는 적용하지 않는다.
 * ============================================================
 */

import {
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
} from "lucide-react";

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import type {
  DashboardTab,
} from "../../types/workspace";

import { MobileNavigation } from "./MobileNavigation";

/* ============================================================
 * 01. PROPS
 *
 * App.tsx에서 전달하는 값.
 *
 * widgetEditMode:
 *  false → 일반 Dashboard 화면
 *  true  → 위젯 편집 화면
 *
 * onOpenWidgetEditor:
 *  App.tsx의 setMobileEditMode(true)를 호출한다.
 * ============================================================ */

type MobileLayoutProps = {
  tabs: DashboardTab[];
  activeTabId: string;

  onSelectTab: (id: string) => void;
  onOpenSearch: () => void;
  onOpenQuickCapture: () => void;
  onOpenSettings: () => void;

  widgetEditMode: boolean;
  onOpenWidgetEditor: () => void;

  children: ReactNode;
};

/* ============================================================
 * 02. MOBILE LAYOUT
 * ============================================================ */

export const MobileLayout = ({
  tabs,
  activeTabId,
  onSelectTab,
  onOpenSearch,
  onOpenQuickCapture,
  onOpenSettings,
  widgetEditMode,
  onOpenWidgetEditor,
  children,
}: MobileLayoutProps) => {

  /**
   * 모바일 스크롤 영역.
   *
   * 상단 헤더와 하단 탭 바는 고정하고
   * 가운데 콘텐츠만 스크롤하도록 유지한다.
   */
  const scroller = useRef<HTMLDivElement>(null);

  /* 현재 선택한 Workspace 제목 */
  const activeTabLabel =
    tabs.find((tab) => tab.id === activeTabId)?.label ??
    "Glassday";

  /* ==========================================================
   * 03. SCROLL MANAGEMENT
   *
   * 일반 모드에서:
   * - Workspace 이동 시 스크롤을 맨 위로 이동
   * - 포커스 중인 입력창은 가능하면 위치 유지
   *
   * 편집 모드 진입/종료 시:
   * - 새로운 화면을 위에서부터 보여준다.
   * ========================================================== */

  useEffect(() => {
    const container = scroller.current;

    if (!container) return;

    const activeElement = document.activeElement;

    if (
      !widgetEditMode &&
      activeElement instanceof HTMLElement &&
      container.contains(activeElement)
    ) {
      activeElement.scrollIntoView({
        block: "nearest",
      });
    } else {
      container.scrollTo({
        top: 0,
        behavior: "instant",
      });
    }
  }, [activeTabId, widgetEditMode]);

  /* ==========================================================
   * 04. RENDER
   * ========================================================== */

  return (
    <div
      className="mobile-layout"
      data-runtime="web"
      data-display-layout="mobile"
      data-widget-edit-mode={
        widgetEditMode ? "true" : "false"
      }
    >

      {/* ======================================================
          A. MOBILE HEADER

          일반 모드:
          Glassday / Workspace 이름

          편집 모드:
          Workspace 이름 / 위젯 편집
         ====================================================== */}

      <header className="mobile-header">

        {/* 현재 Workspace 제목 */}
        <div className="mobile-heading">
          <span>
            {widgetEditMode
              ? activeTabLabel
              : "Glassday"}
          </span>

          <h1>
            {widgetEditMode
              ? "위젯 편집"
              : activeTabLabel}
          </h1>
        </div>

        {/* ====================================================
            B. HEADER ACTIONS

            일반 모드에서만 표시한다.

            편집 모드의 완료 버튼은
            MobileWidgetEditor.tsx에서 제공한다.
           ==================================================== */}

        {!widgetEditMode && (
          <div className="mobile-header-actions">

            {/* Search */}
            <button
              type="button"
              aria-label="Search Glassday"
              title="검색"
              onClick={onOpenSearch}
            >
              <Search
                size={19}
                aria-hidden="true"
              />
            </button>

            {/* Quick Capture */}
            <button
              type="button"
              aria-label="Open Quick Capture"
              title="빠른 기록"
              onClick={onOpenQuickCapture}
            >
              <Plus
                size={21}
                aria-hidden="true"
              />
            </button>

            {/* ================================================
                C. MOBILE WIDGET EDIT

                PC editMode와는 별도로 작동한다.

                이 버튼:
                App.tsx
                  → openMobileWidgetEditor()
                  → mobileEditMode = true
                  → MobileWidgetEditor 표시
               ================================================ */}

            <button
              type="button"
              className="mobile-widget-edit-button"
              aria-label="모바일 위젯 편집"
              title="위젯 편집"
              onClick={onOpenWidgetEditor}
            >
              <SlidersHorizontal
                size={19}
                aria-hidden="true"
              />
            </button>

            {/* Settings */}
            <button
              type="button"
              aria-label="Open settings"
              title="설정"
              onClick={onOpenSettings}
            >
              <Settings
                size={19}
                aria-hidden="true"
              />
            </button>

          </div>
        )}

      </header>

      {/* ======================================================
          D. MOBILE SCROLL AREA

          children 내용은 App.tsx에서 결정한다.

          일반 모드:
          <MobileDashboard />

          편집 모드:
          <MobileWidgetEditor />

          같은 영역을 재사용하므로 추가 DOM 래퍼 불필요.
         ====================================================== */}

      <div
        ref={scroller}
        className="mobile-main"
        role="main"
        aria-label={
          widgetEditMode
            ? `${activeTabLabel} 위젯 편집`
            : `${activeTabLabel} workspace`
        }
      >
        {children}
      </div>

      {/* ======================================================
          E. MOBILE BOTTOM NAVIGATION

          기존 Workspace 탭 이동과 Quick Capture 유지.

          편집 도중 다른 Workspace를 누르면
          App.tsx에서 편집 모드를 자동 종료한다.
         ====================================================== */}

      <MobileNavigation
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={onSelectTab}
        onOpenQuickCapture={onOpenQuickCapture}
      />

    </div>
  );
};
