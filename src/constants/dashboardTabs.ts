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
    widgetIds: ["career", "calendar", "memo", "today"],
    layouts: pickLayouts(["career", "calendar", "memo", "today"]),
    locked: true,
  },
  {
    id: "study",
    label: "Study",
    icon: "📚",
    widgetIds: ["study", "calendar", "memo", "today"],
    layouts: pickLayouts(["study", "calendar", "memo", "today"]),
    locked: true,
  },
  {
    id: "memo",
    label: "Memo",
    icon: "📝",
    widgetIds: ["memo", "calendar"],
    layouts: pickLayouts(["memo", "calendar"]),
    locked: true,
  },
  {
    id: "life",
    label: "Life",
    icon: "🌿",
    widgetIds: ["health", "mood", "money", "calendar", "memo"],
    layouts: pickLayouts(["health", "mood", "money", "calendar", "memo"]),
    locked: true,
  },
];