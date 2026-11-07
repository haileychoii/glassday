/**
 * ============================================================
 * [Home] One-screen Overview / 한 화면 모아보기
 * ============================================================
 *
 * 역할 / Purpose:
 * - Home에서는 상세 편집기 11개를 길게 쌓지 않고, 오늘 필요한 요약만 보여준다.
 * - 기존 저장 데이터와 자유 배치 Grid는 그대로 두고 표현 방식만 바꾼다.
 *
 * 재사용 / Reuse:
 * - TodayFocusWidget.tsx: Calendar, Career, Memo를 합친 오늘 요약과 Top 3.
 * - AlertCenterWidget.tsx: Career, Study, Journal 저장 상태에서 만든 알림.
 * - 두 컴포넌트가 각 데이터의 기존 Source of Truth를 계속 소유하므로
 *   HomeOverview가 별도 복제 데이터나 새 저장 key를 만들지 않는다.
 * ============================================================
 */
import { LayoutGrid, Rows3 } from "lucide-react";

import { AlertCenterWidget } from "../widgets/AlertCenterWidget";
import { TodayFocusWidget } from "../widgets/TodayFocusWidget";

type HomeOverviewProps = {
  onShowWidgets: () => void;
};

const formatOverviewDate = (date = new Date()) => {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
};

/**
 * 왓띵의 모아보기처럼 요약을 먼저 훑고 원본 Widget으로 들어가는 Home surface.
 * Like a collected diary view, this keeps the first desktop viewport scannable.
 */
export const HomeOverview = ({ onShowWidgets }: HomeOverviewProps) => {
  return (
    <section className="home-overview" aria-label="Home overview">
      <header className="home-overview-header">
        <div className="home-overview-heading">
          <Rows3 aria-hidden="true" />
          <div>
            <h2>오늘 모아보기</h2>
            <p>{formatOverviewDate()}</p>
          </div>
        </div>

        <button
          type="button"
          className="glass-button home-overview-all-button"
          onClick={onShowWidgets}
          title="전체 위젯 보기"
        >
          <LayoutGrid aria-hidden="true" />
          <span>전체 위젯</span>
        </button>
      </header>

      <div className="home-overview-grid">
        <div className="home-overview-panel is-primary">
          <TodayFocusWidget />
        </div>

        <div className="home-overview-panel is-secondary">
          <AlertCenterWidget />
        </div>
      </div>
    </section>
  );
};
