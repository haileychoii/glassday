
/**
 * ============================================================
 * GLASSDAY — DASHBOARD STATE
 * 파일: src/hooks/useDashboardTabs.ts
 * ============================================================
 *
 * [역할]
 * - Workspace 목록 및 활성 탭 관리
 * - 위젯 추가 / 삭제
 * - 위젯 위치 및 크기 저장
 * - Wide / Laptop 레이아웃 독립 관리
 * - 기존 사용자 데이터 복원
 *
 * [연결 파일]
 * - App.tsx
 * - DashboardGrid.tsx
 * - WorkspaceTabsNav.tsx
 * - useLocalStorage.ts
 * - constants/dashboardTabs.ts
 * - constants/dashboardStorage.ts
 * - types/workspace.ts
 *
 * [저장 구조]
 * - glassday.dashboard.tabs.v1
 * - glassday.dashboard.activeTab.v1
 *
 * [Figma Mapping]
 * - DashboardTab: Workspace Navigation Item
 * - DashboardModeLayouts: Layout Variant
 * - GridLayoutItem: Widget Instance Frame
 *
 * 모바일 위젯 배치는 useMobileWidgetLayout에서 별도 관리한다.
 * ============================================================
 */

import { useCallback, useEffect, useMemo, useRef } from "react";

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


/* ============================================================
   01. STORAGE / GRID CONSTANTS

   기존 저장 Key와 Grid Column 수를 변경하지 않는다.
   ============================================================ */

const TABS_KEY = "glassday.dashboard.tabs.v1";
const ACTIVE_TAB_KEY = "glassday.dashboard.activeTab.v1";

const GRID_COLUMNS = 16;


/* ============================================================
   02. COMMON UTILITIES
   ============================================================ */

// 새로운 Workspace의 고유 ID
const createId = () => {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return `tab-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
};


// 일반 객체 확인
const isRecord = (
  value: unknown
): value is Record<string, unknown> => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
};


// 안전한 정수 변환
const toSafeInteger = (
  value: unknown,
  fallback: number
): number => {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  )
    ? Math.round(value)
    : fallback;
};


// 값이 허용 범위를 넘지 않도록 제한
const clamp = (
  value: number,
  min: number,
  max: number
): number => Math.max(min, Math.min(value, max));


/* ============================================================
   03. EMPTY / CLONE LAYOUTS

   Wide와 Laptop이 동일한 배열을 공유하지 않도록 한다.
   ============================================================ */

const emptyLayouts = (): Layouts => ({
  lg: [],
  md: [],
  sm: [],
});

const cloneLayouts = (layouts: Layouts): Layouts => ({
  lg: layouts.lg.map((item) => ({ ...item })),
  md: layouts.md.map((item) => ({ ...item })),
  sm: layouts.sm.map((item) => ({ ...item })),
});

const createModeLayouts = (
  layouts: Layouts
): DashboardModeLayouts => ({
  wide: cloneLayouts(layouts),
  laptop: cloneLayouts(layouts),
});


/* ============================================================
   04. FALLBACK HOME TAB

   저장된 Workspace가 없거나 유효하지 않은 경우 사용한다.
   기존 기본 위젯 및 배치 좌표를 유지한다.
   ============================================================ */

const fallbackLayouts: Layouts = {
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
};

const fallbackTab: DashboardTab = {
  id: "home",
  label: "Home",
  icon: "✨",

  widgetIds: [
    "today",
    "calendar",
    "memo",
    "study",
  ],

  layouts: createModeLayouts(fallbackLayouts),

  locked: true,
};


/* ============================================================
   05. STORED GRID ITEM TYPE

   연결: types/workspace.ts

   과거 Infinity 좌표가 JSON 저장 중 null로 변환된
   데이터까지 처리할 수 있도록 별도 타입을 정의한다.

   GridLayoutItem에 index signature가 있으므로
   Omit 대신 필수 속성을 명시적으로 지정한다.
   ============================================================ */

type StoredGridLayoutItem = {
  i: string;
  x: number;
  y: number | null;
  w: number;
  h: number;

  [key: string]: unknown;
};


const isLayoutItem = (
  value: unknown
): value is StoredGridLayoutItem => {
  if (!isRecord(value)) return false;

  return (
    typeof value.i === "string" &&
    typeof value.x === "number" &&
    (
      typeof value.y === "number" ||
      value.y === null
    ) &&
    typeof value.w === "number" &&
    typeof value.h === "number"
  );
};

/** Migrate the retired Health widget ID without discarding saved placement. */
const migrateWidgetId = (id: string): string =>
  id === "health" ? "habitTracker" : id;


/* ============================================================
   06. GRID ITEM NORMALIZATION

   위젯 하나의 위치 및 크기를 검증한다.

   i : Widget ID
   x : 가로 시작 위치
   y : 세로 시작 위치
   w : 가로 크기
   h : 세로 크기

   반드시 x + w <= GRID_COLUMNS를 만족해야 한다.
   ============================================================ */

const normalizeLayoutItem = (
  item: StoredGridLayoutItem,
  fallbackY = 0
): GridLayoutItem => {

  const safeW = clamp(
    toSafeInteger(item.w, 4),
    1,
    GRID_COLUMNS
  );

  const safeH = Math.max(
    1,
    toSafeInteger(item.h, 4)
  );

  // 위젯의 오른쪽 끝이 Grid 경계를 넘지 않도록 한다.
  const safeX = clamp(
    toSafeInteger(item.x, 0),
    0,
    GRID_COLUMNS - safeW
  );

  const safeY = Math.max(
    0,
    toSafeInteger(item.y, fallbackY)
  );

  return {
    ...item,
    i: migrateWidgetId(item.i),

    x: safeX,
    y: safeY,

    w: safeW,
    h: safeH,
  };
};


/* ============================================================
   07. GRID LAYOUT ARRAY NORMALIZATION

   - 잘못된 좌표 보정
   - 중복 위젯 ID 제거
   - 무효한 y 좌표는 기존 위젯 아래로 이동
   ============================================================ */

const normalizeLayoutArray = (
  value: unknown
): GridLayoutItem[] => {
  if (!Array.isArray(value)) return [];

  const seenIds = new Set<string>();

  const uniqueItems = value
    .filter(isLayoutItem)
    .filter((item) => {

      if (seenIds.has(item.i)) {
        return false;
      }

      seenIds.add(item.i);
      return true;
    });

  // 정상 좌표를 가진 위젯 중 가장 아래쪽 위치
  let nextY = uniqueItems.reduce((bottom, item) => {

    if (
      typeof item.y !== "number" ||
      !Number.isFinite(item.y)
    ) {
      return bottom;
    }

    const normalized = normalizeLayoutItem(item);

    return Math.max(
      bottom,
      normalized.y + normalized.h
    );

  }, 0);

  return uniqueItems.map((item) => {

    if (
      typeof item.y === "number" &&
      Number.isFinite(item.y)
    ) {
      return normalizeLayoutItem(item);
    }

    const normalized = normalizeLayoutItem(
      item,
      nextY
    );

    nextY = normalized.y + normalized.h;

    return normalized;
  });
};


/* ============================================================
   08. RESPONSIVE LAYOUT NORMALIZATION

   lg / md / sm별 저장 좌표를 검증한다.
   ============================================================ */

const normalizeLayouts = (
  layouts: unknown
): Layouts => {
  if (!isRecord(layouts)) {
    return emptyLayouts();
  }

  return {
    lg: normalizeLayoutArray(layouts.lg),
    md: normalizeLayoutArray(layouts.md),
    sm: normalizeLayoutArray(layouts.sm),
  };
};


/* ============================================================
   09. WIDE / LAPTOP STORAGE COMPATIBILITY

   이전 버전:
   layouts = { lg, md, sm }

   현재 버전:
   layouts = {
     wide: { lg, md, sm },
     laptop: { lg, md, sm }
   }

   이전 사용자 데이터도 정상적으로 복원한다.
   ============================================================ */

const normalizeModeLayouts = (
  value: unknown
): DashboardModeLayouts => {
  if (!isRecord(value)) {
    return {
      wide: emptyLayouts(),
      laptop: emptyLayouts(),
    };
  }

  const hasModeShape =
    "wide" in value || "laptop" in value;

  if (hasModeShape) {
    const wide = normalizeLayouts(value.wide);
    const laptop = normalizeLayouts(value.laptop);

    // 기존 Laptop 데이터가 없으면 Wide에서 복원한다.
    const hasLaptopLayouts =
      laptop.lg.length > 0 ||
      laptop.md.length > 0 ||
      laptop.sm.length > 0;

    return {
      wide,
      laptop: hasLaptopLayouts
        ? laptop
        : cloneLayouts(wide),
    };
  }

  // 이전 버전의 단일 Layout 구조
  return createModeLayouts(
    normalizeLayouts(value)
  );
};


/* ============================================================
   10. MERGE SAVED LAYOUTS WITH DEFAULTS

   저장 Schema가 업데이트되었을 때 사용한다.

   새로운 기본 위젯만 보충하고,
   기존 사용자 위젯의 위치와 크기는 유지한다.
   ============================================================ */

const mergeLayoutArray = (
  savedItems: GridLayoutItem[],
  defaultItems: GridLayoutItem[]
): GridLayoutItem[] => {

  const savedIds = new Set(
    savedItems.map((item) => item.i)
  );

  const missingItems = defaultItems
    .filter((item) => !savedIds.has(item.i))
    .map((item) => ({ ...item }));

  return normalizeLayoutArray([
    ...savedItems,
    ...missingItems,
  ]);
};


const mergeLayoutsWithDefaults = (
  saved: DashboardModeLayouts,
  defaults: DashboardModeLayouts
): DashboardModeLayouts => {

  const mergeMode = (
    mode: DashboardLayoutMode
  ): Layouts => ({
    lg: mergeLayoutArray(
      saved[mode].lg,
      defaults[mode].lg
    ),

    md: mergeLayoutArray(
      saved[mode].md,
      defaults[mode].md
    ),

    sm: mergeLayoutArray(
      saved[mode].sm,
      defaults[mode].sm
    ),
  });

  return {
    wide: mergeMode("wide"),
    laptop: mergeMode("laptop"),
  };
};


/* ============================================================
   11. WORKSPACE TAB NORMALIZATION

   Memo와 Diary는 현재 로컬 브랜치의 구분을 유지한다.

   Workspace ID는 기존 저장 데이터와 연결되므로
   임의로 변경하지 않는다.
   ============================================================ */

type NormalizeOptions = {
  mergeCurrentDefaults?: boolean;
};


const normalizeTab = (
  tab: DashboardTab,
  options: NormalizeOptions = {}
): DashboardTab => {

  const normalizedTab: DashboardTab = {
    ...tab,

    id: String(tab.id),

    label:
      tab.id === "memo"
        ? "Memo"
        : tab.label || "Untitled",

    icon: tab.icon || "✨",

    widgetIds: Array.isArray(tab.widgetIds)
      ? [...new Set(tab.widgetIds.map(migrateWidgetId))]
      : [],

    layouts: normalizeModeLayouts(tab.layouts),

    locked: Boolean(tab.locked),
  };

  if (!options.mergeCurrentDefaults) {
    return normalizedTab;
  }

  const defaultTab = defaultDashboardTabs.find(
    (candidate) =>
      candidate.id === normalizedTab.id
  );

  if (!defaultTab) {
    return normalizedTab;
  }

  return {
    ...normalizedTab,

    widgetIds: [
      ...new Set([
        ...normalizedTab.widgetIds,
        ...defaultTab.widgetIds,
      ]),
    ],

    layouts: mergeLayoutsWithDefaults(
      normalizedTab.layouts,
      defaultTab.layouts
    ),
  };
};


const normalizeTabs = (
  tabs: DashboardTab[],
  options: NormalizeOptions = {}
): DashboardTab[] => {
  if (!Array.isArray(tabs)) {
    return [normalizeTab(fallbackTab)];
  }

  const validTabs = tabs.filter(
    (tab) =>
      isRecord(tab) &&
      typeof tab.id === "string"
  );

  if (validTabs.length === 0) {
    return [normalizeTab(fallbackTab)];
  }

  return validTabs.map(
    (tab) => normalizeTab(tab, options)
  );
};


/* ============================================================
   12. CREATE NEW WORKSPACE

   기본 구성: Memo + Calendar

   Wide / Laptop은 생성 이후 독립적으로 관리한다.
   ============================================================ */

const createNewTab = (): DashboardTab => {

  const newLayouts: Layouts = {
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
  };

  return {
    id: createId(),

    label: "New Tab",
    icon: "✨",

    widgetIds: ["memo", "calendar"],

    layouts: createModeLayouts(newLayouts),

    locked: false,
  };
};


/* ============================================================
   13. REMOVE WIDGET FROM LAYOUTS

   위젯 삭제 시 모든 Breakpoint의 좌표를 제거한다.

   위젯 내부의 실제 기록 데이터는 삭제하지 않는다.
   ============================================================ */

const removeWidgetFromLayouts = (
  layouts: Layouts,
  widgetId: WidgetId
): Layouts => ({
  lg: layouts.lg.filter(
    (item) => item.i !== widgetId
  ),

  md: layouts.md.filter(
    (item) => item.i !== widgetId
  ),

  sm: layouts.sm.filter(
    (item) => item.i !== widgetId
  ),
});


/* ============================================================
   14. MAIN DASHBOARD HOOK

   App.tsx에서 호출하는 Workspace 상태 관리 Hook.
   ============================================================ */

export const useDashboardTabs = () => {

  /*
   * EN: Sidebar and compact Topbar both expose an add button at different
   * responsive breakpoints. A fast duplicate click, or a click that lands
   * during a breakpoint handoff, must still create only one workspace.
   * KO: 반응형 전환 중 두 버튼이 잠깐 함께 존재할 수 있으므로 짧은
   * 이벤트 중복 방지 창을 둔다. 저장된 탭 자체를 임의로 합치지는 않는다.
   */
  const lastAddTabAtRef = useRef(0);


  /* ----------------------------------------------------------
     A. LOCAL STORAGE STATE
     ---------------------------------------------------------- */

  const {
    value: storedTabs,
    setValue: setTabs,
  } = useLocalStorage<DashboardTab[]>(
    TABS_KEY,
    defaultDashboardTabs
  );

  const {
    value: activeTabId,
    setValue: setActiveTabId,
  } = useLocalStorage<string>(
    ACTIVE_TAB_KEY,
    "home"
  );


  /* ----------------------------------------------------------
     B. STORAGE SCHEMA MIGRATION

     기존 사용자 저장 형식과의 호환성을 유지한다.
     ---------------------------------------------------------- */

  const shouldUpgradeDashboardStorage =
    typeof window !== "undefined" &&
    window.localStorage.getItem(
      DASHBOARD_STORAGE_SCHEMA_KEY
    ) !== String(DASHBOARD_STORAGE_SCHEMA_VERSION);


  const tabs = useMemo(() => {
    return normalizeTabs(storedTabs, {
      mergeCurrentDefaults:
        shouldUpgradeDashboardStorage,
    });
  }, [
    storedTabs,
    shouldUpgradeDashboardStorage,
  ]);


  useEffect(() => {

    if (
      typeof window === "undefined" ||
      !shouldUpgradeDashboardStorage
    ) {
      return;
    }

    // 이전 렌더링이 아닌 최신 저장 상태를 사용한다.
    setTabs((previousTabs) =>
      normalizeTabs(previousTabs, {
        mergeCurrentDefaults: true,
      })
    );

    window.localStorage.setItem(
      DASHBOARD_STORAGE_SCHEMA_KEY,
      String(DASHBOARD_STORAGE_SCHEMA_VERSION)
    );

  }, [
    setTabs,
    shouldUpgradeDashboardStorage,
  ]);


  /* ----------------------------------------------------------
     C. ACTIVE WORKSPACE

     저장된 ID가 유효하지 않으면 첫 번째 탭을 표시한다.
     ---------------------------------------------------------- */

  const activeTab = useMemo(() => {
    return (
      tabs.find((tab) => tab.id === activeTabId) ??
      tabs[0] ??
      fallbackTab
    );
  }, [
    tabs,
    activeTabId,
  ]);

  const resolvedActiveTabId = activeTab.id;


  /* ----------------------------------------------------------
     D. UPDATE TAB

     모든 Workspace 수정의 공통 함수.

     위젯 이동 / Resize / 추가 / 삭제 시
     최신 상태를 기준으로 수정한다.
     ---------------------------------------------------------- */

  const updateTab = useCallback((
    tabId: string,
    updater: (tab: DashboardTab) => DashboardTab
  ) => {

    setTabs((previousTabs) =>
      normalizeTabs(previousTabs).map((tab) =>
        tab.id === tabId
          ? normalizeTab(updater(tab))
          : tab
      )
    );

  }, [setTabs]);


  /* ----------------------------------------------------------
     E. SAVE WIDGET POSITION / SIZE

     ★ 위젯 크기 저장의 핵심 함수 ★

     DashboardGrid.tsx
       → onLayoutsChange
       → updateActiveTabLayouts
       → useLocalStorage.ts

     현재 수정한 Layout Mode만 변경한다.
     ---------------------------------------------------------- */

  const updateActiveTabLayouts = useCallback((
    mode: DashboardLayoutMode,
    layouts: Layouts
  ) => {

    const nextLayouts = normalizeLayouts(layouts);

    updateTab(
      resolvedActiveTabId,
      (currentTab) => ({
        ...currentTab,

        layouts: {
          ...currentTab.layouts,
          [mode]: nextLayouts,
        },
      })
    );

  }, [
    resolvedActiveTabId,
    updateTab,
  ]);


  /* ----------------------------------------------------------
     F. ADD WIDGET

     현재 Workspace에만 새로운 위젯을 추가한다.
     실제 위치와 크기는 DashboardGrid에서 보완한다.
     ---------------------------------------------------------- */

  const addWidgetToActiveTab = useCallback((
    widgetId: WidgetId
  ) => {

    updateTab(
      resolvedActiveTabId,
      (currentTab) => {

        if (
          currentTab.widgetIds.includes(widgetId)
        ) {
          return currentTab;
        }

        return {
          ...currentTab,

          widgetIds: [
            ...currentTab.widgetIds,
            widgetId,
          ],
        };
      }
    );

  }, [
    resolvedActiveTabId,
    updateTab,
  ]);


  /* ----------------------------------------------------------
     G. REMOVE WIDGET

     현재 Workspace의 위젯 목록 및 좌표만 제거한다.
     ---------------------------------------------------------- */

  const removeWidgetFromActiveTab = useCallback((
    widgetId: WidgetId
  ) => {

    updateTab(
      resolvedActiveTabId,
      (currentTab) => ({
        ...currentTab,

        widgetIds: currentTab.widgetIds.filter(
          (id) => id !== widgetId
        ),

        layouts: {
          wide: removeWidgetFromLayouts(
            currentTab.layouts.wide,
            widgetId
          ),

          laptop: removeWidgetFromLayouts(
            currentTab.layouts.laptop,
            widgetId
          ),
        },
      })
    );

  }, [
    resolvedActiveTabId,
    updateTab,
  ]);


  /* ----------------------------------------------------------
     H. ADD WORKSPACE

     새로운 탭을 생성하고 해당 탭으로 이동한다.
     ---------------------------------------------------------- */

  const addTab = useCallback(() => {

    const now = Date.now();

    if (now - lastAddTabAtRef.current < 350) {
      return;
    }

    lastAddTabAtRef.current = now;

    const newTab = createNewTab();

    setTabs((previousTabs) => [
      ...normalizeTabs(previousTabs),
      newTab,
    ]);

    setActiveTabId(newTab.id);

  }, [
    setTabs,
    setActiveTabId,
  ]);


  /*
   * Workspace appearance is kept beside the tab metadata, while widget
   * contents and grid coordinates continue to use their existing storage.
   * This lets Sidebar/WorkspaceTabsNav update only icon/background without
   * rewriting widget layouts or diary data.
   */
  const updateTabAppearance = useCallback((
    tabId: string,
    appearance: Pick<DashboardTab, "icon" | "background" | "iconSource">
  ) => {
    updateTab(tabId, (currentTab) => ({
      ...currentTab,
      ...appearance,
    }));
  }, [updateTab]);


  /* ----------------------------------------------------------
     I. RENAME WORKSPACE
     ---------------------------------------------------------- */

  const renameTab = useCallback((
    tabId: string,
    label: string
  ) => {

    updateTab(
      tabId,
      (currentTab) => ({
        ...currentTab,
        label,
      })
    );

  }, [updateTab]);


  /* ----------------------------------------------------------
     J. REMOVE WORKSPACE

     기본 Workspace는 삭제하지 않는다.
     활성 탭 삭제 시 다른 탭으로 이동한다.
     ---------------------------------------------------------- */

  const removeTab = useCallback((
    tabId: string
  ) => {

    const target = tabs.find(
      (tab) => tab.id === tabId
    );

    if (!target || target.locked) {
      return;
    }

    const remainingTabs = tabs.filter(
      (tab) => tab.id !== tabId
    );

    setTabs((previousTabs) => {

      const currentTabs = normalizeTabs(previousTabs);

      const currentTarget = currentTabs.find(
        (tab) => tab.id === tabId
      );

      if (!currentTarget || currentTarget.locked) {
        return currentTabs;
      }

      const nextTabs = currentTabs.filter(
        (tab) => tab.id !== tabId
      );

      return nextTabs.length > 0
        ? nextTabs
        : [normalizeTab(fallbackTab)];
    });


    if (resolvedActiveTabId === tabId) {
      setActiveTabId(
        remainingTabs[0]?.id ?? "home"
      );
    }

  }, [
    tabs,
    resolvedActiveTabId,
    setTabs,
    setActiveTabId,
  ]);


  /* ==========================================================
     15. PUBLIC HOOK API

     App.tsx와 연결되는 기존 함수 이름을 유지한다.
     ========================================================== */

  return {
    // Workspace State
    tabs,
    activeTab,
    activeTabId: resolvedActiveTabId,
    setActiveTabId,

    // Widget Actions
    updateActiveTabLayouts,
    addWidgetToActiveTab,
    removeWidgetFromActiveTab,

    // Workspace Actions
    addTab,
    updateTabAppearance,
    renameTab,
    removeTab,
  };
};
