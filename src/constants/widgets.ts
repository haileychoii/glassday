import type { WidgetId, WidgetMeta } from "../types/workspace";

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
