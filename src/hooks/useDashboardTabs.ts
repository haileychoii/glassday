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
import { useEffect, useMemo, useRef } from "react";

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

/**
 * 마지막 탭 동작 한 건을 복구하는 데 필요한 정보다.
 * 삭제는 탭 전체 설정과 원래 순서를 보관하고, 추가는 새 id와 이전 선택을 보관한다.
 */
type TabActionUndo =
  | {
      type: "added";
      tabId: string;
      previousActiveTabId: string;
    }
  | {
      type: "icon-changed";
      tabId: string;
      previousIcon: string;
      nextIcon: string;
    }
  | {
      type: "removed";
      tab: DashboardTab;
      index: number;
      previousActiveTabId: string;
    };

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

/** Retired Health widgets keep their saved position as Habit Tracker. */
const migrateWidgetId = (id: WidgetId): WidgetId =>
  id === "health" ? "habitTracker" : id;

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

  const normalized = value
    .filter((item: unknown): item is GridLayoutItem => isLayoutItem(item))
    .map((item) =>
      normalizeLayoutItem({ ...item, i: migrateWidgetId(item.i) })
    );

  return [...new Map(normalized.map((item) => [item.i, item])).values()];
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

/* Persist only usable mobile heights so stale or edited storage cannot
 * collapse a card or stretch it past the range supported by the handle. */
const normalizeMobileWidgetHeights = (
  heights: DashboardTab["mobileWidgetHeights"]
): DashboardTab["mobileWidgetHeights"] => {
  if (!heights || typeof heights !== "object") return undefined;

  return Object.fromEntries(
    Object.entries(heights)
      .filter((entry): entry is [string, number] =>
        typeof entry[1] === "number" && Number.isFinite(entry[1])
      )
      .map(([widgetId, height]) => [
        widgetId,
        Math.round(Math.max(160, Math.min(1200, height))),
      ])
  );
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
    widgetIds: Array.isArray(tab.widgetIds)
      ? [...new Set(tab.widgetIds.map(migrateWidgetId))]
      : [],
    layouts: normalizeModeLayouts(tab.layouts),
    mobileWidgetHeights: normalizeMobileWidgetHeights(tab.mobileWidgetHeights),
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

  /* Built-in Memo was renamed to Diary without changing its stable storage id. */
  const builtInLabel =
    defaultTab.id === "memo" && normalizedTab.label === "Memo"
      ? defaultTab.label
      : normalizedTab.label;

  const mergedWidgetIds = [
    ...normalizedTab.widgetIds,
    ...defaultTab.widgetIds.filter(
      (widgetId) => !normalizedTab.widgetIds.includes(widgetId)
    ),
  ];

  return {
    ...normalizedTab,
    label: builtInLabel,
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

const createNewTab = (icon = "✨"): DashboardTab => {
  return {
    id: createId(),
    label: "New Tab",
    icon,
    // A new workspace starts as a blank canvas. The user chooses its widgets
    // after it is created instead of inheriting an unexpected default pair.
    widgetIds: [],
    layouts: {
      wide: emptyLayouts(),
      laptop: emptyLayouts(),
    },
    locked: false,
  };
};

/**
 * Dashboard tab과 Grid layout의 현재 Source of Truth를 반환한다.
 * add/remove Widget은 목록과 두 mode의 layout을 함께 정리한다.
 */
export const useDashboardTabs = () => {
  /* 실수로 추가하거나 삭제한 탭을 바로 되돌릴 수 있도록 마지막 동작을 보관한다. */
  const lastTabAction = useRef<TabActionUndo | null>(null);
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

  const addTab = (icon = "✨") => {
    const newTab = createNewTab(icon);

    lastTabAction.current = {
      type: "added",
      tabId: newTab.id,
      previousActiveTabId: activeTabId,
    };

    setTabs((prev) => [...normalizeTabs(prev), newTab]);
    setActiveTabId(newTab.id);
  };

  /** Save mobile-only card height without changing the desktop grid layouts. */
  const setActiveTabMobileWidgetHeight = (
    widgetId: WidgetId,
    height: number | null
  ) => {
    if (!activeTab) return;

    const nextHeights = { ...(activeTab.mobileWidgetHeights ?? {}) };
    if (height === null) {
      delete nextHeights[widgetId];
    } else {
      nextHeights[widgetId] = Math.round(Math.max(160, Math.min(1200, height)));
    }

    updateTab(activeTab.id, { mobileWidgetHeights: nextHeights });
  };

  const renameTab = (tabId: string, label: string) => {
    updateTab(tabId, {
      label,
    });
  };

  /** Save a tab icon and retain its previous value for the undo notice. */
  const updateTabIcon = (tabId: string, icon: string) => {
    const target = tabs.find((tab) => tab.id === tabId);
    if (!target || target.icon === icon) return false;

    lastTabAction.current = {
      type: "icon-changed",
      tabId,
      previousIcon: target.icon,
      nextIcon: icon,
    };
    updateTab(tabId, { icon });
    return true;
  };

  const removeTab = (tabId: string) => {
    const normalizedTabs = normalizeTabs(tabs);
    const target = normalizedTabs.find((tab) => tab.id === tabId);

    if (!target || target.locked) return;

    lastTabAction.current = {
      type: "removed",
      tab: target,
      index: normalizedTabs.findIndex((tab) => tab.id === tabId),
      previousActiveTabId: activeTabId,
    };

    const nextTabs = normalizedTabs.filter((tab) => tab.id !== tabId);

    setTabs(nextTabs.length > 0 ? nextTabs : [fallbackTab]);

    if (activeTabId === tabId) {
      setActiveTabId(nextTabs[0]?.id ?? "home");
    }
  };

  /** Restore the most recent tab add/delete without touching other tab data. */
  const undoLastTabAction = () => {
    const action = lastTabAction.current;
    if (!action) return false;

    lastTabAction.current = null;

    if (action.type === "added") {
      setTabs((prev) => {
        const currentTabs = normalizeTabs(prev);
        if (!currentTabs.some((tab) => tab.id === action.tabId)) return prev;

        const nextTabs = currentTabs.filter((tab) => tab.id !== action.tabId);
        return nextTabs.length > 0 ? nextTabs : [fallbackTab];
      });

      setActiveTabId(action.previousActiveTabId);
      return true;
    }

    if (action.type === "icon-changed") {
      setTabs((prev) =>
        normalizeTabs(prev).map((tab) =>
          tab.id === action.tabId
            ? normalizeTab({ ...tab, icon: action.previousIcon })
            : tab
        )
      );
      return true;
    }

    setTabs((prev) => {
      const currentTabs = normalizeTabs(prev);
      if (currentTabs.some((tab) => tab.id === action.tab.id)) return currentTabs;

      const nextTabs = [...currentTabs];
      nextTabs.splice(Math.min(action.index, nextTabs.length), 0, action.tab);
      return nextTabs;
    });
    setActiveTabId(action.previousActiveTabId);
    return true;
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
    setActiveTabMobileWidgetHeight,
    renameTab,
    updateTabIcon,
    removeTab,
    undoLastTabAction,
  };
};
