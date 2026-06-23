import type {
  DashboardTab,
  GridLayoutItem,
  Layouts,
  WidgetId,
} from "../types/workspace";
import { defaultLayouts } from "../components/grid/gridDefaults";

const cloneLayoutItem = (item: GridLayoutItem): GridLayoutItem => ({
  ...item,
});

const pickLayouts = (widgetIds: WidgetId[]): Layouts => {
  const pickedLayouts = Object.entries(defaultLayouts).map(
    ([breakpoint, layouts]) => {
      const pickedItems = layouts
        .filter((item: GridLayoutItem) => widgetIds.includes(item.i))
        .map(cloneLayoutItem);

      return [breakpoint, pickedItems];
    }
  );

  return Object.fromEntries(pickedLayouts) as Layouts;
};

const homeWidgetIds: WidgetId[] = [
  "today",
  "alerts",
  "journal",
  "calendar",
  "memo",
  "career",
  "study",
  "health",
  "money",
  "mood",
];

const careerWidgetIds: WidgetId[] = [
  "today",
  "alerts",
  "career",
  "journal",
  "calendar",
  "memo",
];

const studyWidgetIds: WidgetId[] = [
  "today",
  "alerts",
  "study",
  "journal",
  "calendar",
  "memo",
];

const memoWidgetIds: WidgetId[] = [
  "memo",
  "journal",
  "alerts",
  "calendar",
];

const lifeWidgetIds: WidgetId[] = [
  "alerts",
  "journal",
  "health",
  "mood",
  "money",
  "calendar",
  "memo",
];

export const defaultDashboardTabs: DashboardTab[] = [
  {
    id: "home",
    label: "Home",
    icon: "🏠",
    widgetIds: homeWidgetIds,
    layouts: pickLayouts(homeWidgetIds),
    locked: true,
  },
  {
    id: "career",
    label: "Career",
    icon: "💼",
    widgetIds: careerWidgetIds,
    layouts: pickLayouts(careerWidgetIds),
    locked: true,
  },
  {
    id: "study",
    label: "Study",
    icon: "📚",
    widgetIds: studyWidgetIds,
    layouts: pickLayouts(studyWidgetIds),
    locked: true,
  },
  {
    id: "memo",
    label: "Memo",
    icon: "📝",
    widgetIds: memoWidgetIds,
    layouts: pickLayouts(memoWidgetIds),
    locked: true,
  },
  {
    id: "life",
    label: "Life",
    icon: "🌿",
    widgetIds: lifeWidgetIds,
    layouts: pickLayouts(lifeWidgetIds),
    locked: true,
  },
];