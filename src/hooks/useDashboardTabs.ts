/**
 * ============================================================
 * [Dashboard State] Tabs + Mode-specific Grid Layouts
 * ============================================================
 *
 * 화면 역할:
 * - Sidebar/WorkspaceTabsNav가 표시하는 Dashboard tab 목록과 active tab을 제공한다.
 * - DashboardGrid가 사용하는 widgetIds와 breakpoint layout을 저장/갱신한다.
 *
 * 연결:
 * - Consumers: src/components/grid/DashboardGrid.tsx,
 *   src/components/layout/Sidebar.tsx, src/components/layout/WorkspaceTabsNav.tsx
 * - Defaults: src/constants/dashboardTabs.ts,
 *   src/components/grid/gridDefaults.ts
 * - Types: src/types/workspace.ts
 * - Persistence: glassday.dashboard.tabs.v1,
 *   glassday.dashboard.activeTab.v1
 *
 * 구조 원칙:
 * - Wide와 Laptop은 같은 Widget data를 보지만 layout은 mode별로 따로 저장한다.
 * - default layout에 새 Widget이 추가되면 기존 사용자 tab에도 누락 항목만 병합한다.
 * - WidgetId, Grid item의 i, Widget renderer key는 반드시 일치해야 한다.
 *
 * Figma Mapping:
 * - DashboardTab = Workspace Navigation Item
 * - DashboardModeLayouts = Wide/Laptop responsive Frame arrangement
 * - locked = 기본 tab의 Delete Disabled Variant
 * ============================================================
 */
import { useEffect, useMemo } from "react";

import { useLocalStorage } from "./useLocalStorage";
import {
  DASHBOARD_STORAGE_SCHEMA_KEY,
  DASHBOARD_STORAGE_SCHEMA_VERSION,
} from "../constants/dashboardStorage";
import { defaultDashboardTabs } from "../constants/dashboardTabs";
import type {
  DashboardLayoutMode,
  DashboardModeLayouts,
  DashboardTab,
  GridLayoutItem,
  Layouts,
  WidgetId,
} from "../types/workspace";

const TABS_KEY = "glassday.dashboard.tabs.v1";
const ACTIVE_TAB_KEY = "glassday.dashboard.activeTab.v1";

const fallbackTab: DashboardTab = {
  id: "home",
  label: "Home",
  icon: "✨",
  widgetIds: ["today", "calendar", "memo", "study"],
  layouts: {
    wide: {
      lg: [
        { i: "today", x: 0, y: 0, w: 4, h: 4 },
        { i: "calendar", x: 4, y: 0, w: 6, h: 5 },
        { i: "memo", x: 10, y: 0, w: 6, h: 5 },
        { i: "study", x: 0, y: 4, w: 6, h: 5 },
      ],
      md: [
        { i: "today", x: 0, y: 0, w: 8, h: 4 },
        { i: "calendar", x: 8, y: 0, w: 8, h: 5 },
        { i: "memo", x: 0, y: 4, w: 8, h: 5 },
        { i: "study", x: 8, y: 5, w: 8, h: 5 },
      ],
      sm: [
        { i: "today", x: 0, y: 0, w: 16, h: 4 },
        { i: "calendar", x: 0, y: 4, w: 16, h: 5 },
        { i: "memo", x: 0, y: 9, w: 16, h: 5 },
        { i: "study", x: 0, y: 14, w: 16, h: 5 },
      ],
    },
    laptop: {
      lg: [
        { i: "today", x: 0, y: 0, w: 4, h: 4 },
        { i: "calendar", x: 4, y: 0, w: 6, h: 5 },
        { i: "memo", x: 10, y: 0, w: 6, h: 5 },
        { i: "study", x: 0, y: 4, w: 6, h: 5 },
      ],
      md: [
        { i: "today", x: 0, y: 0, w: 8, h: 4 },
        { i: "calendar", x: 8, y: 0, w: 8, h: 5 },
        { i: "memo", x: 0, y: 4, w: 8, h: 5 },
        { i: "study", x: 8, y: 5, w: 8, h: 5 },
      ],
      sm: [
        { i: "today", x: 0, y: 0, w: 16, h: 4 },
        { i: "calendar", x: 0, y: 4, w: 16, h: 5 },
        { i: "memo", x: 0, y: 9, w: 16, h: 5 },
        { i: "study", x: 0, y: 14, w: 16, h: 5 },
      ],
    },
  },
  locked: true,
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isLayoutItem = (value: unknown): value is GridLayoutItem => {
  if (!isRecord(value)) return false;

  return (
    typeof value.i === "string" &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.w === "number" &&
    typeof value.h === "number"
  );
};

const normalizeLayoutItem = (item: GridLayoutItem): GridLayoutItem => {
  const safeW = Math.max(1, Math.min(item.w, 16));
  const safeX = Math.max(0, Math.min(item.x, 16 - safeW));

  return {
    ...item,
    i: item.i,
    x: safeX,
    y: Number.isFinite(item.y) ? Math.max(0, item.y) : item.y,
    w: safeW,
    h: Math.max(1, item.h),
  };
};

const normalizeLayoutArray = (value: unknown): GridLayoutItem[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item: unknown): item is GridLayoutItem => isLayoutItem(item))
    .map((item) => normalizeLayoutItem(item));
};

const emptyLayouts = (): Layouts => ({
  lg: [],
  md: [],
  sm: [],
});

const normalizeLayouts = (layouts: unknown): Layouts => {
  if (!isRecord(layouts)) {
    return emptyLayouts();
  }

  return {
    lg: normalizeLayoutArray(layouts.lg),
    md: normalizeLayoutArray(layouts.md),
    sm: normalizeLayoutArray(layouts.sm),
  };
};

const cloneLayouts = (layouts: Layouts): Layouts => ({
  lg: layouts.lg.map((item) => ({ ...item })),
  md: layouts.md.map((item) => ({ ...item })),
  sm: layouts.sm.map((item) => ({ ...item })),
});

const mergeLayoutsWithDefaults = (
  savedLayouts: DashboardModeLayouts,
  defaultLayouts: DashboardModeLayouts
): DashboardModeLayouts => {
  const mergeMode = (mode: DashboardLayoutMode): Layouts => {
    const savedModeLayouts = savedLayouts[mode];
    const defaultModeLayouts = defaultLayouts[mode];

    return {
      lg: mergeLayoutArray(savedModeLayouts.lg, defaultModeLayouts.lg),
      md: mergeLayoutArray(savedModeLayouts.md, defaultModeLayouts.md),
      sm: mergeLayoutArray(savedModeLayouts.sm, defaultModeLayouts.sm),
    };
  };

  return {
    wide: mergeMode("wide"),
    laptop: mergeMode("laptop"),
  };
};

const mergeLayoutArray = (
  savedItems: GridLayoutItem[],
  defaultItems: GridLayoutItem[]
): GridLayoutItem[] => {
  const savedIds = new Set(savedItems.map((item) => item.i));
  const missingDefaultItems = defaultItems
    .filter((item) => !savedIds.has(item.i))
    .map((item) => ({ ...item }));

  return [...savedItems, ...missingDefaultItems];
};

const normalizeModeLayouts = (value: unknown): DashboardModeLayouts => {
  /* Backward compatibility:
     예전 tab은 layout 한 벌만 저장했으므로 Wide/Laptop 양쪽에 복제한다.
     이후 수정은 mode별로 분리되어 한 mode의 drag/resize가 다른 mode를 덮지 않는다. */
  if (!isRecord(value)) {
    return {
      wide: emptyLayouts(),
      laptop: emptyLayouts(),
    };
  }

  const hasModeShape = "wide" in value || "laptop" in value;

  if (hasModeShape) {
    const wideLayouts = normalizeLayouts(value.wide);
    const laptopLayouts = normalizeLayouts(value.laptop);

    return {
      wide: wideLayouts,
      laptop:
        laptopLayouts.lg.length > 0 ||
        laptopLayouts.md.length > 0 ||
        laptopLayouts.sm.length > 0
          ? laptopLayouts
          : cloneLayouts(wideLayouts),
    };
  }

  const sharedLayouts = normalizeLayouts(value);

  return {
    wide: sharedLayouts,
    laptop: cloneLayouts(sharedLayouts),
  };
};

const normalizeTab = (
  tab: DashboardTab,
  options: { mergeCurrentDefaults?: boolean } = {}
): DashboardTab => {
  const normalizedTab = {
    ...tab,
    id: String(tab.id),
    label: tab.label || "Untitled",
    icon: tab.icon || "✨",
    widgetIds: Array.isArray(tab.widgetIds) ? tab.widgetIds : [],
    layouts: normalizeModeLayouts(tab.layouts),
    locked: Boolean(tab.locked),
  };

  if (!options.mergeCurrentDefaults) {
    return normalizedTab;
  }

  const defaultTab = defaultDashboardTabs.find(
    (candidate) => candidate.id === normalizedTab.id
  );

  if (!defaultTab) {
    return normalizedTab;
  }

  const mergedWidgetIds = [
    ...normalizedTab.widgetIds,
    ...defaultTab.widgetIds.filter(
      (widgetId) => !normalizedTab.widgetIds.includes(widgetId)
    ),
  ];

  return {
    ...normalizedTab,
    icon: normalizedTab.icon || defaultTab.icon,
    widgetIds: mergedWidgetIds,
    layouts: mergeLayoutsWithDefaults(
      normalizedTab.layouts,
      defaultTab.layouts
    ),
  };
};

const normalizeTabs = (
  tabs: DashboardTab[],
  options: { mergeCurrentDefaults?: boolean } = {}
): DashboardTab[] => {
  if (!Array.isArray(tabs) || tabs.length === 0) {
    return [fallbackTab];
  }

  return tabs.map((tab) => normalizeTab(tab, options));
};

const createNewTab = (): DashboardTab => {
  return {
    id: createId(),
    label: "New Tab",
    icon: "✨",
    widgetIds: ["memo", "calendar"],
    layouts: {
      wide: {
        lg: [
          { i: "memo", x: 0, y: 0, w: 5, h: 4 },
          { i: "calendar", x: 5, y: 0, w: 7, h: 5 },
        ],
        md: [
          { i: "memo", x: 0, y: 0, w: 8, h: 4 },
          { i: "calendar", x: 8, y: 0, w: 8, h: 5 },
        ],
        sm: [
          { i: "memo", x: 0, y: 0, w: 16, h: 4 },
          { i: "calendar", x: 0, y: 4, w: 16, h: 5 },
        ],
      },
      laptop: {
        lg: [
          { i: "memo", x: 0, y: 0, w: 5, h: 4 },
          { i: "calendar", x: 5, y: 0, w: 7, h: 5 },
        ],
        md: [
          { i: "memo", x: 0, y: 0, w: 8, h: 4 },
          { i: "calendar", x: 8, y: 0, w: 8, h: 5 },
        ],
        sm: [
          { i: "memo", x: 0, y: 0, w: 16, h: 4 },
          { i: "calendar", x: 0, y: 4, w: 16, h: 5 },
        ],
      },
    },
    locked: false,
  };
};

/**
 * Dashboard tab과 Grid layout의 현재 Source of Truth를 반환한다.
 * add/remove Widget은 목록과 두 mode의 layout을 함께 정리한다.
 */
export const useDashboardTabs = () => {
  const { value: storedTabs, setValue: setTabs } = useLocalStorage<
    DashboardTab[]
  >(TABS_KEY, defaultDashboardTabs);

  const { value: activeTabId, setValue: setActiveTabId } =
    useLocalStorage<string>(ACTIVE_TAB_KEY, "home");

  const shouldUpgradeDashboardStorage =
    typeof window !== "undefined" &&
    window.localStorage.getItem(DASHBOARD_STORAGE_SCHEMA_KEY) !==
      String(DASHBOARD_STORAGE_SCHEMA_VERSION);

  const tabs = useMemo(() => {
    return normalizeTabs(storedTabs, {
      mergeCurrentDefaults: shouldUpgradeDashboardStorage,
    });
  }, [shouldUpgradeDashboardStorage, storedTabs]);

  useEffect(() => {
    if (typeof window === "undefined" || !shouldUpgradeDashboardStorage) {
      return;
    }

    /* 저장 schema가 바뀐 경우 현재 default Widget만 보충하고 사용자의 위치는 유지한다. */
    setTabs(tabs);
    window.localStorage.setItem(
      DASHBOARD_STORAGE_SCHEMA_KEY,
      String(DASHBOARD_STORAGE_SCHEMA_VERSION)
    );
  }, [setTabs, shouldUpgradeDashboardStorage, tabs]);

  const activeTab = useMemo(() => {
    return (
      tabs.find((tab) => tab.id === activeTabId) ??
      tabs[0] ??
      fallbackTab
    );
  }, [tabs, activeTabId]);

  const updateTab = (tabId: string, patch: Partial<DashboardTab>) => {
    setTabs((prev) =>
      normalizeTabs(prev).map((tab) =>
        tab.id === tabId
          ? normalizeTab({
              ...tab,
              ...patch,
              layouts:
                patch.layouts !== undefined
                  ? normalizeModeLayouts(patch.layouts)
                  : tab.layouts,
            })
          : tab
      )
    );
  };

  const updateActiveTabLayouts = (
    mode: DashboardLayoutMode,
    layouts: Layouts
  ) => {
    if (!activeTab) return;

    updateTab(activeTab.id, {
      layouts: {
        ...activeTab.layouts,
        [mode]: normalizeLayouts(layouts),
      },
    });
  };

  const addWidgetToActiveTab = (widgetId: WidgetId) => {
    if (!activeTab) return;
    if (activeTab.widgetIds.includes(widgetId)) return;

    updateTab(activeTab.id, {
      widgetIds: [...activeTab.widgetIds, widgetId],
    });
  };

  const removeWidgetFromActiveTab = (widgetId: WidgetId) => {
    if (!activeTab) return;

    const currentLayouts = activeTab.layouts;

    const nextLayouts: DashboardModeLayouts = {
      wide: Object.fromEntries(
        Object.entries(currentLayouts.wide).map(([breakpoint, layouts]) => [
          breakpoint,
          layouts.filter((item: GridLayoutItem) => item.i !== widgetId),
        ])
      ) as Layouts,
      laptop: Object.fromEntries(
        Object.entries(currentLayouts.laptop).map(([breakpoint, layouts]) => [
          breakpoint,
          layouts.filter((item: GridLayoutItem) => item.i !== widgetId),
        ])
      ) as Layouts,
    };

    updateTab(activeTab.id, {
      widgetIds: activeTab.widgetIds.filter((id) => id !== widgetId),
      layouts: nextLayouts,
    });
  };

  const addTab = () => {
    const newTab = createNewTab();

    setTabs((prev) => [...normalizeTabs(prev), newTab]);
    setActiveTabId(newTab.id);
  };

  const renameTab = (tabId: string, label: string) => {
    updateTab(tabId, {
      label,
    });
  };

  const removeTab = (tabId: string) => {
    const normalizedTabs = normalizeTabs(tabs);
    const target = normalizedTabs.find((tab) => tab.id === tabId);

    if (!target || target.locked) return;

    const nextTabs = normalizedTabs.filter((tab) => tab.id !== tabId);

    setTabs(nextTabs.length > 0 ? nextTabs : [fallbackTab]);

    if (activeTabId === tabId) {
      setActiveTabId(nextTabs[0]?.id ?? "home");
    }
  };

  return {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    updateActiveTabLayouts,
    addWidgetToActiveTab,
    removeWidgetFromActiveTab,
    addTab,
    renameTab,
    removeTab,
  };
};
