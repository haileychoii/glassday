
/**
 * ============================================================
 * Glassday — MobileDashboard.tsx
 * ============================================================
 *
 * [1. 이 파일의 역할]
 *
 * 모바일에서 현재 선택한 워크스페이스의 위젯을
 * 위에서 아래로 한 열씩 배치하는 컴포넌트입니다.
 *
 * PC에서 사용하는 Grid 좌표나 위젯 크기를 수정하지 않습니다.
 *
 *
 * [2. 어디에서 호출하나요?]
 *
 * App.tsx
 *   └── MobileLayout.tsx
 *        └── MobileDashboard.tsx  ← 현재 파일
 *
 *
 * [3. 연결되는 파일]
 *
 * src/components/mobile/
 *   ├── MobileDashboard.tsx
 *   ├── MobileStudyCard.tsx
 *   ├── MobileCalendarCard.tsx
 *   └── MobileCareerCard.tsx
 *
 * src/components/widgets/
 *   ├── WidgetSlot.tsx
 *   └── WidgetRenderer.tsx
 *
 * src/styles/
 *   ├── mobile.css
 *   ├── mobile-study.css
 *   ├── mobile-calendar.css
 *   └── mobile-career.css
 *
 *
 * [4. 위젯별 연결 방식]
 *
 * study:
 *   모바일용 Study 카드 사용
 *
 * calendar:
 *   모바일용 Calendar 카드 사용
 *
 * career:
 *   모바일용 Career 카드 사용
 *
 * 그 외:
 *   기존 WidgetSlot을 통해 원래 위젯 표시
 *
 *
 * [5. 데이터 저장]
 *
 * 이 파일은 데이터를 직접 저장하지 않습니다.
 *
 * Study는 기존 Study Planner 저장소,
 * Calendar와 Career는 DashboardDataContext를
 * 통해 데이터를 읽고 수정합니다.
 *
 * 따라서 모바일 UI를 수정해도 기존 기록은 유지됩니다.
 *
 *
 * [6. 수정할 때 주의할 점]
 *
 * - PC 레이아웃과 관련된 코드를 추가하지 마세요.
 * - widget ID를 임의로 변경하지 마세요.
 * - 같은 위젯을 WidgetSlot으로 중복 렌더링하지 마세요.
 * - 모바일 카드 CSS는 카드 파일이 직접 import합니다.
 *
 * ============================================================
 */

import type { DashboardTab } from "../../types/workspace";

import { widgetRegistry } from "../../constants/widgets";

import { WidgetSlot } from "../widgets/WidgetSlot";

import { MobileStudyCard } from "./MobileStudyCard";
import { MobileCalendarCard } from "./MobileCalendarCard";
import { MobileCareerCard } from "./MobileCareerCard";

/**
 * MobileDashboard
 *
 * activeTab:
 * 현재 사용자가 선택한 워크스페이스 정보입니다.
 *
 * activeTab.widgetIds:
 * 해당 워크스페이스에 표시할 위젯 ID 배열입니다.
 *
 * 예시:
 * ["today", "calendar", "study"]
 */
export const MobileDashboard = ({
  activeTab,
}: {
  activeTab: DashboardTab;
}) => {
  return (
    <div className="mobile-dashboard">
      {/*
       * 현재 워크스페이스에 등록된 위젯을
       * 순서대로 렌더링합니다.
       *
       * widgetIds의 순서가 모바일 화면의
       * 위젯 표시 순서가 됩니다.
       */}
      {activeTab.widgetIds.map((id) => {
        /*
         * 모바일 전용 UI가 있는 위젯에만
         * 해당 클래스를 추가합니다.
         *
         * 실제 높이/여백/크기 설정은
         * 각 mobile-*.css 파일에서 담당합니다.
         */
        const slotClassName = [
          "mobile-widget-slot",

          id === "study"
            ? "mobile-widget-slot--study"
            : "",

          id === "calendar"
            ? "mobile-widget-slot--calendar"
            : "",

          id === "career"
            ? "mobile-widget-slot--career"
            : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={id}
            className={slotClassName}
            data-widget-id={id}
            role="region"
            aria-label={widgetRegistry[id]?.label ?? id}
          >
            {/*
             * STUDY PLANNER
             *
             * 연결:
             * MobileStudyCard.tsx
             * mobile-study.css
             *
             * 모바일 전용 요약 카드 및
             * 상세 학습 화면을 사용합니다.
             */}
            {id === "study" ? (
              <MobileStudyCard />
            ) : id === "calendar" ? (
              /*
               * CALENDAR
               *
               * 연결:
               * MobileCalendarCard.tsx
               * mobile-calendar.css
               *
               * 모바일 날짜 탐색 및
               * 일정 목록 화면을 사용합니다.
               */
              <MobileCalendarCard />
            ) : id === "career" ? (
              /*
               * CAREER
               *
               * 연결:
               * MobileCareerCard.tsx
               * mobile-career.css
               *
               * 기업 목록과 지원 현황을
               * 모바일에 맞게 표시합니다.
               *
               * 기존 CareerWidget의
               * 상세 편집 기능을 재사용합니다.
               */
              <MobileCareerCard />
            ) : (
              /*
               * OTHER WIDGETS
               *
               * 아직 모바일 전용 카드가 없는 위젯은
               * 기존 WidgetSlot을 그대로 사용합니다.
               *
               * 예:
               * - Memo
               * - Timer
               * - Money
               * - Daily Journal
               * - Health
               * - Mood
               */
              <WidgetSlot widgetId={id} />
            )}
          </div>
        );
      })}

      {/*
       * EMPTY WORKSPACE
       *
       * 현재 워크스페이스에 등록된 위젯이 없으면
       * 안내 문구를 표시합니다.
       */}
      {activeTab.widgetIds.length === 0 && (
        <p className="mobile-empty">
          이 워크스페이스에는 아직 위젯이 없어.
        </p>
      )}
    </div>
  );
};
