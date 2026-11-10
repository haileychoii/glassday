/**
 * ============================================================================
 * Glassday / MobileDashboard — 휴대전화용 위젯 배치 라우터
 * ============================================================================
 *
 * [이 파일의 역할]
 * src/App.tsx → <MobileLayout> → <MobileDashboard> 순서로 표시됩니다.
 * activeTab.widgetIds는 PC와 같은 목록을 읽지만, 실제 표시 방식만 모바일용으로
 * 교체합니다. 이 파일은 데이터 저장이나 Grid 좌표 수정 기능을 갖고 있지 않습니다.
 *
 * [어떤 위젯을 어떻게 렌더링하나요?]
 * - "study": 이전 작업의 MobileStudyCard (요약 카드 + 모바일 플래너)
 * - "calendar": 이번 작업의 MobileCalendarCard (요약 카드 + 월/주/일정 화면)
 * - 기타: <WidgetSlot>을 사용해서 기존 데스크톱과 동일한 위젯 인스턴스 재사용
 *
 * [다른 파일과의 연결]
 * - src/components/widgets/WidgetRenderer.tsx: 모든 위젯의 실제 인스턴스 관리
 * - src/components/widgets/WidgetSlot.tsx: 위젯이 표시될 DOM 위치 제공
 * - src/constants/widgets.ts: id에 해당하는 접근성 이름 제공
 * - src/styles/mobile.css: 모바일 공통 위젯 슬롯 크기
 * - src/styles/mobile-study.css: Study 카드 스타일
 * - src/styles/mobile-calendar.css: Calendar 카드 스타일
 *
 * [반드시 지킬 것]
 * 데스크톱 WidgetId, Wide/Laptop Grid, 저장키, CloudSync를 수정하지 마세요.
 * 모바일 전용 카드가 위젯 하나의 데이터를 별도 localStorage에 중복 저장해서도
 * 안 됩니다. Study/Calendar 원본 데이터는 기존 Hook/Context에서 읽습니다.
 * ============================================================================
 */

import type { DashboardTab } from "../../types/workspace";
import { widgetRegistry } from "../../constants/widgets";
import { WidgetSlot } from "../widgets/WidgetSlot";
import { MobileStudyCard } from "./MobileStudyCard";
import { MobileCalendarCard } from "./MobileCalendarCard";

export const MobileDashboard = ({ activeTab }: { activeTab: DashboardTab }) => (
  <div className="mobile-dashboard">
    {activeTab.widgetIds.map((id) => (
      <div
        key={id}
        /* Calendar/Study는 카드 내용 높이에 따라 슬롯이 자랍니다.
           다른 위젯은 기존 mobile.css 고정 슬롯 정책을 그대로 사용합니다. */
        className={[
          "mobile-widget-slot",
          id === "study" ? "mobile-widget-slot--study" : "",
          id === "calendar" ? "mobile-widget-slot--calendar" : "",
        ].filter(Boolean).join(" ")}
        data-widget-id={id}
        role="region"
        aria-label={widgetRegistry[id]?.label ?? id}
      >
        {id === "study" ? (
          <MobileStudyCard />
        ) : id === "calendar" ? (
          <MobileCalendarCard />
        ) : (
          <WidgetSlot widgetId={id} />
        )}
      </div>
    ))}

    {/* 위젯 없는 사용자 정의 워크스페이스의 Empty State */}
    {activeTab.widgetIds.length === 0 && (
      <p className="mobile-empty">No widgets in this workspace.</p>
    )}
  </div>
);
