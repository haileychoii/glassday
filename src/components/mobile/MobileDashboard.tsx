
/**
 * ============================================================
 * GLASSDAY — MOBILE DASHBOARD
 * 파일: src/components/mobile/MobileDashboard.tsx
 * ============================================================
 *
 * [화면 역할]
 * 모바일 워크스페이스에 표시할 위젯을 배치한다.
 *
 * [연결 구조]
 * App.tsx
 *  ├─ useMobileWidgetLayout.tsx
 *  │   └─ 위젯 순서 / 표시 여부 / 크기 저장
 *  └─ MobileLayout.tsx
 *      └─ MobileDashboard.tsx
 *          ├─ MobileStudyCard.tsx
 *          ├─ MobileCalendarCard.tsx
 *          ├─ MobileCareerCard.tsx
 *          └─ WidgetSlot.tsx
 *              └─ WidgetRenderer.tsx
 *
 * [관련 CSS]
 * - src/styles/mobile.css
 * - src/styles/mobile-study.css
 * - src/styles/mobile-calendar.css
 * - src/styles/mobile-career.css
 * - src/styles/mobile-finish.css
 *
 * [설계 원칙]
 * 1. 위젯 순서와 크기는 layout prop에서 읽는다.
 * 2. 모바일 배치 데이터는 이 컴포넌트에서 저장하지 않는다.
 * 3. PC Wide/Laptop Grid의 x/y/w/h를 변경하지 않는다.
 * 4. 기존 모바일 전용 카드를 재사용한다.
 * 5. WidgetSlot을 중복 생성하지 않는다.
 * 6. 추가 HTML 래퍼 없이 기존 슬롯을 Grid item으로 사용한다.
 * ============================================================
 */

import type { CSSProperties } from "react";

import { widgetRegistry } from "../../constants/widgets";

import type { DashboardTab } from "../../types/workspace";

import type {
  MobileWidgetItem,
  MobileWidgetLayoutController,
} from "../../hooks/useMobileWidgetLayout";

import { WidgetSlot } from "../widgets/WidgetSlot";

import { MobileStudyCard } from "./MobileStudyCard";
import { MobileCalendarCard } from "./MobileCalendarCard";
import { MobileCareerCard } from "./MobileCareerCard";

/* ============================================================
 * 01. PROPS
 *
 * activeTab:
 * 현재 선택한 워크스페이스.
 *
 * layout:
 * App.tsx에서 useMobileWidgetLayout(activeTab)을
 * 호출한 결과.
 *
 * layout.items에는 아래 정보가 들어 있다.
 * - id
 * - visible
 * - width: "full" | "half"
 * - height: number | null
 * ============================================================ */

type MobileDashboardProps = {
  activeTab: DashboardTab;
  layout: MobileWidgetLayoutController;
};

/* ============================================================
 * 02. WIDGET CONTENT
 *
 * 기존 모바일 전용 위젯 구성 유지.
 *
 * Study / Calendar / Career:
 * 모바일 전용 요약 카드 사용.
 *
 * 그 외:
 * WidgetSlot으로 기존 위젯 인스턴스 연결.
 *
 * 추가 래퍼 없이 내용 컴포넌트만 반환한다.
 * ============================================================ */

const renderMobileWidget = (id: string) => {
  switch (id) {
    case "study":
      return <MobileStudyCard />;

    case "calendar":
      return <MobileCalendarCard />;

    case "career":
      return <MobileCareerCard />;

    default:
      return <WidgetSlot widgetId={id} />;
  }
};

/* ============================================================
 * 03. WIDGET SLOT
 *
 * 실제 Grid에 배치되는 위젯 하나.
 *
 * data-mobile-width:
 *   full → 전체 폭
 *   half → 절반 폭
 *
 * data-mobile-height:
 *   auto   → 기존 CSS 높이
 *   custom → 사용자가 지정한 높이
 *
 * --mobile-widget-height:
 *   사용자 지정 높이를 CSS에 전달하는 변수.
 *
 * 기존 mobile-*.css의 !important 높이 규칙과 충돌하지
 * 않도록, 최종 CSS에서 이 변수를 사용한다.
 * ============================================================ */

const MobileWidgetSlot = ({
  item,
}: {
  item: MobileWidgetItem;
}) => {
  const hasCustomHeight = item.height !== null;

  /**
   * Grid column은 화면에 즉시 반영한다.
   *
   * 전체 폭: 1 / -1
   * 절반 폭: span 1
   *
   * 세로 높이는 CSS 변수로 전달한다.
   * height를 일반 inline style로 직접 적용하면
   * 기존 !important CSS에 덮일 수 있기 때문이다.
   */
  const slotStyle = {
    gridColumn:
      item.width === "half" ? "span 1" : "1 / -1",

    ...(hasCustomHeight
      ? {
          "--mobile-widget-height": `${item.height}px`,
        }
      : {}),
  } as CSSProperties;

  const slotClassName = [
    "mobile-widget-slot",

    idToMobileClass(item.id),

    item.width === "half"
      ? "mobile-widget-slot--half"
      : "mobile-widget-slot--full",

    hasCustomHeight
      ? "mobile-widget-slot--custom-height"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={slotClassName}
      data-widget-id={item.id}
      data-mobile-width={item.width}
      data-mobile-height={
        hasCustomHeight ? "custom" : "auto"
      }
      style={slotStyle}
      role="region"
      aria-label={
        widgetRegistry[item.id]?.label ?? item.id
      }
    >
      {renderMobileWidget(item.id)}
    </div>
  );
};

/* ============================================================
 * 04. MOBILE CARD CLASS
 *
 * 기존 CSS가 참조하는 클래스명 보존.
 * 새로운 위젯 유형을 추가하더라도 기존 스타일이
 * 끊어지지 않도록 별도 함수로 관리한다.
 * ============================================================ */

const idToMobileClass = (id: string): string => {
  switch (id) {
    case "study":
      return "mobile-widget-slot--study";

    case "calendar":
      return "mobile-widget-slot--calendar";

    case "career":
      return "mobile-widget-slot--career";

    default:
      return "";
  }
};

/* ============================================================
 * 05. MAIN DASHBOARD
 *
 * 기존:
 * activeTab.widgetIds.map(...)
 *
 * 변경:
 * layout.items.filter(item => item.visible).map(...)
 *
 * 따라서 모바일 편집기의 설정이 실제 화면에 반영된다.
 * ============================================================ */

export const MobileDashboard = ({
  activeTab,
  layout,
}: MobileDashboardProps) => {
  /**
   * 편집기에서 숨긴 위젯은 표시하지 않는다.
   *
   * 원래 PC 탭에 있는 위젯을 삭제하는 것은 아니다.
   * 모바일에서만 숨기는 처리다.
   */
  const visibleItems = layout.items.filter(
    (item) => item.visible
  );

  return (
    <div
      className="mobile-dashboard"
      data-mobile-grid="editable"
      data-tab-id={activeTab.id}
      aria-label={`${activeTab.label} 모바일 위젯`}
      style={{
        // 모바일에서는 항상 2열 Grid를 사용한다.
        // 전체 폭 위젯은 두 열을 모두 차지한다.
        gridTemplateColumns:
          "repeat(2, minmax(0, 1fr))",
      }}
    >
      {/* ================================================
          A. VISIBLE WIDGETS

          사용자 지정 순서대로 표시한다.
          각 위젯은 기존 컴포넌트와 저장 데이터를 사용.
         ================================================ */}

      {visibleItems.map((item) => (
        <MobileWidgetSlot
          key={item.id}
          item={item}
        />
      ))}

      {/* ================================================
          B. EMPTY WORKSPACE

          모든 위젯이 숨겨졌거나 등록된 위젯이 없을 때.
          모바일 편집기에서 다시 표시할 수 있다.
         ================================================ */}

      {visibleItems.length === 0 && (
        <p
          className="mobile-empty"
          style={{ gridColumn: "1 / -1" }}
        >
          표시할 위젯이 없어.
          위젯 편집에서 다시 추가하거나 표시해 줘.
        </p>
      )}
    </div>
  );
};
