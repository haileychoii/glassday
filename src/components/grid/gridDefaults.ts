/**
 * ============================================================
 * [Figma Mapping] Dashboard / Default Grid Layouts
 * ============================================================
 *
 * 역할:
 * - 처음 생성되는 Workspace와 누락 위젯이 사용할 16-column 기본 좌표다.
 * - Wide와 Laptop은 별도 layout이며 서로의 사용자 편집 결과를 덮어쓰지 않는다.
 *
 * 연결 관계:
 * - Renderer: `src/components/grid/DashboardGrid.tsx`
 * - Tab defaults: `src/constants/dashboardTabs.ts`
 * - Persisted copy: `src/hooks/useDashboardTabs.ts`
 * - Item type: `src/types/workspace.ts#GridLayoutItem`
 *
 * Figma 변환:
 * - 각 breakpoint 배열은 하나의 Layout Variant다.
 * - x/w는 16-column 기준, y/h는 DashboardGrid의 rowHeight/gap 기준이다.
 *
 * 수정 주의:
 * - `i`는 `widgetRegistry` 및 `widgetMap` key와 반드시 일치해야 한다.
 * - 값 변경은 신규/초기화 layout에만 적용되며 기존 사용자 저장값은 유지된다.
 * ============================================================
 */
import type { DashboardLayoutMode, Layouts } from "../../types/workspace";

/** Wide Web 기본 배치: viewport를 채우는 Dashboard Canvas용 layout. */
export const wideDefaultLayouts: Layouts = {
  lg: [
    {
      i: "today",
      x: 0,
      y: 0,
      w: 8,
      h: 10,
    },
    {
      i: "alerts",
      x: 8,
      y: 0,
      w: 8,
      h: 10,
    },

    {
      i: "journal",
      x: 0,
      y: 10,
      w: 8,
      h: 32,
    },

    {
      i: "calendar",
      x: 8,
      y: 10,
      w: 8,
      h: 16,
      minW: 4,
      minH: 6,
    },

    {
      i: "career",
      x: 8,
      y: 26,
      w: 8,
      h: 12,
    },

    {
      i: "memo",
      x: 8,
      y: 38,
      w: 8,
      h: 16,
    },

    {
      i: "study",
      x: 0,
      y: 42,
      w: 8,
      h: 18,
    },
    {
      i: "timer",
      x: 8,
      y: 60,
      w: 8,
      h: 8,
    },

    {
      i: "health",
      x: 8,
      y: 54,
      w: 4,
      h: 8,
    },

    {
      i: "money",
      x: 12,
      y: 54,
      w: 4,
      h: 8,
    },

    {
      i: "mood",
      x: 0,
      y: 60,
      w: 8,
      h: 8,
    },
  ],

  md: [
    {
      i: "today",
      x: 0,
      y: 0,
      w: 8,
      h: 10,
    },
    {
      i: "alerts",
      x: 8,
      y: 0,
      w: 8,
      h: 10,
    },

    {
      i: "journal",
      x: 0,
      y: 10,
      w: 8,
      h: 32,
    },

    {
      i: "calendar",
      x: 8,
      y: 10,
      w: 8,
      h: 16,
      minW: 4,
      minH: 6,
    },

    {
      i: "career",
      x: 8,
      y: 26,
      w: 8,
      h: 12,
    },

    {
      i: "memo",
      x: 8,
      y: 38,
      w: 8,
      h: 16,
    },

    {
      i: "study",
      x: 0,
      y: 42,
      w: 8,
      h: 18,
    },
    {
      i: "timer",
      x: 8,
      y: 60,
      w: 8,
      h: 8,
    },

    {
      i: "health",
      x: 8,
      y: 54,
      w: 4,
      h: 8,
    },

    {
      i: "money",
      x: 12,
      y: 54,
      w: 4,
      h: 8,
    },

    {
      i: "mood",
      x: 0,
      y: 60,
      w: 8,
      h: 8,
    },
  ],

  sm: [
    {
      i: "today",
      x: 0,
      y: 0,
      w: 16,
      h: 12,
    },

    {
      i: "alerts",
      x: 0,
      y: 12,
      w: 16,
      h: 11,
    },

    {
      i: "journal",
      x: 0,
      y: 23,
      w: 16,
      h: 34,
    },

    {
      i: "calendar",
      x: 0,
      y: 57,
      w: 16,
      h: 16,
      minW: 4,
      minH: 6,
    },

    {
      i: "career",
      x: 0,
      y: 73,
      w: 16,
      h: 12,
    },

    {
      i: "memo",
      x: 0,
      y: 85,
      w: 16,
      h: 16,
    },

    {
      i: "study",
      x: 0,
      y: 101,
      w: 16,
      h: 18,
    },
    {
      i: "timer",
      x: 0,
      y: 119,
      w: 16,
      h: 10,
    },

    {
      i: "health",
      x: 0,
      y: 129,
      w: 16,
      h: 9,
    },

    {
      i: "money",
      x: 0,
      y: 138,
      w: 16,
      h: 9,
    },

    {
      i: "mood",
      x: 0,
      y: 147,
      w: 16,
      h: 9,
    },
  ],
};

/** Laptop App 기본 배치: 고정 preview Frame 안의 조밀한 layout. */
export const laptopDefaultLayouts: Layouts = {
  lg: [
    { i: "today", x: 0, y: 0, w: 7, h: 9 },
    { i: "alerts", x: 7, y: 0, w: 9, h: 9 },
    { i: "journal", x: 0, y: 9, w: 8, h: 23 },
    { i: "calendar", x: 8, y: 9, w: 8, h: 13, minW: 4, minH: 6 },
    { i: "study", x: 8, y: 22, w: 8, h: 13 },
    { i: "career", x: 0, y: 32, w: 8, h: 11 },
    { i: "memo", x: 8, y: 35, w: 8, h: 14 },
    { i: "health", x: 0, y: 43, w: 4, h: 7 },
    { i: "money", x: 4, y: 43, w: 4, h: 7 },
    { i: "mood", x: 0, y: 50, w: 8, h: 7 },
    { i: "timer", x: 8, y: 49, w: 8, h: 8 },
  ],
  md: [
    { i: "today", x: 0, y: 0, w: 8, h: 9 },
    { i: "alerts", x: 8, y: 0, w: 8, h: 9 },
    { i: "journal", x: 0, y: 9, w: 8, h: 23 },
    { i: "calendar", x: 8, y: 9, w: 8, h: 13, minW: 4, minH: 6 },
    { i: "study", x: 8, y: 22, w: 8, h: 13 },
    { i: "career", x: 0, y: 32, w: 8, h: 11 },
    { i: "memo", x: 8, y: 35, w: 8, h: 14 },
    { i: "health", x: 0, y: 43, w: 8, h: 7 },
    { i: "money", x: 8, y: 49, w: 8, h: 7 },
    { i: "mood", x: 0, y: 50, w: 8, h: 7 },
    { i: "timer", x: 8, y: 56, w: 8, h: 8 },
  ],
  sm: [
    { i: "today", x: 0, y: 0, w: 16, h: 10 },
    { i: "alerts", x: 0, y: 10, w: 16, h: 10 },
    { i: "journal", x: 0, y: 20, w: 16, h: 28 },
    { i: "calendar", x: 0, y: 48, w: 16, h: 14, minW: 4, minH: 6 },
    { i: "study", x: 0, y: 62, w: 16, h: 15 },
    { i: "career", x: 0, y: 77, w: 16, h: 11 },
    { i: "memo", x: 0, y: 88, w: 16, h: 15 },
    { i: "timer", x: 0, y: 103, w: 16, h: 10 },
    { i: "health", x: 0, y: 113, w: 16, h: 8 },
    { i: "money", x: 0, y: 121, w: 16, h: 8 },
    { i: "mood", x: 0, y: 129, w: 16, h: 8 },
  ],
};

export const defaultLayoutsByMode: Record<DashboardLayoutMode, Layouts> = {
  wide: wideDefaultLayouts,
  laptop: laptopDefaultLayouts,
};

export const defaultLayouts = wideDefaultLayouts;
