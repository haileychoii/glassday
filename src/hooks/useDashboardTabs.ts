import { useMemo } from "react";
import type { Layout } from "react-grid-layout";

type Layouts = Record<string, Layout[]>;

import { useLocalStorage } from "./useLocalStorage";
import { defaultDashboardTabs } from "../constants/dashboardTabs";
import type { DashboardTab, WidgetId } from "../types/workspace";

const TABS_KEY = "glassday.dashboard.tabs.v1";
const ACTIVE_TAB_KEY = "glassday.dashboard.activeTab.v1";

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useDashboardTabs = () => {
  const { value: tabs, setValue: setTabs } = useLocalStorage<DashboardTab[]>(
    TABS_KEY,
    defaultDashboardTabs
  );

  const { value: activeTabId, setValue: setActiveTabId } =
    useLocalStorage<string>(ACTIVE_TAB_KEY, "home");

  const activeTab = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  }, [tabs, activeTabId]);

  const updateTab = (tabId: string, patch: Partial<DashboardTab>) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              ...patch,
            }
          : tab
      )
    );
  };

  const updateActiveTabLayouts = (layouts: Layouts) => {
    if (!activeTab) return;

    updateTab(activeTab.id, {
      layouts,
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

    updateTab(activeTab.id, {
      widgetIds: activeTab.widgetIds.filter((id) => id !== widgetId),
      layouts: Object.fromEntries(
        Object.entries(activeTab.layouts).map(([breakpoint, layouts]) => [
          breakpoint,
          layouts.filter((layout) => layout.i !== widgetId),
        ])
      ) as Layouts,
    });
  };

  const addTab = () => {
    const newTab: DashboardTab = {
      id: createId(),
      label: "New Tab",
      icon: "✨",
      widgetIds: ["memo", "calendar"],
      layouts: {
        lg: [
          { i: "memo", x: 0, y: 0, w: 5, h: 4 },
          { i: "calendar", x: 5, y: 0, w: 7, h: 5 },
        ],
        md: [
          { i: "memo", x: 0, y: 0, w: 6, h: 4 },
          { i: "calendar", x: 6, y: 0, w: 6, h: 5 },
        ],
        sm: [
          { i: "memo", x: 0, y: 0, w: 4, h: 4 },
          { i: "calendar", x: 0, y: 4, w: 4, h: 5 },
        ],
      },
      locked: false,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const renameTab = (tabId: string, label: string) => {
    updateTab(tabId, {
      label,
    });
  };

  const removeTab = (tabId: string) => {
    const target = tabs.find((tab) => tab.id === tabId);

    if (!target || target.locked) return;

    const nextTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(nextTabs);

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