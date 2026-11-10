/**
 * ============================================================================
 * Glassday / MobileCareerCard.tsx
 * ============================================================================
 *
 * [어느 화면을 바꾸나요?]
 * 휴대전화의 Career(취업 지원 관리) 위젯만 바꿉니다.
 * - 홈/워크스페이스: 주요 숫자 + 다음 일정 + 기업 미리보기 카드
 * - '전체 보기': 검색, 전형 상태 필터, 전체 기업 목록이 있는 전체 화면
 * - 기업 선택: 기존 CareerWidget의 상세 편집 창 열기
 * PC의 CareerWidget 목록이나 Wide/Laptop Grid 배치는 변경하지 않습니다.
 *
 * [파일 연결도]
 * App.tsx
 *   └─ MobileLayout.tsx
 *       └─ MobileDashboard.tsx
 *           └─ MobileCareerCard.tsx (현재 파일)
 *               ├─ DashboardDataContext.tsx : 기업 원본 데이터 / 생성 / 상세 열기
 *               ├─ types/dashboard.ts : CareerItem / CareerStatus 타입
 *               ├─ calendar/calendarUtils.ts : 로컬 날짜 파싱
 *               └─ styles/mobile-career.css : 모바일 전용 디자인
 *
 * [기존 Career 상세 창과 이어지는 과정]
 * 1. 이 카드가 useDashboardData().openCareerDetail(기업ID)를 호출합니다.
 * 2. 같은 Provider를 구독하는 CareerWidget.tsx가 activeCareerDetailId를 읽습니다.
 * 3. CareerWidget.tsx가 본래 가지고 있던 포털 상세 편집기를 띄웁니다.
 * 4. 회사/자소서/전형/면접/일정은 원래의 updateCareerApplication 경로로 저장됩니다.
 *
 * 중요: WidgetRenderer.tsx가 CareerWidget을 이미 유지하므로 이 컴포넌트에서
 * <CareerWidget />을 다시 렌더링하지 마세요. 중복 인스턴스가 생깁니다.
 *
 * [저장·동기화]
 * 이 파일은 localStorage를 직접 사용하지 않습니다.
 * - 기존 저장 키: glassday.career.applications.v2
 * - Calendar 연결: DashboardDataContext에서 기존 방식으로 업데이트
 * - Supabase 동기화: CloudSyncContext의 기존 로직 그대로 사용
 *
 * [크기와 접근성]
 * - 카드 본문 13px, 보조 설명 11~12px, 제목 15px 중심으로 통일
 * - 클릭하는 목록 행과 주요 버튼은 최소 44px 확보
 * - 검색 input 16px: 모바일 Safari에서 포커스 시 자동 줌 방지
 * - 전체 화면은 createPortal(document.body)로 렌더링하여 레이아웃 잘림 방지
 * ============================================================================
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  ChevronRight,
  Plus,
  Search,
  X,
} from "lucide-react";

import { useDashboardData } from "../../context/DashboardDataContext";
import type { CareerItem, CareerStatus } from "../../types/dashboard";
import { parseDate, toLocalDateInput } from "../widgets/calendar/calendarUtils";
import "../../styles/mobile-career.css";

/**
 * 기존 CareerItem.status와 완전히 동일한 id를 사용합니다.
 * 임의로 status 값을 한글로 저장하면 PC 필터가 깨지므로 label만 번역합니다.
 */
const STATUSES: ReadonlyArray<{ id: CareerStatus; label: string }> = [
  { id: "Saved", label: "보관" },
  { id: "Preparing", label: "준비중" },
  { id: "Applied", label: "지원완료" },
  { id: "Interview", label: "면접" },
  { id: "Offer", label: "오퍼" },
  { id: "Rejected", label: "불합격" },
  { id: "Completed", label: "종료" },
];

type StatusFilter = CareerStatus | "All";

type NextSchedule = {
  date: string;
  label: string;
  dday: number;
};

/** YYYY-MM-DD를 UTC 달력 일수로 계산합니다. 시간대·서머타임 영향 방지. */
const dateOrdinal = (date: string) => {
  const parts = date.split("-").map(Number);
  if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) {
    return null;
  }
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;
  return Math.round(Date.UTC(year, month - 1, day) / 86400000);
};

const daysUntil = (date: string, today: string): number | null => {
  const target = dateOrdinal(date);
  const baseline = dateOrdinal(today);
  return target === null || baseline === null ? null : target - baseline;
};

/** 각 기업의 예정된 전형과 지원 마감 중 가장 가까운 미래 일정 하나를 고릅니다. */
const findNextSchedule = (item: CareerItem, today: string): NextSchedule | null => {
  const fromStages = (item.stages ?? [])
    .filter((stage) => stage.date && stage.status !== "done" && stage.status !== "skipped")
    .map((stage) => ({ date: stage.date ?? "", label: stage.label || "전형 일정" }));
  const applicationEnd = item.applicationEndDate || item.deadline;
  const fallback = applicationEnd
    ? [{ date: applicationEnd, label: "지원 마감" }]
    : [];

  return [...fromStages, ...fallback]
    .map((candidate) => ({ ...candidate, dday: daysUntil(candidate.date, today) }))
    .filter((candidate): candidate is NextSchedule =>
      candidate.dday !== null && candidate.dday >= 0
    )
    .sort((a, b) => a.dday - b.dday)[0] ?? null;
};

/** D-0, D-1처럼 눈에 익은 표기로 표시하고 날짜는 별도로 유지합니다. */
const ddayText = (days: number) => (days === 0 ? "D-DAY" : `D-${days}`);

/** 영문 status는 그대로 두고 UI 표시 문구만 한국어로 변환합니다. */
const statusLabel = (status: CareerStatus) =>
  STATUSES.find((item) => item.id === status)?.label ?? status;

const formatShortDate = (date: string) => {
  const parsed = parseDate(date);
  return `${parsed.getMonth() + 1}/${parsed.getDate()}`;
};

/**
 * Card와 상세 목록에서 동일하게 사용하는 한 기업 행.
 * row 자체를 버튼으로 만들었기 때문에 별도 클릭 핸들러를 자식에 중첩하지 않습니다.
 */
const CareerRow = ({
  item,
  schedule,
  onOpen,
  compact = false,
}: {
  item: CareerItem;
  schedule: NextSchedule | null;
  onOpen: (id: string) => void;
  compact?: boolean;
}) => (
  <button
    type="button"
    className={`mobile-career-row${compact ? " mobile-career-row--compact" : ""}`}
    onClick={() => onOpen(item.id)}
    aria-label={`${item.company || "회사 미입력"}, ${item.role || "직무 미입력"}, ${statusLabel(item.status)}, 상세 편집 열기`}
  >
    <span
      className="mobile-career-row__accent"
      aria-hidden="true"
      style={{ "--mc-company-color": item.calendarColor || "#C6DEF1" } as CSSProperties}
    />
    <span className="mobile-career-row__content">
      <span className="mobile-career-row__top">
        <strong>{item.company || "회사 미입력"}</strong>
        <span className={`mobile-career-status mobile-career-status--${item.status.toLowerCase()}`}>
          {statusLabel(item.status)}
        </span>
      </span>
      <span className="mobile-career-row__role">{item.role || "직무 미입력"}</span>
      {schedule && (
        <span className="mobile-career-row__schedule">
          <CalendarClock size={12} aria-hidden="true" />
          {schedule.label} · {formatShortDate(schedule.date)}
          <b className={schedule.dday <= 3 ? "is-urgent" : ""}>
            {ddayText(schedule.dday)}
          </b>
        </span>
      )}
    </span>
    <ChevronRight size={17} aria-hidden="true" className="mobile-career-row__chevron" />
  </button>
);

export const MobileCareerCard = () => {
  /** 원본 데이터·액션을 Context에서 받아 PC/모바일 데이터가 일치하도록 합니다. */
  const {
    careerApplications,
    openCareerDetail,
    addCareerApplication,
  } = useDashboardData();

  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [query, setQuery] = useState("");
  const [onlyUpcoming, setOnlyUpcoming] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const today = toLocalDateInput();

  /**
   * 목록 데이터를 정렬하되 CareerItem 자체를 직접 수정하지 않습니다.
   * 1) 날짜 있는 임박한 일정 먼저, 2) 일정이 없으면 최근 수정된 기업 우선.
   * 같은 기준을 카드와 전체 화면에 적용하여 순서가 튀지 않도록 합니다.
   */
  const ordered = useMemo(() => {
    return [...careerApplications].sort((a, b) => {
      const aSchedule = findNextSchedule(a, today);
      const bSchedule = findNextSchedule(b, today);
      if (aSchedule && bSchedule) return aSchedule.dday - bSchedule.dday;
      if (aSchedule) return -1;
      if (bSchedule) return 1;
      return (b.updatedAt || b.createdAt || "").localeCompare(
        a.updatedAt || a.createdAt || "",
      );
    });
  }, [careerApplications, today]);

  const upcoming = useMemo(() =>
    ordered.flatMap((item) => {
      const schedule = findNextSchedule(item, today);
      return schedule ? [{ item, schedule }] : [];
    }), [ordered, today]);

  const counts = useMemo(() => ({
    total: careerApplications.length,
    inProgress: careerApplications.filter((item) =>
      ["Preparing", "Applied", "Interview"].includes(item.status)
    ).length,
    urgent: upcoming.filter(({ schedule }) => schedule.dday <= 7).length,
  }), [careerApplications, upcoming]);

  /** 검색은 회사명과 직무명 모두에 적용합니다. 필터를 바꿔도 원본은 바뀌지 않습니다. */
  const visible = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("ko-KR");
    return ordered.filter((item) => {
      if (filter !== "All" && item.status !== filter) return false;
      if (onlyUpcoming && !findNextSchedule(item, today)) return false;
      return (
        !keyword ||
        item.company.toLocaleLowerCase("ko-KR").includes(keyword) ||
        item.role.toLocaleLowerCase("ko-KR").includes(keyword)
      );
    });
  }, [ordered, filter, onlyUpcoming, query, today]);

  /** CareerWidget의 기존 상세 창을 열고 Context를 통해 현재 기업을 선택합니다. */
  const openItem = (id: string) => {
    openCareerDetail(id);
  };

  /**
   * 기존 Context는 새 항목을 즉시 저장하고 상세 창을 자동으로 엽니다.
   * 따라서 새 회사 버튼은 임시 초안이 아니라 실제 기업 생성 동작입니다.
   */
  const createItem = () => {
    addCareerApplication({
      company: "새 회사",
      role: "지원 직무 입력",
      status: "Preparing",
    });
  };

  /**
   * 전체 화면만 포털로 열어서 MobileLayout의 고정 헤더/하단탭과 독립시킵니다.
   * CareerWidget 자체의 별도 상세 편집 포털이 위에 열릴 때는 Escape/Tab을
   * 가로채지 않습니다. 상세 편집 창 닫기는 기존 CareerWidget 버튼을 이용합니다.
   */
  useEffect(() => {
    if (!expanded) return;
    const beforeOverflow = document.body.style.overflow;
    const beforeFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const keyHandler = (event: KeyboardEvent) => {
      if (document.querySelector(".career-floating-window")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setExpanded(false);
        return;
      }
      if (event.key !== "Tab") return;
      const modal = document.querySelector<HTMLElement>(".mobile-career-detail");
      if (!modal) return;
      const options = Array.from(modal.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      )).filter((element) => element.getClientRects().length > 0);
      const first = options[0];
      const last = options[options.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("keydown", keyHandler);
      document.body.style.overflow = beforeOverflow;
      (triggerRef.current ?? beforeFocus)?.focus();
    };
  }, [expanded]);

  return (
    <>
      {/* ================================================================
         A. 모바일 워크스페이스에 보이는 Compact Summary Card
         높이를 자동으로 계산하며 PC의 CareerWidget은 별도 인스턴스로 만들지 않음.
         ================================================================ */}
      <section className="mobile-career-card" aria-label="Career 지원 현황">
        <div className="mobile-career-card__header">
          <div className="mobile-career-card__heading">
            <BriefcaseBusiness size={17} aria-hidden="true" />
            <strong>Career</strong>
          </div>
          <button
            type="button"
            ref={triggerRef}
            className="mobile-career-card__open"
            onClick={() => setExpanded(true)}
            aria-haspopup="dialog"
          >
            전체 보기 <ArrowUpRight size={15} aria-hidden="true" />
          </button>
        </div>

        {/* 세 숫자 모두 실제 Context 데이터를 계산해 표시합니다. */}
        <div className="mobile-career-metrics" aria-label="지원 요약">
          <div><strong>{counts.total}</strong><span>전체 지원</span></div>
          <div><strong>{counts.inProgress}</strong><span>진행 중</span></div>
          <div><strong>{counts.urgent}</strong><span>7일 내 일정</span></div>
        </div>

        <div className="mobile-career-card__section-head">
          <strong>다음 일정</strong>
          <button type="button" onClick={createItem} className="mobile-career-card__add">
            <Plus size={15} aria-hidden="true" /> 기업 추가
          </button>
        </div>

        {upcoming.length > 0 ? (
          <div className="mobile-career-next">
            <span>{upcoming[0].schedule.label} · {formatShortDate(upcoming[0].schedule.date)}</span>
            <strong>{upcoming[0].item.company}</strong>
            <b>{ddayText(upcoming[0].schedule.dday)}</b>
          </div>
        ) : (
          <p className="mobile-career-card__empty">등록된 예정 일정이 없어.</p>
        )}

        <div className="mobile-career-card__preview">
          {ordered.length === 0 ? (
            <p className="mobile-career-card__empty">아직 등록한 기업이 없어. 기업 추가로 시작해 봐.</p>
          ) : ordered.slice(0, 3).map((item) => (
            <CareerRow
              key={item.id}
              item={item}
              schedule={findNextSchedule(item, today)}
              compact
              onOpen={openItem}
            />
          ))}
        </div>
      </section>

      {/* ================================================================
         B. '전체 보기'를 누를 때만 document.body에 추가되는 포털.
         검색 / 상태 필터 / 예정 일정 필터는 UI 전용 state입니다.
         ================================================================ */}
      {expanded && typeof document !== "undefined" && createPortal(
        <section className="mobile-career-detail" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <header className="mobile-career-detail__header">
            <div>
              <span>MY APPLICATIONS</span>
              <h2 id={titleId}>지원 현황 <small>{counts.total}</small></h2>
            </div>
            <div className="mobile-career-detail__header-actions">
              <button type="button" onClick={createItem} aria-label="새 기업 추가">
                <Plus size={19} aria-hidden="true" />
              </button>
              <button ref={closeRef} type="button" onClick={() => setExpanded(false)} aria-label="Career 전체 보기 닫기">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="mobile-career-detail__scroll">
            {/* 검색 input: 작은 iPhone에서도 폰트 16px 유지. */}
            <label className="mobile-career-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="회사 또는 직무 검색"
                aria-label="지원 회사 검색"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기">
                  <X size={17} aria-hidden="true" />
                </button>
              )}
            </label>

            {/* 현재 status 필터는 자바스크립트 UI 선택값일 뿐 원본에 저장하지 않습니다. */}
            <div className="mobile-career-status-rail" aria-label="전형 상태 필터">
              <button type="button" onClick={() => setFilter("All")} aria-pressed={filter === "All"} className={filter === "All" ? "is-active" : ""}>
                전체
              </button>
              {STATUSES.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={filter === id}
                  onClick={() => setFilter(id)}
                  className={filter === id ? "is-active" : ""}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mobile-career-detail__subhead">
              <strong>{visible.length}개 기업</strong>
              <label className="mobile-career-upcoming-toggle">
                <input type="checkbox" checked={onlyUpcoming} onChange={(e) => setOnlyUpcoming(e.target.checked)} />
                일정 있는 기업만
              </label>
            </div>

            {visible.length === 0 ? (
              <div className="mobile-career-detail__empty">
                {counts.total === 0 ? "등록된 기업이 없어. + 버튼으로 추가해 봐." : "조건에 맞는 기업이 없어."}
              </div>
            ) : (
              <div className="mobile-career-detail__list">
                {visible.map((item) => (
                  <CareerRow
                    key={item.id}
                    item={item}
                    schedule={findNextSchedule(item, today)}
                    onOpen={openItem}
                  />
                ))}
              </div>
            )}
          </div>
        </section>,
        document.body,
      )}
    </>
  );
};
