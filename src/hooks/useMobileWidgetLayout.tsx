
/**
 * ============================================================
 * GLASSDAY — MOBILE WIDGET LAYOUT HOOK
 * 저장: src/hooks/useMobileWidgetLayout.tsx
 *
 * 연결:
 * App.tsx
 *  ├─ MobileWidgetEditor.tsx : 모바일 위젯 편집
 *  └─ MobileDashboard.tsx    : 편집 결과 표시
 *
 * 데이터:
 * - 모바일 배치만 glassday.mobile.widgets.v1에 저장
 * - PC의 glassday.dashboard.tabs.v1은 수정하지 않음
 * - 탭마다 순서, 숨김, 모바일 전용 추가, 크기를 분리
 *
 * 가로 절반 폭:
 * - 작은 위젯에만 허용
 * - 복잡한 Memo/Journal/Career 등은 전체 폭 유지
 * ============================================================
 */

import { useCallback, useMemo } from "react";

import {
  allWidgetIds as registeredWidgetIds,
  widgetRegistry,
} from "../constants/widgets";

import type { DashboardTab } from "../types/workspace";
import { useLocalStorage } from "./useLocalStorage";

/* 01. MOBILE STORAGE CONTRACT */

export const MOBILE_WIDGET_STORAGE_KEY =
  "glassday.mobile.widgets.v1";

export const MOBILE_WIDGET_MIN_HEIGHT = 240;
export const MOBILE_WIDGET_MAX_HEIGHT = 720;
export const MOBILE_WIDGET_HEIGHT_STEP = 20;

export type MobileWidgetWidth = "full" | "half";

export type MobileWidgetSize = {
  width: MobileWidgetWidth;

  // null = 기존 모바일 위젯 높이를 그대로 사용
  // number = 사용자가 지정한 높이(px)
  height: number | null;
};

type MobileTabLayout = {
  // 모바일에서 위젯이 표시되는 순서
  order: string[];

  // PC에서는 유지하고 모바일에서만 숨길 위젯
  hidden: string[];

  // 해당 탭에 모바일에서만 추가한 위젯
  added: string[];

  // 위젯별 모바일 가로/세로 설정
  sizes: Record<string, MobileWidgetSize>;
};

type MobileWidgetStore = {
  version: 1;
  tabs: Record<string, MobileTabLayout>;
};

/* 02. EDITOR / DASHBOARD PUBLIC TYPES */

export type MobileWidgetItem = {
  id: string;
  label: string;
  description: string;

  visible: boolean;
  isMobileOnly: boolean;
  canUseHalf: boolean;

  width: MobileWidgetWidth;
  height: number | null;
};

export type MobileWidgetLayoutController = {
  items: MobileWidgetItem[];

  // 실제 모바일 대시보드에 표시할 위젯
  visibleWidgetIds: string[];

  // 숨겨진 위젯까지 포함한 전체 모바일 위젯
  allWidgetIds: string[];

  // 위젯별 크기 설정
  sizeById: Record<string, MobileWidgetSize>;

  // 편집 화면에서 새로 추가할 수 있는 위젯
  availableToAdd: string[];

  addWidget: (id: string) => void;
  removeMobileWidget: (id: string) => void;

  setWidgetVisible: (id: string, visible: boolean) => void;
  moveWidget: (id: string, direction: -1 | 1) => void;

  setWidth: (id: string, width: MobileWidgetWidth) => void;
  setHeight: (id: string, height: number | null) => void;

  resetTab: () => void;
};

/* 03. DEFAULTS */

const EMPTY_STORE: MobileWidgetStore = {
  version: 1,
  tabs: {},
};

const DEFAULT_SIZE: MobileWidgetSize = {
  width: "full",
  height: null,
};

/**
 * 작은 위젯만 2열 배치 허용.
 *
 * 넓은 입력창이나 복잡한 내부 그리드가 있는 위젯은
 * 좁은 화면에서 조작하기 어렵기 때문에 제외한다.
 */
const HALF_WIDTH_WIDGETS = new Set([
  "alerts",
  "timer",
  "health",
  "mood",
]);

/* 04. NORMALIZATION HELPERS */

/** 손상되거나 오래된 localStorage 데이터에 대비 */
const isRecord = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value);

/** 중복되거나 잘못된 ID 제거 */
const toIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value.filter(
        (id): id is string =>
          typeof id === "string" &&
          id.trim().length > 0
      )
    ),
  ];
};

/** 허용 범위 밖으로 저장된 높이를 정상 범위로 보정 */
const normalizeHeight = (
  value: unknown
): number | null => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  const clamped = Math.max(
    MOBILE_WIDGET_MIN_HEIGHT,
    Math.min(MOBILE_WIDGET_MAX_HEIGHT, value)
  );

  return (
    Math.round(clamped / MOBILE_WIDGET_HEIGHT_STEP) *
    MOBILE_WIDGET_HEIGHT_STEP
  );
};

const normalizeSize = (
  value: unknown,
  widgetId: string
): MobileWidgetSize => {
  if (!isRecord(value)) {
    return { ...DEFAULT_SIZE };
  }

  const width: MobileWidgetWidth =
    value.width === "half" &&
    HALF_WIDTH_WIDGETS.has(widgetId)
      ? "half"
      : "full";

  return {
    width,
    height: normalizeHeight(value.height),
  };
};

/**
 * 하나의 탭 설정을 정규화한다.
 *
 * 원래 PC 탭에 있던 widgetIds는 기본값으로 가져오지만,
 * 이후의 모바일 편집은 독립적인 added/hidden/order에 저장한다.
 */
const normalizeTabLayout = (
  rawValue: unknown,
  baseWidgetIds: string[]
): MobileTabLayout => {
  const raw = isRecord(rawValue) ? rawValue : {};

  const base = toIds(baseWidgetIds);

  // 모바일에서 추가한 위젯만 별도로 보관한다.
  const added = toIds(raw.added).filter(
    (id) =>
      registeredWidgetIds.includes(id) &&
      !base.includes(id)
  );

  const allowed = [...base, ...added];
  const allowedSet = new Set(allowed);

  // 사용자 순서를 우선하고, 나중에 새로 생긴 위젯은 뒤에 추가.
  const savedOrder = toIds(raw.order).filter(
    (id) => allowedSet.has(id)
  );

  const order = [
    ...savedOrder,
    ...allowed.filter((id) => !savedOrder.includes(id)),
  ];

  const hidden = toIds(raw.hidden).filter(
    (id) => allowedSet.has(id)
  );

  const rawSizes = isRecord(raw.sizes)
    ? raw.sizes
    : {};

  const sizes: Record<string, MobileWidgetSize> = {};

  for (const id of allowed) {
    sizes[id] = normalizeSize(rawSizes[id], id);
  }

  return {
    order,
    hidden,
    added,
    sizes,
  };
};

/* 05. MAIN HOOK */

/**
 * 현재 워크스페이스의 모바일 위젯 설정.
 *
 * 사용 예:
 * const mobileLayout = useMobileWidgetLayout(activeTab);
 *
 * 반드시 App.tsx에서 한 번 호출한 뒤
 * Editor와 Dashboard에 결과를 props로 전달한다.
 */
export const useMobileWidgetLayout = (
  activeTab: DashboardTab
): MobileWidgetLayoutController => {
  const {
    value: store,
    setValue: setStore,
  } = useLocalStorage<MobileWidgetStore>(
    MOBILE_WIDGET_STORAGE_KEY,
    EMPTY_STORE
  );

  /* 현재 탭의 저장 데이터 정규화 */
  const layout = useMemo(() => {
    const rawTabs = isRecord(store.tabs)
      ? store.tabs
      : {};

    return normalizeTabLayout(
      rawTabs[activeTab.id],
      activeTab.widgetIds
    );
  }, [
    store.tabs,
    activeTab.id,
    activeTab.widgetIds,
  ]);

  /**
   * 저장값 갱신 공통 함수.
   *
   * 다른 탭 데이터는 건드리지 않고
   * 현재 탭의 모바일 레이아웃만 수정한다.
   */
  const updateTab = useCallback(
    (
      edit: (current: MobileTabLayout) => MobileTabLayout
    ) => {
      setStore((previous) => {
        const previousTabs = isRecord(previous.tabs)
          ? (previous.tabs as Record<
              string,
              MobileTabLayout
            >)
          : {};

        const current = normalizeTabLayout(
          previousTabs[activeTab.id],
          activeTab.widgetIds
        );

        const next = normalizeTabLayout(
          edit(current),
          activeTab.widgetIds
        );

        return {
          version: 1,
          tabs: {
            ...previousTabs,
            [activeTab.id]: next,
          },
        };
      });
    },
    [
      activeTab.id,
      activeTab.widgetIds,
      setStore,
    ]
  );

  /* 06. ADD / REMOVE / VISIBILITY */

  /**
   * 모바일에만 위젯 추가.
   * 기존 PC DashboardTab.widgetIds는 변경하지 않는다.
   */
  const addWidget = useCallback(
    (id: string) => {
      if (!registeredWidgetIds.includes(id)) return;

      updateTab((current) => {
        if (current.order.includes(id)) {
          // 이미 있다면 숨김만 해제
          return {
            ...current,
            hidden: current.hidden.filter(
              (item) => item !== id
            ),
          };
        }

        return {
          ...current,
          added: [...current.added, id],
          order: [...current.order, id],
        };
      });
    },
    [updateTab]
  );

  /**
   * 모바일에서 추가했던 위젯만 완전히 제거.
   * PC에 원래 있는 위젯은 여기서 지우지 않는다.
   */
  const removeMobileWidget = useCallback(
    (id: string) => {
      updateTab((current) => {
        if (!current.added.includes(id)) {
          return current;
        }

        const sizes = Object.fromEntries(
          Object.entries(current.sizes).filter(
            ([key]) => key !== id
          )
        );

        return {
          ...current,
          added: current.added.filter(
            (item) => item !== id
          ),
          order: current.order.filter(
            (item) => item !== id
          ),
          hidden: current.hidden.filter(
            (item) => item !== id
          ),
          sizes,
        };
      });
    },
    [updateTab]
  );

  /** PC 설정은 유지하고 모바일 표시 여부만 변경 */
  const setWidgetVisible = useCallback(
    (id: string, visible: boolean) => {
      updateTab((current) => {
        if (!current.order.includes(id)) return current;

        return {
          ...current,
          hidden: visible
            ? current.hidden.filter(
                (item) => item !== id
              )
            : [...new Set([...current.hidden, id])],
        };
      });
    },
    [updateTab]
  );

  /* 07. ORDER */

  /**
   * 모바일 위젯 순서 변경.
   *
   * direction = -1: 한 칸 위
   * direction =  1: 한 칸 아래
   *
   * PC Grid의 x/y 좌표에는 영향이 없다.
   */
  const moveWidget = useCallback(
    (id: string, direction: -1 | 1) => {
      updateTab((current) => {
        const index = current.order.indexOf(id);
        const target = index + direction;

        if (
          index < 0 ||
          target < 0 ||
          target >= current.order.length
        ) {
          return current;
        }

        const order = [...current.order];

        [order[index], order[target]] = [
          order[target],
          order[index],
        ];

        return {
          ...current,
          order,
        };
      });
    },
    [updateTab]
  );

  /* 08. SIZE */

  /** 가로: 전체 폭 또는 절반 폭 */
  const setWidth = useCallback(
    (id: string, width: MobileWidgetWidth) => {
      updateTab((current) => {
        if (!current.order.includes(id)) return current;

        const safeWidth: MobileWidgetWidth =
          width === "half" && HALF_WIDTH_WIDGETS.has(id)
            ? "half"
            : "full";

        return {
          ...current,
          sizes: {
            ...current.sizes,
            [id]: {
              ...current.sizes[id],
              width: safeWidth,
            },
          },
        };
      });
    },
    [updateTab]
  );

  /** 세로: 자동(null) 또는 240~720px */
  const setHeight = useCallback(
    (id: string, height: number | null) => {
      updateTab((current) => {
        if (!current.order.includes(id)) return current;

        return {
          ...current,
          sizes: {
            ...current.sizes,
            [id]: {
              ...current.sizes[id],
              height: normalizeHeight(height),
            },
          },
        };
      });
    },
    [updateTab]
  );

  /* 09. RESET */

  /** 현재 탭의 모바일 설정만 초기화 */
  const resetTab = useCallback(() => {
    setStore((previous) => {
      const tabs = isRecord(previous.tabs)
        ? {
            ...(previous.tabs as Record<
              string,
              MobileTabLayout
            >),
          }
        : {};

      delete tabs[activeTab.id];

      return {
        version: 1,
        tabs,
      };
    });
  }, [activeTab.id, setStore]);

  /* 10. VIEW MODEL */

  const items = useMemo<MobileWidgetItem[]>(() => {
    const hiddenSet = new Set(layout.hidden);
    const mobileOnlySet = new Set(layout.added);

    return layout.order.map((id) => {
      const size = layout.sizes[id] ?? DEFAULT_SIZE;

      return {
        id,
        label: widgetRegistry[id]?.label ?? id,
        description:
          widgetRegistry[id]?.description ?? "",

        visible: !hiddenSet.has(id),
        isMobileOnly: mobileOnlySet.has(id),
        canUseHalf: HALF_WIDTH_WIDGETS.has(id),

        width: size.width,
        height: size.height,
      };
    });
  }, [layout]);

  const visibleWidgetIds = useMemo(
    () =>
      items
        .filter((item) => item.visible)
        .map((item) => item.id),
    [items]
  );

  const allWidgetIds = useMemo(
    () => items.map((item) => item.id),
    [items]
  );

  const availableToAdd = useMemo(
    () =>
      registeredWidgetIds.filter(
        (id) => !layout.order.includes(id)
      ),
    [layout.order]
  );

  return {
    items,
    visibleWidgetIds,
    allWidgetIds,
    sizeById: layout.sizes,
    availableToAdd,

    addWidget,
    removeMobileWidget,
    setWidgetVisible,
    moveWidget,
    setWidth,
    setHeight,
    resetTab,
  };
};
