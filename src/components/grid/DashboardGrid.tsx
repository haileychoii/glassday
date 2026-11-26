
/**
 * ============================================================
 * GLASSDAY — DASHBOARD GRID
 * 파일: src/components/grid/DashboardGrid.tsx
 * ============================================================
 *
 * [역할]
 * - Workspace별 위젯 렌더링
 * - 16-column Grid 배치
 * - 실제 Canvas 너비 측정
 * - 위젯 이동 및 8방향 Resize
 * - 위젯 충돌 및 세로 Reflow
 * - 사용자 편집 결과 저장
 *
 * [연결 구조]
 *
 * App.tsx
 * └─ AppShell.tsx
 *    └─ DashboardGrid.tsx
 *       ├─ WidgetSlot.tsx
 *       ├─ DiaryWorkspace.tsx
 *       ├─ gridDefaults.ts
 *       └─ useDashboardTabs.ts
 *
 * [관련 CSS]
 * - dashboard-grid.css
 * - layout-modes.css
 * - responsive.css
 * - overrides.css
 *
 * [Grid 규칙]
 * - 모든 Breakpoint는 16-column
 * - lg: 980px 이상
 * - md: 620px 이상
 * - sm: 620px 미만
 * - 실제 Canvas 너비 기준
 *
 * [편집 규칙]
 * - View / Edit는 동일한 저장 좌표를 사용한다.
 * - 이동 중에는 Draft를 표시한다.
 * - PointerUp에서 최종 좌표를 계산하고 저장한다.
 * - 현재 Breakpoint를 제외한 좌표는 유지한다.
 * - 위젯은 가로 경계를 벗어날 수 없다.
 *
 * [Figma Mapping]
 * - Dashboard Canvas
 * - Widget Frame
 * - Selected Widget Variant
 * - Resize Handles
 * - Widget Picker
 *
 * ============================================================
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from "react";

import GridLayout from "react-grid-layout/legacy";

import type {
  DashboardLayoutMode,
  DashboardTab,
  GridLayoutItem,
  Layouts,
  WidgetId,
  WidgetMeta,
} from "../../types/workspace";

import { WidgetSlot } from "../widgets/WidgetSlot";
import { DiaryWorkspace } from "../widgets/DiaryWorkspace";

import { defaultLayoutsByMode } from "./gridDefaults";

import {
  allWidgetIds,
  widgetRegistry,
} from "../../constants/widgets";

import {
  defaultDashboardTabs,
} from "../../constants/dashboardTabs";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";


/* ============================================================
   01. GRID CONSTANTS

   DashboardGrid에서 사용하는 공통 Grid 숫자.

   CSS에서는 이 값으로 생성한 CSS 변수를 사용한다.
============================================================ */

const GRID_COLUMNS = 16;

const INITIAL_VISIBLE_ROWS = 16;

type Breakpoint = "lg" | "md" | "sm";

const BREAKPOINTS = {
  lg: 980,
  md: 620,
  sm: 0,
};

/*
 * React Grid Layout geometry / Grid 라이브러리에 필요한 수치 설정:
 * - rowHeight: layout mode별 세로 셀 높이. 저장된 y/h 좌표의 실제 픽셀 크기를 정한다.
 * - `--gd-widget-outer-gap` in spacing-tokens.css: shared card-to-card gap.
 *
 * React Grid Layout은 margin을 숫자 prop으로 요구한다. CSS의 공통 spacing token을
 * 읽어 숫자로 넘기므로 간격의 원본은 spacing-tokens.css 한 곳에 둔다.
 */
const readDashboardWidgetGap = (): number => {
  const token = getComputedStyle(document.documentElement)
    .getPropertyValue("--gd-widget-outer-gap")
    .trim();
  const value = Number.parseFloat(token);

  return Number.isFinite(value) ? value : 12;
};

const GRID_SETTINGS = {
  /*
   * Card-to-card outer spacing / 대시보드 위젯 바깥 간격:
   * The CSS token is passed below as React Grid Layout's two-axis `margin` prop.
   * This distance is outside each `.glass-card`; do not change a widget's
   * body padding to move cards farther apart. Change `--gd-widget-outer-gap`
   * in spacing-tokens.css to update the shared card gap; `rowHeight` remains
   * a layout engine measurement, not visual widget padding.
   */
  wide: {
    rowHeight: 52,
  },

  laptop: {
    rowHeight: 46,
  },
};

const RESIZE_HANDLES = [
  "n",
  "s",
  "e",
  "w",
  "ne",
  "nw",
  "se",
  "sw",
] as const;

type ResizeHandle =
  (typeof RESIZE_HANDLES)[number];

const safeWidgetRegistry =
  widgetRegistry as Record<string, WidgetMeta>;


/* ============================================================
   02. WIDGET SIZE CONSTRAINTS

   개별 위젯의 기능을 사용할 수 있는
   최소 가로 및 세로 크기를 관리한다.

   이 값보다 작게 Resize할 수 없다.
============================================================ */

const WIDGET_LAYOUT_CONSTRAINTS: Partial<
  Record<
    WidgetId,
    Pick<GridLayoutItem, "minH" | "minW">
  >
> = {
  calendar: {
    minW: 5,
    minH: 9,
  },
};


/* ============================================================
   03. FOCUSED WORKSPACE PROFILES

   기존 기본 Workspace에서 표시하는 핵심 위젯 목록.

   기존 Workspace 구성을 유지하되,
   위젯의 크기와 위치는 강제로 변경하지 않는다.
============================================================ */

const FOCUSED_WIDGETS_BY_TAB: Record<
  string,
  WidgetId[]
> = {
  home: ["today", "calendar", "memo"],

  career: ["career", "calendar"],

  study: ["study", "timer", "calendar"],

  memo: ["memo", "journal"],

  life: [
    "habit-tracker",
    "mood",
    "money",
    "calendar",
  ],
};

const getFocusedProfileId = (
  tab: DashboardTab
): string | undefined => {

  if (
    Object.hasOwn(
      FOCUSED_WIDGETS_BY_TAB,
      tab.id
    )
  ) {
    return tab.id;
  }

  const normalizedLabel =
    tab.label.trim().toLowerCase();

  return Object.hasOwn(
    FOCUSED_WIDGETS_BY_TAB,
    normalizedLabel
  )
    ? normalizedLabel
    : undefined;
};


/* ============================================================
   04. COMPONENT / INTERACTION TYPES

   App.tsx 및 useDashboardTabs.ts와 연결되는
   기존 Props 구조를 유지한다.
============================================================ */

type DashboardGridProps = {
  editMode: boolean;

  layoutMode: DashboardLayoutMode;

  activeTab: DashboardTab;

  onLayoutsChange: (
    mode: DashboardLayoutMode,
    layouts: Layouts
  ) => void;

  onAddWidget: (
    widgetId: WidgetId
  ) => void;

  onRemoveWidget: (
    widgetId: WidgetId
  ) => void;

  onEditValidationChange?: (
    state: {
      hasCollision: boolean;
      collidingWidgetIds: WidgetId[];
    }
  ) => void;
};


/**
 * 위젯 이동 또는 Resize를 시작했을 때의 상태.
 *
 * React의 비동기 State 업데이트와 별도로
 * useRef에 현재 작업을 기록한다.
 */

type EditInteraction = {
  mode: "move" | "resize";

  widgetId: WidgetId;

  breakpoint: Breakpoint;

  handle?: ResizeHandle;

  pointerId: number;

  captureTarget: HTMLElement;

  canvasWidth: number;

  startPointerX: number;
  startPointerY: number;

  scaleX: number;
  scaleY: number;

  columnStep: number;
  rowStep: number;

  startItem: GridLayoutItem;

  startLayout: GridLayoutItem[];
};

type DraftLayout = {
  breakpoint: Breakpoint;
  items: GridLayoutItem[];
};


/* ============================================================
   05. COMMON NUMBER UTILITIES
============================================================ */

const clamp = (
  value: number,
  min: number,
  max: number
): number =>
  Math.max(min, Math.min(value, max));


const safeInteger = (
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


/**
 * 실제 Canvas 너비로 Breakpoint를 결정한다.
 *
 * window.innerWidth는 Sidebar 너비를 포함하므로
 * Dashboard Grid의 기준으로 사용하지 않는다.
 */

const getBreakpoint = (
  width: number
): Breakpoint => {

  if (width >= BREAKPOINTS.lg) {
    return "lg";
  }

  if (width >= BREAKPOINTS.md) {
    return "md";
  }

  return "sm";
};


/* ============================================================
   06. GRID ITEM NORMALIZATION

   위젯 하나의 위치 및 크기를 검증한다.

   x : 가로 시작 좌표
   y : 세로 시작 좌표
   w : 가로 크기
   h : 세로 크기

   가장 중요한 조건:
   x + w <= 16
============================================================ */

const normalizeLayoutItem = (
  item: GridLayoutItem,
  fallbackY = 0
): GridLayoutItem => {

  const constraints =
    WIDGET_LAYOUT_CONSTRAINTS[item.i] ?? {};

  const minW = clamp(
    safeInteger(
      constraints.minW ?? item.minW,
      2
    ),
    2,
    GRID_COLUMNS
  );

  const minH = Math.max(
    3,
    safeInteger(
      constraints.minH ?? item.minH,
      3
    )
  );

  const maxW = clamp(
    safeInteger(
      item.maxW,
      GRID_COLUMNS
    ),
    minW,
    GRID_COLUMNS
  );

  const maxH =
    typeof item.maxH === "number" &&
    Number.isFinite(item.maxH)
      ? Math.max(
          minH,
          Math.round(item.maxH)
        )
      : undefined;

  // 가로 크기가 전체 Grid를 넘지 않도록 제한
  const w = clamp(
    safeInteger(item.w, 4),
    minW,
    maxW
  );

  const h = clamp(
    safeInteger(item.h, 5),
    minH,
    maxH ?? Infinity
  );

  // 위젯 오른쪽 끝이 16열을 초과하지 않도록 제한
  const x = clamp(
    safeInteger(item.x, 0),
    0,
    GRID_COLUMNS - w
  );

  const y = Math.max(
    0,
    safeInteger(item.y, fallbackY)
  );

  return {
    ...item,

    x,
    y,
    w,
    h,

    minW,
    minH,
    maxW,
    maxH,
  };
};


/* ============================================================
   07. GRID COLLISION DETECTION

   두 위젯이 실제 Grid 좌표에서 겹치는지 확인한다.
============================================================ */

const isOverlapping = (
  a: GridLayoutItem,
  b: GridLayoutItem
): boolean => {

  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
};


const getCollidingWidgetIds = (
  layout: GridLayoutItem[]
): WidgetId[] => {

  const collided = new Set<WidgetId>();

  for (
    let i = 0;
    i < layout.length;
    i += 1
  ) {
    for (
      let j = i + 1;
      j < layout.length;
      j += 1
    ) {

      const first = layout[i];
      const second = layout[j];

      if (!first || !second) continue;

      if (isOverlapping(first, second)) {
        collided.add(first.i);
        collided.add(second.i);
      }
    }
  }

  return [...collided];
};


/* ============================================================
   08. GRID REFLOW

   위젯이 겹치는 경우 아래쪽으로 재배치한다.

   우선순위 위젯:
   - 현재 사용자가 이동하거나 Resize하는 위젯

   다른 위젯:
   - 기존 위치를 최대한 유지
   - 충돌하는 경우에만 아래쪽으로 이동

   중복된 Reflow 함수는 이 함수 하나로 통합한다.
============================================================ */

const stackLayout = (
  layout: GridLayoutItem[],
  priorityItemId?: string
): GridLayoutItem[] => {

  const ordered = [...layout].sort((a, b) => {

    if (a.i === priorityItemId) {
      return -1;
    }

    if (b.i === priorityItemId) {
      return 1;
    }

    return (
      a.y - b.y ||
      a.x - b.x ||
      a.i.localeCompare(b.i)
    );
  });

  const placed: GridLayoutItem[] = [];

  ordered.forEach((sourceItem) => {

    const item = { ...sourceItem };

    // 충돌하는 동안 다른 위젯의 아래로 이동
    let collisions = placed.filter(
      (existing) =>
        isOverlapping(item, existing)
    );

    while (collisions.length > 0) {

      item.y = Math.max(
        ...collisions.map(
          (existing) =>
            existing.y + existing.h
        )
      );

      collisions = placed.filter(
        (existing) =>
          isOverlapping(item, existing)
      );
    }

    placed.push(item);
  });

  return placed;
};


/* ============================================================
   09. DEFAULT WIDGET LAYOUT

   저장된 좌표가 없는 위젯에만 기본값을 사용한다.

   연결: gridDefaults.ts

   기존 위젯의 사용자 지정 좌표를
   기본값으로 덮어쓰지 않는다.
============================================================ */

const getDefaultLayoutForWidget = (
  layoutMode: DashboardLayoutMode,
  widgetId: WidgetId,
  breakpoint: Breakpoint,
  fallbackY: number
): GridLayoutItem => {

  const defaults =
    defaultLayoutsByMode[layoutMode];

  const defaultItem =
    defaults[breakpoint]?.find(
      (item) => item.i === widgetId
    ) ??
    defaults.lg?.find(
      (item) => item.i === widgetId
    );

  if (defaultItem) {
    return normalizeLayoutItem(
      defaultItem,
      fallbackY
    );
  }

  return normalizeLayoutItem({
    i: widgetId,

    x: 0,
    y: fallbackY,

    w: breakpoint === "sm" ? 16 : 8,
    h: 8,
  });
};


/* ============================================================
   10. RESTORE CURRENT BREAKPOINT LAYOUT

   현재 Workspace에 저장된 좌표를 복원한다.

   - 화면에 존재하는 위젯만 추출
   - 중복 ID 제거
   - 가로 경계 보정
   - 누락 위젯 추가
   - 충돌 시 Reflow

   View / Edit 모두 이 결과를 사용한다.
============================================================ */

const ensureLayoutForWidgets = (
  storedLayout: GridLayoutItem[] | undefined,
  widgetIds: WidgetId[],
  breakpoint: Breakpoint,
  layoutMode: DashboardLayoutMode
): GridLayoutItem[] => {

  const allowedIds = new Set(widgetIds);

  const existingIds = new Set<string>();

  const existingLayout: GridLayoutItem[] = [];

  const source = Array.isArray(storedLayout)
    ? storedLayout
    : [];

  let nextY = 0;

  // 정상적인 저장 좌표를 기준으로 가장 아래 위치 계산
  for (const item of source) {

    if (!item || !allowedIds.has(item.i)) {
      continue;
    }

    if (!Number.isFinite(item.y)) {
      continue;
    }

    const normalized =
      normalizeLayoutItem(item);

    nextY = Math.max(
      nextY,
      normalized.y + normalized.h
    );
  }

  // 기존 사용자 위젯 좌표를 복원한다.
  for (const item of source) {

    if (!item || !allowedIds.has(item.i)) {
      continue;
    }

    if (existingIds.has(item.i)) {
      continue;
    }

    const normalized =
      normalizeLayoutItem(item, nextY);

    existingIds.add(normalized.i);

    existingLayout.push(normalized);

    nextY = Math.max(
      nextY,
      normalized.y + normalized.h
    );
  }

  // 누락된 위젯만 기본값으로 생성한다.
  const hasSavedItems =
    existingLayout.length > 0;

  for (const widgetId of widgetIds) {

    if (existingIds.has(widgetId)) {
      continue;
    }

    const defaultItem =
      getDefaultLayoutForWidget(
        layoutMode,
        widgetId,
        breakpoint,
        nextY
      );

    const nextItem = hasSavedItems
      ? {
          ...defaultItem,
          y: nextY,
        }
      : defaultItem;

    existingLayout.push(nextItem);

    existingIds.add(widgetId);

    nextY = Math.max(
      nextY,
      nextItem.y + nextItem.h
    );
  }

  return stackLayout(existingLayout);
};


/* ============================================================
   11. MERGE EDITED LAYOUT

   사용자가 편집한 위젯의 좌표만 반영한다.

   기존 저장 구조에서 화면에 표시되지 않는 위젯은
   삭제하지 않고 그대로 보존한다.
============================================================ */

const mergeEditedLayout = (
  savedItems: GridLayoutItem[],
  editedItems: GridLayoutItem[]
): GridLayoutItem[] => {

  const editedById = new Map(
    editedItems.map(
      (item) => [item.i, item]
    )
  );

  const savedIds = new Set(
    savedItems.map(
      (item) => item.i
    )
  );

  return [
    ...savedItems.map(
      (item) =>
        editedById.get(item.i) ?? item
    ),

    ...editedItems.filter(
      (item) => !savedIds.has(item.i)
    ),
  ];
};


/**
 * 좌표가 실제로 변경되었는지 확인한다.
 *
 * 위젯을 단순 클릭한 경우에는
 * 불필요한 LocalStorage 저장을 하지 않는다.
 */

const hasLayoutChanged = (
  previous: GridLayoutItem[],
  next: GridLayoutItem[]
): boolean => {

  if (previous.length !== next.length) {
    return true;
  }

  const previousById = new Map(
    previous.map(
      (item) => [item.i, item]
    )
  );

  return next.some((item) => {

    const original =
      previousById.get(item.i);

    return (
      !original ||
      original.x !== item.x ||
      original.y !== item.y ||
      original.w !== item.w ||
      original.h !== item.h
    );
  });
};


/* ============================================================
   12. MOVE / RESIZE CALCULATION

   Pointer 이동량을 16-column Grid 단위로 변환한다.

   Move:
   - x, y 변경

   Resize:
   - x, y, w, h 변경

   모든 방향에서 최소 크기와 가로 경계를 제한한다.
============================================================ */

const calculateInteractionLayout = (
  session: EditInteraction,
  clientX: number,
  clientY: number,
  canvas: HTMLDivElement
): GridLayoutItem[] => {

  const rect =
    canvas.getBoundingClientRect();

  // Canvas 기준 좌표를 사용한다.
  // Preview의 CSS Scale 및 세로 스크롤도 고려한다.
  const pointerX =
    (clientX - rect.left) /
    session.scaleX;

  const pointerY =
    (clientY - rect.top) /
    session.scaleY;

  const deltaColumns = Math.round(
    (
      pointerX -
      session.startPointerX
    ) / session.columnStep
  );

  const deltaRows = Math.round(
    (
      pointerY -
      session.startPointerY
    ) / session.rowStep
  );

  const start = session.startItem;

  let nextItem: GridLayoutItem = {
    ...start,
  };


  /* ----------------------------------------------------------
     A. MOVE
  ---------------------------------------------------------- */

  if (session.mode === "move") {

    nextItem.x = clamp(
      start.x + deltaColumns,
      0,
      GRID_COLUMNS - start.w
    );

    nextItem.y = Math.max(
      0,
      start.y + deltaRows
    );

  } else {

    /* --------------------------------------------------------
       B. RESIZE
    -------------------------------------------------------- */

    const handle =
      session.handle ?? "se";

    const minW =
      start.minW ?? 2;

    const minH =
      start.minH ?? 3;

    const maxW =
      start.maxW ?? GRID_COLUMNS;

    const maxH =
      start.maxH ?? Infinity;

    let x = start.x;
    let y = start.y;
    let w = start.w;
    let h = start.h;


    // EAST — 오른쪽 경계 Resize
    if (handle.includes("e")) {

      w = clamp(
        start.w + deltaColumns,
        minW,
        Math.min(
          maxW,
          GRID_COLUMNS - start.x
        )
      );
    }


    // SOUTH — 아래쪽 Resize
    if (handle.includes("s")) {

      h = clamp(
        start.h + deltaRows,
        minH,
        maxH
      );
    }


    // WEST — 왼쪽 경계 Resize
    if (handle.includes("w")) {

      const leftDelta = clamp(
        deltaColumns,

        Math.max(
          -start.x,
          start.w - maxW
        ),

        start.w - minW
      );

      x = start.x + leftDelta;
      w = start.w - leftDelta;
    }


    // NORTH — 위쪽 Resize
    if (handle.includes("n")) {

      const topDelta = clamp(
        deltaRows,

        Math.max(
          -start.y,
          start.h - maxH
        ),

        start.h - minH
      );

      y = start.y + topDelta;
      h = start.h - topDelta;
    }

    nextItem = {
      ...start,

      x,
      y,
      w,
      h,
    };
  }


  /* ----------------------------------------------------------
     C. FINAL VALIDATION / REFLOW

     변경된 위젯을 우선으로 두고
     주변 위젯의 충돌을 정리한다.
  ---------------------------------------------------------- */

  const normalizedItem =
    normalizeLayoutItem(nextItem);

  if (
    normalizedItem.x === start.x &&
    normalizedItem.y === start.y &&
    normalizedItem.w === start.w &&
    normalizedItem.h === start.h
  ) {
    return session.startLayout;
  }

  const replacedLayout =
    session.startLayout.map((item) => {

      return item.i === normalizedItem.i
        ? normalizedItem
        : item;
    });

  return stackLayout(
    replacedLayout,
    session.widgetId
  );
};


/* ============================================================
   13. POINTER CAPTURE CLEANUP

   마우스가 위젯 바깥으로 이동하더라도
   PointerUp 이벤트를 받을 수 있도록 Capture를 사용한다.

   작업 종료 및 취소 시 Capture를 해제한다.
============================================================ */

const releaseInteractionPointer = (
  session: EditInteraction
) => {

  const target = session.captureTarget;

  try {
    if (
      target.hasPointerCapture(
        session.pointerId
      )
    ) {
      target.releasePointerCapture(
        session.pointerId
      );
    }
  } catch {
    // 이미 Pointer가 해제된 경우 무시
  }
};


/* ============================================================
   14. DASHBOARD CANVAS

   실제 위젯 배치 및 편집 엔진.

   DashboardGrid는 Workspace 전환을 관리하고,
   이 컴포넌트는 해당 Workspace의 Grid만 담당한다.
============================================================ */

const DashboardCanvas = ({
  editMode,

  layoutMode,
  activeTab,

  onLayoutsChange,
  onAddWidget,
  onRemoveWidget,
  onEditValidationChange,

}: DashboardGridProps) => {

  /* ----------------------------------------------------------
     A. REFS / STATES
  ---------------------------------------------------------- */

  const gridWidthRef =
    useRef<HTMLDivElement | null>(null);

  const interactionRef =
    useRef<EditInteraction | null>(null);

  // 1200px 또는 280px 등의 임의 초기 너비를 사용하지 않는다.
  const [width, setWidth] =
    useState(0);

  const [
    selectedWidgetId,
    setSelectedWidgetId,
  ] = useState<WidgetId | null>(null);

  const [
    draftLayout,
    setDraftLayout,
  ] = useState<DraftLayout | null>(null);


  /* ----------------------------------------------------------
     B. GRID METRICS

     실제 Canvas 너비를 기준으로 Breakpoint를 결정한다.
  ---------------------------------------------------------- */

  const currentBreakpoint =
    getBreakpoint(width);

  const rowHeight =
    GRID_SETTINGS[layoutMode].rowHeight;

  const preferredGap =
    readDashboardWidgetGap();

  // 극단적으로 좁은 화면에서도 Gap의 합이
  // 사용 가능한 전체 너비를 초과하지 않도록 제한한다.
  const gridGap = width > 0
    ? Math.min(
        preferredGap,
        Math.max(
          0,
          Math.floor(
            (width - GRID_COLUMNS) /
            (GRID_COLUMNS - 1)
          )
        )
      )
    : preferredGap;


  /* ----------------------------------------------------------
     C. CANCEL EDIT INTERACTION

     PointerCancel / Window Blur / 화면 변경 시
     완료되지 않은 편집을 취소한다.
  ---------------------------------------------------------- */

  const cancelInteraction = useCallback(() => {

    const session = interactionRef.current;

    if (!session) return;

    interactionRef.current = null;

    releaseInteractionPointer(session);

    setDraftLayout(null);

  }, []);


  /* ----------------------------------------------------------
     D. MEASURE REAL CANVAS WIDTH

     ★ 가로 영역 이탈 해결의 핵심 ★

     Window 전체가 아닌 실제 위젯 배치 영역을 측정한다.

     다음 경우 자동으로 너비를 재계산한다.
     - Tauri Window Resize
     - Sidebar 확장 / 축소
     - 웹 화면 크기 변경
  ---------------------------------------------------------- */

  useLayoutEffect(() => {

    const canvas = gridWidthRef.current;

    if (!canvas) return;

    const measureWidth = () => {

      const style =
        window.getComputedStyle(canvas);

      const paddingLeft =
        Number.parseFloat(
          style.paddingLeft
        ) || 0;

      const paddingRight =
        Number.parseFloat(
          style.paddingRight
        ) || 0;

      const nextWidth = Math.max(
        0,
        Math.floor(
          canvas.clientWidth -
          paddingLeft -
          paddingRight
        )
      );

      const session =
        interactionRef.current;

      // 조작 중 Canvas 크기가 변경되면
      // 이전 Grid 단위로 계산하지 않고 작업을 취소한다.
      if (
        session &&
        session.canvasWidth !== nextWidth
      ) {
        cancelInteraction();
      }

      setWidth((current) =>
        current === nextWidth
          ? current
          : nextWidth
      );
    };

    measureWidth();

    const observer = new ResizeObserver(
      measureWidth
    );

    observer.observe(canvas);

    window.addEventListener(
      "resize",
      measureWidth
    );

    return () => {

      observer.disconnect();

      window.removeEventListener(
        "resize",
        measureWidth
      );
    };

  }, [cancelInteraction]);


  /* ----------------------------------------------------------
     E. ACTIVE WIDGET IDS

     기존 Focused Workspace의 위젯 구성은 유지한다.

     사용자 추가 위젯도 포함한다.
  ---------------------------------------------------------- */

  const focusedProfileId =
    getFocusedProfileId(activeTab);

  const activeWidgetIds = useMemo(() => {

    const configuredIds =
      Array.isArray(activeTab.widgetIds)
        ? [...new Set(activeTab.widgetIds)]
        : [];

    const focusedIds = focusedProfileId
      ? FOCUSED_WIDGETS_BY_TAB[
          focusedProfileId
        ]
      : undefined;

    // 일반 사용자 생성 Workspace
    if (!focusedIds) {
      return configuredIds;
    }

    const defaultIds = new Set(
      defaultDashboardTabs.find(
        (tab) =>
          tab.id === focusedProfileId
      )?.widgetIds ?? []
    );

    return configuredIds.filter(
      (widgetId) => (
        focusedIds.includes(widgetId) ||
        !defaultIds.has(widgetId)
      )
    );

  }, [
    activeTab.widgetIds,
    focusedProfileId,
  ]);


  /* ----------------------------------------------------------
     F. SAVED LAYOUT RESTORATION

     ★ 위젯 크기 저장 문제 해결의 핵심 ★

     사용자 저장값만 기준으로 복원한다.

     기존의 다음 로직은 제거한다.
     - COMPACT_HEIGHTS_BY_TAB
     - createCompactFocusedLayouts()
     - focusedLayouts
  ---------------------------------------------------------- */

  const savedLayout = useMemo(() => {

    return ensureLayoutForWidgets(
      activeTab.layouts[layoutMode]?.[
        currentBreakpoint
      ],

      activeWidgetIds,
      currentBreakpoint,
      layoutMode
    );

  }, [
    activeTab.layouts,
    activeWidgetIds,
    currentBreakpoint,
    layoutMode,
  ]);


  /* ----------------------------------------------------------
     G. DISPLAYED LAYOUT

     Edit에서 이동하거나 Resize하는 동안에만
     Draft를 표시한다.

     일반 모드와 편집 모드의 기본 배치는 동일하다.
  ---------------------------------------------------------- */

  const displayedLayout =
    editMode &&
    draftLayout?.breakpoint ===
      currentBreakpoint

      ? draftLayout.items

      : savedLayout;


  /* ----------------------------------------------------------
     H. HIDDEN WIDGETS / COLLISION VALIDATION
  ---------------------------------------------------------- */

  const hiddenWidgetIds = useMemo(() => {

    return (allWidgetIds as WidgetId[])
      .filter(
        (widgetId) =>
          !activeTab.widgetIds.includes(
            widgetId
          )
      );

  }, [activeTab.widgetIds]);


  const collidingWidgetIds = useMemo(() => {

    return editMode
      ? getCollidingWidgetIds(
          displayedLayout
        )
      : [];

  }, [
    editMode,
    displayedLayout,
  ]);


  const collidingSet = useMemo(
    () => new Set(collidingWidgetIds),
    [collidingWidgetIds]
  );


  useEffect(() => {

    onEditValidationChange?.({
      hasCollision:
        collidingWidgetIds.length > 0,

      collidingWidgetIds,
    });

  }, [
    collidingWidgetIds,
    onEditValidationChange,
  ]);


  /* ----------------------------------------------------------
     I. COMMIT FINAL LAYOUT

     현재 Breakpoint의 편집 결과만 저장한다.

     예:
     Laptop의 md 배치를 변경하면
     Laptop의 lg / sm 좌표는 수정하지 않는다.

     Wide 배치도 수정하지 않는다.
  ---------------------------------------------------------- */

  const saveInteractionLayout = useCallback(

    (
      session: EditInteraction,
      finalLayout: GridLayoutItem[]
    ) => {

      if (
        !hasLayoutChanged(
          session.startLayout,
          finalLayout
        )
      ) {
        return;
      }

      const currentLayouts =
        activeTab.layouts[layoutMode];

      const previousBreakpointLayout =
        currentLayouts[
          session.breakpoint
        ] ?? [];

      const configuredIds = new Set(
        activeTab.widgetIds
      );

      // 편집 중 삭제된 위젯이 저장 과정에서
      // 다시 나타나지 않도록 제한한다.
      const mergedLayout =
        mergeEditedLayout(
          previousBreakpointLayout,
          finalLayout
        ).filter(
          (item) =>
            configuredIds.has(item.i)
        );

      onLayoutsChange(layoutMode, {

        // 다른 Breakpoint는 원래 저장값 유지
        ...currentLayouts,

        // 현재 수정한 Breakpoint만 저장
        [session.breakpoint]:
          mergedLayout,
      });
    },

    [
      activeTab.layouts,
      activeTab.widgetIds,
      layoutMode,
      onLayoutsChange,
    ]
  );


  /* ----------------------------------------------------------
     J. GLOBAL POINTER EVENTS

     Pointer 이벤트만 사용한다.

     기존 PointerMove / MouseMove 중복을 제거한다.

     중요한 점:
     PointerUp의 실제 좌표로 최종 Layout을 계산한다.
  ---------------------------------------------------------- */

  useEffect(() => {

    const handlePointerMove = (
      event: PointerEvent
    ) => {

      const session =
        interactionRef.current;

      const canvas =
        gridWidthRef.current;

      if (!session || !canvas) return;

      if (
        event.pointerId !==
        session.pointerId
      ) {
        return;
      }

      if (!editMode) {
        cancelInteraction();
        return;
      }

      event.preventDefault();

      const nextLayout =
        calculateInteractionLayout(
          session,

          event.clientX,
          event.clientY,

          canvas
        );

      setDraftLayout({
        breakpoint:
          session.breakpoint,

        items: nextLayout,
      });
    };


    const handlePointerUp = (
      event: PointerEvent
    ) => {

      const session =
        interactionRef.current;

      const canvas =
        gridWidthRef.current;

      if (!session || !canvas) return;

      if (
        event.pointerId !==
        session.pointerId
      ) {
        return;
      }

      if (!editMode) {
        cancelInteraction();
        return;
      }

      /*
       * 마우스를 놓는 순간의 좌표로 계산한다.
       *
       * 마지막 PointerMove 이벤트가 늦거나
       * 누락되는 경우에도 최종 위치를 반영한다.
       */

      const finalLayout =
        calculateInteractionLayout(
          session,

          event.clientX,
          event.clientY,

          canvas
        );

      interactionRef.current = null;

      releaseInteractionPointer(session);

      try {

        saveInteractionLayout(
          session,
          finalLayout
        );

      } finally {

        setDraftLayout(null);
      }
    };


    const handlePointerCancel = (
      event: PointerEvent
    ) => {

      if (
        interactionRef.current?.pointerId
          !== event.pointerId
      ) {
        return;
      }

      // 취소된 작업은 저장하지 않는다.
      cancelInteraction();
    };


    const handleWindowBlur = () => {
      cancelInteraction();
    };


    window.addEventListener(
      "pointermove",
      handlePointerMove,
      {
        capture: true,
        passive: false,
      }
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp,
      true
    );

    window.addEventListener(
      "pointercancel",
      handlePointerCancel,
      true
    );

    window.addEventListener(
      "blur",
      handleWindowBlur
    );


    return () => {

      window.removeEventListener(
        "pointermove",
        handlePointerMove,
        true
      );

      window.removeEventListener(
        "pointerup",
        handlePointerUp,
        true
      );

      window.removeEventListener(
        "pointercancel",
        handlePointerCancel,
        true
      );

      window.removeEventListener(
        "blur",
        handleWindowBlur
      );
    };

  }, [
    editMode,
    cancelInteraction,
    saveInteractionLayout,
  ]);


  /* Edit가 종료되었을 때 남은 작업을 정리한다. */

  useEffect(() => {

    if (!editMode) {
      cancelInteraction();
    }

  }, [
    editMode,
    cancelInteraction,
  ]);


  /* Workspace가 변경되거나 Grid가 Unmount될 경우 */

  useEffect(() => {

    return () => {

      const session =
        interactionRef.current;

      interactionRef.current = null;

      if (session) {
        releaseInteractionPointer(
          session
        );
      }
    };

  }, []);


  /* ----------------------------------------------------------
     K. BEGIN EDIT INTERACTION

     위젯을 처음 클릭하고 이동 / Resize를 시작한다.

     현재 표시 좌표와 Grid 단위를 저장하여
     조작 중에 계산 기준이 바뀌지 않도록 한다.
  ---------------------------------------------------------- */

  const beginEditInteraction = (

    mode: EditInteraction["mode"],

    widgetId: WidgetId,

    event: ReactPointerEvent<HTMLElement>,

    handle?: ResizeHandle

  ) => {

    if (!editMode) return;

    if (!event.isPrimary) return;

    if (event.button !== 0) return;

    if (interactionRef.current) return;

    if (width < GRID_COLUMNS) return;

    const canvas = gridWidthRef.current;

    if (!canvas) return;

    const startItem =
      displayedLayout.find(
        (item) => item.i === widgetId
      );

    if (!startItem) return;

    event.preventDefault();
    event.stopPropagation();


    // 실제 Column 너비 및 이동 단위
    const columnWidth = (
      width -
      gridGap * (GRID_COLUMNS - 1)
    ) / GRID_COLUMNS;

    const columnStep =
      columnWidth + gridGap;

    const rowStep =
      rowHeight + gridGap;


    // Web Preview의 Scale이 적용된 경우
    // Pointer 이동량의 단위를 보정한다.
    const rect =
      canvas.getBoundingClientRect();

    const scaleX =
      rect.width /
      Math.max(1, canvas.offsetWidth) || 1;

    const scaleY =
      rect.height /
      Math.max(1, canvas.offsetHeight) || 1;


    setSelectedWidgetId(widgetId);

    const captureTarget =
      event.currentTarget;

    interactionRef.current = {

      mode,
      widgetId,
      handle,

      breakpoint:
        currentBreakpoint,

      pointerId:
        event.pointerId,

      captureTarget,

      canvasWidth: width,

      startPointerX:
        (event.clientX - rect.left) /
        scaleX,

      startPointerY:
        (event.clientY - rect.top) /
        scaleY,

      scaleX,
      scaleY,

      columnStep,
      rowStep,

      startItem: {
        ...startItem,
      },

      startLayout:
        displayedLayout.map(
          (item) => ({ ...item })
        ),
    };

    // 위젯을 벗어나더라도 PointerUp을 추적한다.
    try {

      captureTarget.setPointerCapture(
        event.pointerId
      );

    } catch {
      // Capture 실패 시 Window Event로 추적한다.
    }

    setDraftLayout({
      breakpoint: currentBreakpoint,

      items: displayedLayout,
    });
  };


  /* ----------------------------------------------------------
     L. LOST POINTER CAPTURE

     운영체제 또는 다른 요소에 의해 Capture가
     강제로 해제되면 현재 작업을 취소한다.
  ---------------------------------------------------------- */

  const handleLostPointerCapture = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {

    if (
      interactionRef.current?.pointerId
        !== event.pointerId
    ) {
      return;
    }

    cancelInteraction();
  };


  /* ----------------------------------------------------------
     M. CSS GRID VARIABLES

     연결: src/styles/dashboard-grid.css

     Grid의 실제 숫자와 CSS 배경 격자가
     서로 일치하도록 CSS 변수로 전달한다.
  ---------------------------------------------------------- */

  const canvasStyle = {

    "--gd-grid-row-height":
      `${rowHeight}px`,

    "--gd-grid-gap":
      `${gridGap}px`,

    "--gd-grid-min-height":
      `${
        INITIAL_VISIBLE_ROWS * rowHeight +
        (INITIAL_VISIBLE_ROWS - 1) * gridGap
      }px`,

  } as CSSProperties;


  /* ==========================================================
     N. DASHBOARD UI
  ========================================================== */

  return (
    <div
      className={[
        "dashboard-tab-space",

        editMode
          ? "is-editing"
          : "",
      ].filter(Boolean).join(" ")}
    >

      {/* ======================================================
          O. WORKSPACE HEADER
      ====================================================== */}

      <div className="dashboard-tab-header">

        <div>

          <div className="text-xs font-bold text-muted-foreground uppercase tracking-[0.18em]">
            Workspace
          </div>

          <h2 className="text-xl font-semibold tracking-tight">
            {activeTab.icon} {activeTab.label}
          </h2>

        </div>


        {editMode && (

          <div
            className={[
              "edit-status-pill",

              collidingWidgetIds.length > 0
                ? "is-danger"
                : "",
            ].filter(Boolean).join(" ")}
          >

            {collidingWidgetIds.length > 0
              ? "Rearranging widgets"
              : "16-column grid - move & resize"}

          </div>
        )}

      </div>


      {/* ======================================================
          P. WIDGET PICKER

          현재 Workspace에 없는 위젯을 추가한다.
      ====================================================== */}

      {editMode && hiddenWidgetIds.length > 0 && (

        <div className="widget-picker-panel">

          <div className="text-xs font-bold text-muted-foreground">
            Add widgets
          </div>

          <div className="flex flex-wrap gap-2">

            {hiddenWidgetIds.map((widgetId) => {

              const widget =
                safeWidgetRegistry[widgetId];

              return (
                <button
                  key={widgetId}

                  type="button"

                  className="widget-picker-button"

                  onClick={() => {
                    cancelInteraction();
                    onAddWidget(widgetId);
                  }}
                >

                  <strong>
                    {widget?.label ?? widgetId}
                  </strong>

                  <span>
                    {widget?.description ??
                      "Add widget"}
                  </span>

                </button>
              );
            })}

          </div>

        </div>
      )}


      {/* Edit 안내 */}

      {editMode && (

        <div className="edit-grid-help">

          Drag a widget to move it.
          Drag an edge or corner to resize.
          Changes are saved when you release
          the pointer.

        </div>
      )}


      {/* ======================================================
          Q. DASHBOARD CANVAS

          실제 화면 너비를 측정하는 요소.

          GridLayout은 측정이 완료된 후 렌더링한다.
      ====================================================== */}

      <div
        ref={gridWidthRef}

        className={[
          "dashboard-edit-canvas",

          editMode
            ? "is-editing"
            : "",
        ].filter(Boolean).join(" ")}

        style={canvasStyle}

        onLostPointerCapture={
          handleLostPointerCapture
        }
      >

        {/* `margin` below is the outer gap between grid items, separate from
            each widget's shared header/body padding. */}
        {width >= GRID_COLUMNS && (
          <GridLayout

            className="layout dashboard-rgl"

            layout={displayedLayout}

            width={width}

            cols={GRID_COLUMNS}

            rowHeight={rowHeight}

            margin={[
              gridGap,
              gridGap,
            ]}

            containerPadding={[0, 0]}

            autoSize={true}

            /*
             * React Grid Layout은 배치만 담당한다.
             *
             * 이동 및 Resize는 Glassday에서 직접 처리하므로
             * 라이브러리의 기본 편집 기능을 비활성화한다.
             */

            isDraggable={false}

            isResizable={false}

            isBounded={true}

            /*
             * 라이브러리가 사용자의 저장 좌표를
             * 수직 압축으로 다시 변경하지 않도록 한다.
             */

            compactType={null}

            preventCollision={false}

            allowOverlap={false}
          >

            {activeWidgetIds.map((widgetId) => {

              const isSelected =
                editMode &&
                selectedWidgetId === widgetId;

              const isColliding =
                collidingSet.has(widgetId);

              const widget =
                safeWidgetRegistry[widgetId];

              return (
                <div
                  key={widgetId}

                  className={[
                    "dashboard-grid-item",

                    editMode
                      ? "is-editing"
                      : "",

                    isSelected
                      ? "is-selected"
                      : "",

                    isColliding
                      ? "is-colliding"
                      : "",
                  ].filter(Boolean).join(" ")}

                  onPointerDownCapture={(event) => {

                    if (!editMode) return;

                    const target =
                      event.target as Element;

                    if (
                      target.closest(
                        ".widget-remove-button"
                      ) ||

                      target.closest(
                        ".react-resizable-handle"
                      )
                    ) {
                      return;
                    }

                    setSelectedWidgetId(
                      widgetId
                    );
                  }}
                >

                  {/* ==========================================
                      R. EDIT MODE OVERLAY

                      별도 외부 Wrapper 없이
                      기존 Grid Item 안에 배치한다.
                  ========================================== */}

                  {editMode && (
                    <>

                      {/* 이동 영역 */}

                      <div
                        className="widget-move-surface"

                        aria-hidden="true"

                        onPointerDown={(event) =>
                          beginEditInteraction(
                            "move",
                            widgetId,
                            event
                          )
                        }
                      />


                      {/* 8방향 Resize Handles */}

                      {RESIZE_HANDLES.map(
                        (handle) => (

                          <span
                            key={handle}

                            className={
                              `react-resizable-handle react-resizable-handle-${handle}`
                            }

                            aria-hidden="true"

                            onPointerDown={(event) =>
                              beginEditInteraction(
                                "resize",
                                widgetId,
                                event,
                                handle
                              )
                            }
                          />
                        )
                      )}


                      {/* 위젯 이름 */}

                      <div className="widget-edit-label">

                        {widget?.label ??
                          widgetId}

                      </div>


                      {/* Workspace에서 위젯 제거 */}

                      <button
                        type="button"

                        className="widget-remove-button"

                        title="Remove widget"

                        aria-label={
                          `Remove ${widget?.label ?? widgetId}`
                        }

                        onClick={(event) => {

                          event.stopPropagation();

                          cancelInteraction();

                          onRemoveWidget(widgetId);
                        }}
                      >
                        ×
                      </button>

                    </>
                  )}


                  {/* ==========================================
                      S. SHARED WIDGET INSTANCE

                      WidgetRenderer에서 생성한
                      기존 Widget Instance를 표시한다.

                      각 위젯의 내부 상태 및 데이터는
                      DashboardGrid가 직접 관리하지 않는다.
                  ========================================== */}

                  <WidgetSlot
                    widgetId={widgetId}
                    editMode={editMode}
                  />

                </div>
              );
            })}

          </GridLayout>
        )}

      </div>

    </div>
  );
};


/* ============================================================
   15. DASHBOARD GRID ENTRY POINT

   Diary Workspace와 일반 Dashboard를 분리한다.

   Workspace 또는 Layout Mode가 바뀌면
   이전 Draft / Pointer / Selection을 재사용하지 않는다.

   WidgetRenderer의 데이터 관리 구조는 유지한다.
============================================================ */

export const DashboardGrid = (
  props: DashboardGridProps
) => {

  const {
    activeTab,
    layoutMode,
    onEditValidationChange,
  } = props;

  const isDiaryWorkspace =

    activeTab.id !== "memo" &&

    activeTab.label
      .trim()
      .toLowerCase() === "diary";


  useEffect(() => {

    if (isDiaryWorkspace) {

      onEditValidationChange?.({
        hasCollision: false,
        collidingWidgetIds: [],
      });
    }

  }, [
    isDiaryWorkspace,
    onEditValidationChange,
  ]);


  // Diary는 일반 Grid와 별개의 Workspace
  if (isDiaryWorkspace) {
    return <DiaryWorkspace />;
  }


  return (
    <DashboardCanvas

      key={`${activeTab.id}:${layoutMode}`}

      {...props}
    />
  );
};
