
/**
 * ============================================================
 * GLASSDAY — DASHBOARD STATE
 * 파일: src/hooks/useDashboardTabs.ts
 * ============================================================
 *
 * [역할]
 * - Workspace 탭 목록 및 현재 활성 탭 관리
 * - 위젯 추가 / 삭제
 * - 위젯 위치 및 크기 저장
 * - Wide / Laptop 레이아웃 독립 관리
 * - 기존 사용자 저장 데이터 복원 및 검증
 *
 * [연결 파일]
 *
 * App.tsx
 * ├─ AppShell.tsx
 * │  ├─ Sidebar.tsx
 * │  └─ Topbar.tsx
 * └─ DashboardGrid.tsx
 *    └─ useDashboardTabs.ts
 *       └─ useLocalStorage.ts
 *
 * [관련 파일]
 * - src/constants/dashboardTabs.ts
 * - src/constants/dashboardStorage.ts
 * - src/components/grid/gridDefaults.ts
 * - src/types/workspace.ts
 *
 * [저장 구조]
 * - glassday.dashboard.tabs.v1
 * - glassday.dashboard.activeTab.v1
 *
 * [주의]
 * - Wide와 Laptop은 위젯 데이터를 공유한다.
 * - 위젯 배치 좌표는 각각 독립적으로 저장한다.
 * - 모바일 위젯 배치는 useMobileWidgetLayout에서 관리한다.
 * - 데이터를 저장할 때는 항상 최신 상태를 참조한다.
 *
 * [Figma Mapping]
 * - DashboardTab: Workspace Navigation Item
 * - DashboardModeLayouts: Layout Variant
 * - GridLayoutItem: Widget Instance Frame
 * ============================================================
 */

import {
  useCallback,
  useEffect,
  useMemo,
} from "react";

import { useLocalStorage } from "./useLocalStorage";

import {
  DASHBOARD_STORAGE_SCHEMA_KEY,
  DASHBOARD_STORAGE_SCHEMA_VERSION,
} from "../constants/dashboardStorage";

import {
  defaultDashboardTabs,
} from "../constants/dashboardTabs";

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

   PC 및 Tauri 위젯 배치에 사용하는 공통 설정.

   연결:
   - DashboardGrid.tsx
   - useLocalStorage.ts
============================================================ */

const TABS_KEY = "glassday.dashboard.tabs.v1";
const ACTIVE_TAB_KEY = "glassday.dashboard.activeTab.v1";

// DashboardGrid에서 사용하는 전체 열 개수
const GRID_COLUMNS = 16;


/* ============================================================
   02. EMPTY / CLONE LAYOUTS

   Wide와 Laptop 레이아웃을 서로 독립적으로 관리한다.

   같은 배열이나 객체를 공유하여 한쪽의 변경이
   다른 쪽에 영향을 주는 것을 방지한다.
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
   03. FALLBACK HOME TAB

   저장된 Workspace 데이터가 없거나 비어 있을 때
   사용하는 안전한 기본 Home 화면.

   기존 기본 위젯 및 좌표를 유지한다.
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
   04. COMMON UTILITIES

   ID 생성 및 저장 데이터 검증.
============================================================ */

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

const isRecord = (
  value: unknown
): value is Record<string, unknown> => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
};

/**
 * 숫자를 유한한 정수로 변환한다.
 *
 * 잘못된 좌표가 저장되어 있을 경우 fallback을 사용한다.
 */
const toSafeInteger = (
  value: unknown,
  fallback: number
): number => {

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.round(value);
};

/**
 * 숫자가 지정한 범위를 벗어나지 않도록 제한한다.
 */
const clamp = (
  value: number,
  min: number,
  max: number
): number => {
  return Math.max(min, Math.min(value, max));
};


/* ============================================================
   05. GRID ITEM VALIDATION

   위젯 하나의 위치 및 크기 데이터 검증.

   i : Widget ID
   x : 가로 시작 위치
   y : 세로 시작 위치
   w : 가로 크기
   h : 세로 크기

   예전 데이터에서 Infinity가 JSON 저장 과정 중
   null로 변환된 경우도 복구할 수 있도록 처리한다.
============================================================ */

type StoredGridLayoutItem =
  Omit<GridLayoutItem, "y"> & {
    y: number | null;
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


/* ============================================================
   06. GRID ITEM NORMALIZATION

   저장 또는 복원 시 위젯이 Grid 가로 경계를
   벗어나지 않도록 기본 좌표를 보정한다.

   필수 조건:
   - x >= 0
   - y >= 0
   - w >= 1
   - h >= 1
   - x + w <= GRID_COLUMNS

   위젯별 최소 크기 및 실제 Resize 동작은
   DashboardGrid.tsx에서 관리한다.
============================================================ */

const normalizeLayoutItem = (
  item: StoredGridLayoutItem,
  fallbackY = 0
): GridLayoutItem => {

  // 위젯의 가로 크기는 최대 16칸
  const safeW = clamp(
    toSafeInteger(item.w, 4),
    1,
    GRID_COLUMNS
  );

  // 위젯의 세로 크기는 최소 1칸
  const safeH = Math.max(
    1,
    toSafeInteger(item.h, 4)
  );

  // 위젯 오른쪽 끝이 16-column 경계를 넘지 않도록 제한
  const safeX = clamp(
    toSafeInteger(item.x, 0),
    0,
    GRID_COLUMNS - safeW
  );

  // Infinity 또는 null 좌표는 지정된 fallback 위치로 복구
  const safeY = Math.max(
    0,
    toSafeInteger(item.y, fallbackY)
  );

  return {
    ...item,

    i: item.i,

    x: safeX,
    y: safeY,

    w: safeW,
    h: safeH,
  };
};


/* ============================================================
   07. GRID LAYOUT ARRAY NORMALIZATION

   하나의 breakpoint에 저장된 위젯 목록을 검증한다.

   - 잘못된 좌표 보정
   - 중복 위젯 ID 제거
   - 유효하지 않은 세로 좌표 복구

   정상적인 위젯의 기존 위치와 크기는 유지한다.
============================================================ */

const normalizeLayoutArray = (
  value: unknown
): GridLayoutItem[] => {

  if (!Array.isArray(value)) return [];

  const validItems = value.filter(isLayoutItem);

  const seenIds = new Set<string>();

  const uniqueItems = validItems.filter((item) => {
    if (seenIds.has(item.i)) return false;

    seenIds.add(item.i);

    return true;
  });

  /**
   * 정상적인 y 좌표를 가진 위젯 중
   * 가장 아래에 위치한 위젯의 끝부분을 계산한다.
   *
   * 비정상적인 y 좌표를 가진 위젯은
   * 이 위치 아래로 이동시킨다.
   */
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

    const hasValidY =
      typeof item.y === "number" &&
      Number.isFinite(item.y);

    if (hasValidY) {
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

   화면 크기에 따라 저장된 3가지 배치를 검증한다.

   lg: Large
   md: Medium
   sm: Small

   Tauri에서도 실제 Dashboard 너비에 따라
   해당 breakpoint의 좌표를 사용한다.
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
   09. MERGE SAVED LAYOUTS WITH DEFAULTS

   앱 업데이트로 새로운 기본 위젯이 추가된 경우
   기존 사용자 레이아웃에 누락 항목만 추가한다.

   사용자가 직접 설정한 위치 및 크기는 유지한다.
============================================================ */

const mergeLayoutArray = (
  savedItems: GridLayoutItem[],
  defaultItems: GridLayoutItem[]
): GridLayoutItem[] => {

  const savedIds = new Set(
    savedItems.map((item) => item.i)
  );

  const missingDefaultItems = defaultItems
    .filter((item) => !savedIds.has(item.i))
    .map((item) => ({ ...item }));

  return normalizeLayoutArray([
    ...savedItems,
    ...missingDefaultItems,
  ]);
};

const mergeLayoutsWithDefaults = (
  savedLayouts: DashboardModeLayouts,
  defaultLayouts: DashboardModeLayouts
): DashboardModeLayouts => {

  const mergeMode = (
    mode: DashboardLayoutMode
  ): Layouts => {

    const saved = savedLayouts[mode];
    const defaults = defaultLayouts[mode];

    return {
      lg: mergeLayoutArray(saved.lg, defaults.lg),
      md: mergeLayoutArray(saved.md, defaults.md),
      sm: mergeLayoutArray(saved.sm, defaults.sm),
    };
  };

  return {
    wide: mergeMode("wide"),
    laptop: mergeMode("laptop"),
  };
};


/* ============================================================
   10. WIDE / LAPTOP LAYOUT NORMALIZATION

   기존 저장 구조와의 호환성을 유지한다.

   과거 버전:
   layouts = { lg, md, sm }

   현재 버전:
   layouts = {
     wide: { lg, md, sm },
     laptop: { lg, md, sm }
   }

   이전 버전의 데이터도 정상적으로 복원한다.
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

    const wideLayouts = normalizeLayouts(value.wide);

    const laptopLayouts = normalizeLayouts(
      value.laptop
    );

    const hasLaptopLayouts =
      laptopLayouts.lg.length > 0 ||
      laptopLayouts.md.length > 0 ||
      laptopLayouts.sm.length > 0;

    return {
      wide: wideLayouts,

      laptop: hasLaptopLayouts
        ? laptopLayouts
        : cloneLayouts(wideLayouts),
    };
  }

  // 이전 버전의 단일 레이아웃 구조 복원
  const sharedLayouts = normalizeLayouts(value);

  return createModeLayouts(sharedLayouts);
};


/* ============================================================
   11. WORKSPACE TAB NORMALIZATION

   하나의 Workspace Tab에 저장된 데이터를 검증한다.

   Memo:
   - 기존 memo ID 유지
   - 예전에 Diary로 저장된 이름을 Memo로 복원

   Diary:
   - 별도의 독립 Workspace 유지
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
      ? [...new Set(tab.widgetIds)]
      : [],

    layouts: normalizeModeLayouts(tab.layouts),

    locked: Boolean(tab.locked),
  };

  // 앱 저장 스키마 업데이트가 아닌 경우 기존 데이터 유지
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

  const mergedWidgetIds = [
    ...new Set([
      ...normalizedTab.widgetIds,
      ...defaultTab.widgetIds,
    ]),
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


/* ============================================================
   12. WORKSPACE TAB ARRAY NORMALIZATION

   전체 Workspace 목록을 검증한다.
============================================================ */

const normalizeTabs = (
  tabs: DashboardTab[],
  options: NormalizeOptions = {}
): DashboardTab[] => {

  if (!Array.isArray(tabs) || tabs.length === 0) {
    return [fallbackTab];
  }

  return tabs.map((tab) =>
    normalizeTab(tab, options)
  );
};


/* ============================================================
   13. CREATE NEW WORKSPACE

   Sidebar에서 새로운 Workspace를 추가할 때 사용.

   기본 위젯:
   - Memo
   - Calendar

   Wide / Laptop은 동일한 초기 좌표를 사용하지만
   생성 이후에는 각각 독립적으로 관리한다.
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
   14. REMOVE WIDGET FROM RESPONSIVE LAYOUTS

   특정 위젯을 삭제하면 lg / md / sm에 저장된
   해당 위젯의 좌표도 같이 제거한다.

   Wide와 Laptop에서 공통으로 사용하는 함수.
============================================================ */

const removeWidgetFromLayouts = (
  layouts: Layouts,
  widgetId: WidgetId
): Layouts => {

  return {
    lg: layouts.lg.filter(
      (item) => item.i !== widgetId
    ),

    md: layouts.md.filter(
      (item) => item.i !== widgetId
    ),

    sm: layouts.sm.filter(
      (item) => item.i !== widgetId
    ),
  };
};


/* ============================================================
   15. MAIN DASHBOARD HOOK

   App.tsx에서 호출하는 메인 Hook.

   Workspace, Widget, Grid Layout의 저장 상태를
   관리하는 Source of Truth.
============================================================ */

export const useDashboardTabs = () => {

  /* ----------------------------------------------------------
     A. STORED TABS

     전체 탭 목록을 LocalStorage와 연결한다.
  ---------------------------------------------------------- */

  const {
    value: storedTabs,
    setValue: setTabs,
  } = useLocalStorage<DashboardTab[]>(
    TABS_KEY,
    defaultDashboardTabs
  );


  /* ----------------------------------------------------------
     B. ACTIVE WORKSPACE

     마지막으로 사용한 Workspace를 복원한다.
  ---------------------------------------------------------- */

  const {
    value: activeTabId,
    setValue: setActiveTabId,
  } = useLocalStorage<string>(
    ACTIVE_TAB_KEY,
    "home"
  );


  /* ----------------------------------------------------------
     C. STORAGE SCHEMA VERSION

     앱이 업데이트되어 저장 구조가 변경된 경우에만
     기존 데이터에 기본값을 보충한다.
  ---------------------------------------------------------- */

  const shouldUpgradeDashboardStorage =
    typeof window !== "undefined" &&
    window.localStorage.getItem(
      DASHBOARD_STORAGE_SCHEMA_KEY
    ) !== String(DASHBOARD_STORAGE_SCHEMA_VERSION);


  /* ----------------------------------------------------------
     D. NORMALIZED TABS

     화면에서 사용할 안전한 Workspace 데이터.
  ---------------------------------------------------------- */

  const tabs = useMemo(() => {

    return normalizeTabs(storedTabs, {
      mergeCurrentDefaults:
        shouldUpgradeDashboardStorage,
    });

  }, [
    storedTabs,
    shouldUpgradeDashboardStorage,
  ]);


  /* ----------------------------------------------------------
     E. STORAGE MIGRATION

     기존 사용자 좌표를 초기화하지 않고
     새로운 기본 위젯이 있는 경우에만 보충한다.

     이전 렌더링의 tabs가 아닌
     저장 시점의 최신 prev 값을 사용한다.
  ---------------------------------------------------------- */

  useEffect(() => {

    if (
      typeof window === "undefined" ||
      !shouldUpgradeDashboardStorage
    ) {
      return;
    }

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
     F. ACTIVE TAB

     현재 선택한 Workspace를 찾는다.

     저장된 ID가 유효하지 않은 경우
     첫 번째 탭을 안전하게 사용한다.
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

  // 실제 현재 표시되고 있는 Workspace ID
  const resolvedActiveTabId = activeTab.id;


  /* ----------------------------------------------------------
     G. UPDATE TAB

     특정 Workspace의 데이터를 변경하는 공통 함수.

     중요:
     화면이 렌더링되었을 때의 과거 상태가 아니라
     setTabs에서 전달받은 최신 데이터를 사용한다.

     위젯 이동 / Resize / 추가 / 삭제가
     서로의 변경사항을 덮어쓰지 않도록 한다.
  ---------------------------------------------------------- */

  const updateTab = useCallback(

    (
      tabId: string,
      updater: (tab: DashboardTab) => DashboardTab
    ) => {

      setTabs((previousTabs) => {

        const currentTabs = normalizeTabs(
          previousTabs
        );

        return currentTabs.map((tab) => {

          if (tab.id !== tabId) {
            return tab;
          }

          return normalizeTab(
            updater(tab)
          );
        });

      });

    },

    [setTabs]
  );


  /* ----------------------------------------------------------
     H. UPDATE ACTIVE TAB LAYOUTS

     ★ 위젯 위치 및 크기 저장의 핵심 함수 ★

     연결:
     DashboardGrid.tsx
       → onLayoutsChange
       → updateActiveTabLayouts
       → LocalStorage

     Wide를 편집하면 Wide만 저장하고
     Laptop을 편집하면 Laptop만 저장한다.

     그 외 Workspace와 위젯 데이터는 유지한다.
  ---------------------------------------------------------- */

  const updateActiveTabLayouts = useCallback(

    (
      mode: DashboardLayoutMode,
      layouts: Layouts
    ) => {

      const nextLayouts = normalizeLayouts(layouts);

      updateTab(
        resolvedActiveTabId,

        (currentTab) => ({

          ...currentTab,

          layouts: {

            // 최신 Wide / Laptop 레이아웃 사용
            ...currentTab.layouts,

            // 현재 수정한 Mode만 교체
            [mode]: nextLayouts,

          },

        })
      );

    },

    [
      resolvedActiveTabId,
      updateTab,
    ]
  );


  /* ----------------------------------------------------------
     I. ADD WIDGET

     현재 Workspace에 새로운 위젯을 추가한다.

     이미 존재하는 위젯은 중복 추가하지 않는다.

     신규 위젯의 실제 Grid 좌표는
     DashboardGrid.tsx에서 보완한다.
  ---------------------------------------------------------- */

  const addWidgetToActiveTab = useCallback(

    (widgetId: WidgetId) => {

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
    },

    [
      resolvedActiveTabId,
      updateTab,
    ]
  );


  /* ----------------------------------------------------------
     J. REMOVE WIDGET

     현재 Workspace에서 위젯을 삭제한다.

     함께 제거되는 데이터:
     - widgetIds
     - Wide: lg / md / sm 좌표
     - Laptop: lg / md / sm 좌표

     다른 Workspace 및 위젯 자체의 기록 데이터는
     삭제하지 않는다.
  ---------------------------------------------------------- */

  const removeWidgetFromActiveTab = useCallback(

    (widgetId: WidgetId) => {

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

    },

    [
      resolvedActiveTabId,
      updateTab,
    ]
  );


  /* ----------------------------------------------------------
     K. ADD WORKSPACE

     Sidebar의 새로운 탭 추가 버튼과 연결된다.
  ---------------------------------------------------------- */

  const addTab = useCallback(() => {

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


  /* ----------------------------------------------------------
     L. RENAME WORKSPACE

     Workspace 이름만 변경한다.

     위젯 목록 및 Grid 좌표에는 영향을 주지 않는다.
  ---------------------------------------------------------- */

  const renameTab = useCallback(

    (
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

    },

    [updateTab]
  );


  /* ----------------------------------------------------------
     M. REMOVE WORKSPACE

     사용자가 생성한 Workspace를 삭제한다.

     locked 상태인 기본 Workspace는
     삭제할 수 없다.
  ---------------------------------------------------------- */

  const removeTab = useCallback(

    (tabId: string) => {

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

        const currentTabs = normalizeTabs(
          previousTabs
        );

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
          : [fallbackTab];

      });

      // 현재 표시 중인 탭을 삭제하면 다른 탭으로 이동
      if (resolvedActiveTabId === tabId) {

        setActiveTabId(
          remainingTabs[0]?.id ?? "home"
        );

      }

    },

    [
      tabs,
      resolvedActiveTabId,
      setTabs,
      setActiveTabId,
    ]
  );


  /* ==========================================================
     16. PUBLIC HOOK API

     기존 App.tsx와 연결되는 반환 구조를 유지한다.

     Desktop / Tauri / Mobile에서 현재 사용 중인
     함수 이름은 변경하지 않는다.
  ========================================================== */

  return {

    // Workspace states
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,

    // Widget layout actions
    updateActiveTabLayouts,
    addWidgetToActiveTab,
    removeWidgetFromActiveTab,

    // Workspace actions
    addTab,
    renameTab,
    removeTab,

  };
};
