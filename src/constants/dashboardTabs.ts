import type {
  DashboardModeLayouts,
  DashboardLayoutMode,
  DashboardTab,
  GridLayoutItem,
  Layouts,
  WidgetId,
} from "../types/workspace";
import { defaultLayoutsByMode } from "../components/grid/gridDefaults";

const cloneLayoutItem = (item: GridLayoutItem): GridLayoutItem => ({
  ...item,
});

const pickLayouts = (
  layoutMode: DashboardLayoutMode,
  widgetIds: WidgetId[]
): Layouts => {
  const pickedLayouts = Object.entries(defaultLayoutsByMode[layoutMode]).map(
    ([breakpoint, layouts]) => {
      const pickedItems = layouts
        .filter((item: GridLayoutItem) => widgetIds.includes(item.i))
        .map(cloneLayoutItem);

      return [breakpoint, pickedItems];
    }
  );

  return Object.fromEntries(pickedLayouts) as Layouts;
};

const cloneLayouts = (layouts: Layouts): Layouts => {
  return Object.fromEntries(
    Object.entries(layouts).map(([breakpoint, items]) => [
      breakpoint,
      items.map(cloneLayoutItem),
    ])
  ) as Layouts;
};

const buildModeLayouts = (widgetIds: WidgetId[]): DashboardModeLayouts => {
  const wideLayouts = pickLayouts("wide", widgetIds);
  const laptopLayouts = pickLayouts("laptop", widgetIds);

  return {
    wide: wideLayouts,
    laptop: cloneLayouts(laptopLayouts),
  };
};

const homeWidgetIds: WidgetId[] = [
  "today",
  "alerts",
  "journal",
  "calendar",
  "memo",
  "career",
  "study",
  "timer",
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
  "timer",
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
    layouts: buildModeLayouts(homeWidgetIds),
    locked: true,
  },
  {
    id: "career",
    label: "Career",
    icon: "💼",
    widgetIds: careerWidgetIds,
    layouts: buildModeLayouts(careerWidgetIds),
    locked: true,
  },
  {
    id: "study",
    label: "Study",
    icon: "📚",
    widgetIds: studyWidgetIds,
    layouts: buildModeLayouts(studyWidgetIds),
    locked: true,
  },
  {
    id: "memo",
    label: "Memo",
    icon: "📝",
    widgetIds: memoWidgetIds,
    layouts: buildModeLayouts(memoWidgetIds),
    locked: true,
  },
  {
    id: "life",
    label: "Life",
    icon: "🌿",
    widgetIds: lifeWidgetIds,
    layouts: buildModeLayouts(lifeWidgetIds),
    locked: true,
  },
];
