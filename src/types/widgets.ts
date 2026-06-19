import type { WidgetId, WidgetMeta } from "../types/workspace";

export const widgetRegistry: Record<WidgetId, WidgetMeta> = {
  today: {
    id: "today",
    label: "Today Focus",
    description: "오늘 가장 중요한 일",
    category: "home",
  },
  alerts: {
    id: "alerts",
    label: "Alert Center",
    description: "마감, 일정, 기록 누락 알림",
    category: "home",
  },
  calendar: {
    id: "calendar",
    label: "Calendar",
    description: "일정과 지원 기간",
    category: "home",
  },
  memo: {
    id: "memo",
    label: "Memo",
    description: "메모 라이브러리",
    category: "memo",
  },
  study: {
    id: "study",
    label: "Study",
    description: "공부 진행률",
    category: "study",
  },
  career: {
    id: "career",
    label: "Career",
    description: "지원 관리",
    category: "career",
  },
  health: {
    id: "health",
    label: "Health",
    description: "몸무게와 컨디션",
    category: "life",
  },
  money: {
    id: "money",
    label: "Wealth",
    description: "수입과 목표",
    category: "money",
  },
  mood: {
    id: "mood",
    label: "Mood",
    description: "에너지/스트레스",
    category: "life",
  },
};

export const allWidgetIds = Object.keys(widgetRegistry) as WidgetId[];