/**
 * ============================================================
 * [Figma Mapping] Dashboard / Default Workspace Tabs
 * ============================================================
 *
 * 역할:
 * - Home, Career, Study, Memo, Life Workspace의 기본 Widget 구성을 정의한다.
 * - 각 Tab은 같은 widgetId라도 Wide/Laptop layout 복사본을 따로 가진다.
 *
 * 연결 관계:
 * - State/Persistence: `src/hooks/useDashboardTabs.ts`
 * - Navigation: `src/components/layout/WorkspaceTabsNav.tsx`
 * - Renderer: `src/components/grid/DashboardGrid.tsx`
 * - Coordinate source: `src/components/grid/gridDefaults.ts`
 *
 * Figma 구조:
 * - 각 기본 Tab은 Figma Page 또는 Section으로 대응할 수 있다.
 * - Widget Component 자체는 공유하고 Tab별로 instance 배치만 다르게 둔다.
 * ============================================================
 */
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

/* 각 Workspace가 필요한 widgetId만 기본 Grid에서 골라 독립 layout 사본을 만든다. */
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

/** 초기화 또는 최초 실행 시 생성되는 잠금 Workspace 목록. */
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
