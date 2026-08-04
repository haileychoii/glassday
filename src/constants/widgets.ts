/**
 * ============================================================
 * [Figma Mapping] Widget Registry Metadata
 * ============================================================
 *
 * 역할:
 * - widgetId별 사용자 표시 이름, 설명, 분류, 추천 크기를 정의한다.
 * - DashboardGrid의 Widget Picker가 이 metadata를 읽는다.
 *
 * 실제 Component 연결:
 * - `src/components/grid/DashboardGrid.tsx#widgetMap`
 *
 * Layout 연결:
 * - `src/components/grid/gridDefaults.ts`의 각 `i`
 * - `src/constants/dashboardTabs.ts`의 각 `widgetIds`
 *
 * 수정 주의:
 * - id 변경은 localStorage에 저장된 Tab/Grid layout과의 연결을 끊는다.
 * - 새 위젯은 Registry만 추가해서 렌더링되지 않으며 Component map과 layout도 필요하다.
 * ============================================================
 */
import type { WidgetId, WidgetMeta } from "../types/workspace";

/** Figma Asset Panel의 Widget Component 목록과 대응하는 표시 metadata. */
export const widgetRegistry: Record<WidgetId, WidgetMeta> = {
  today: {
    id: "today",
    label: "Today Focus",
    description: "오늘 가장 중요한 일",
    category: "home",
    defaultSize: "small",
  },
  alerts: {
    id: "alerts",
    label: "Alert Center",
    description: "마감, 일정, 기록 누락 알림",
    category: "home",
    defaultSize: "small",
  },
  calendar: {
    id: "calendar",
    label: "Calendar",
    description: "일정과 지원 기간",
    category: "home",
    defaultSize: "wide",
  },
  career: {
    id: "career",
    label: "Career",
    description: "지원 관리",
    category: "career",
    defaultSize: "large",
  },
  study: {
    id: "study",
    label: "Study Planner",
    description: "공부 기록과 목표 관리",
    category: "study",
    defaultSize: "large",
  },
  timer: {
    id: "timer",
    label: "Timer",
    description: "뽀모도로와 플로팅 타이머",
    category: "study",
    defaultSize: "small",
  },
  memo: {
    id: "memo",
    label: "Memo",
    description: "메모 라이브러리",
    category: "memo",
    defaultSize: "wide",
  },
  journal: {
    id: "journal",
    label: "Daily Journal",
    description: "오늘 할 일, 회사 기록, 회고",
    category: "life",
    defaultSize: "large",
  },
  health: {
    id: "health",
    label: "Health",
    description: "몸무게와 컨디션",
    category: "life",
    defaultSize: "small",
  },
  money: {
    id: "money",
    label: "Money",
    description: "수입과 목표",
    category: "money",
    defaultSize: "small",
  },
  mood: {
    id: "mood",
    label: "Mood",
    description: "에너지/스트레스",
    category: "life",
    defaultSize: "small",
  },
};

export const allWidgetIds = Object.keys(widgetRegistry) as WidgetId[];
