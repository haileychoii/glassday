import type { DashboardTab } from "../types/workspace";
import { defaultLayouts } from "../components/grid/gridDefaults";

const pickLayouts = (widgetIds: string[]) => {
  return Object.fromEntries(
    Object.entries(defaultLayouts).map(([breakpoint, layouts]) => [
      breakpoint,
      layouts.filter((item) => widgetIds.includes(item.i)),
    ])
  );
};

export const defaultDashboardTabs: DashboardTab[] = [
  {
    id: "home",
    label: "Home",
    icon: "🏠",
    widgetIds: [
      "today",
      "alerts",
      "calendar",
      "memo",
      "career",
      "study",
      "health",
      "money",
      "mood",
    ],
    layouts: defaultLayouts,
    locked: true,
  },
  {
    id: "career",
    label: "Career",
    icon: "💼",
    widgetIds: ["today", "alerts", "career", "calendar", "memo"],
    layouts: pickLayouts(["today", "alerts", "career", "calendar", "memo"]),
    locked: true,
  },
  {
    id: "study",
    label: "Study",
    icon: "📚",
    widgetIds: ["today", "alerts", "study", "calendar", "memo"],
    layouts: pickLayouts(["today", "alerts", "study", "calendar", "memo"]),
    locked: true,
  },
  {
    id: "memo",
    label: "Memo",
    icon: "📝",
    widgetIds: ["memo", "alerts", "calendar"],
    layouts: pickLayouts(["memo", "alerts", "calendar"]),
    locked: true,
  },
  {
    id: "life",
    label: "Life",
    icon: "🌿",
    widgetIds: ["alerts", "health", "mood", "money", "calendar", "memo"],
    layouts: pickLayouts(["alerts", "health", "mood", "money", "calendar", "memo"]),
    locked: true,
  },
];