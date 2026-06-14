import type { Layout, Layouts } from "react-grid-layout";

export type WidgetId =
  | "today"
  | "calendar"
  | "memo"
  | "study"
  | "career"
  | "health"
  | "money"
  | "mood";

export const desktopLayout: Layout[] = [
  { i: "today", x: 0, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
  { i: "calendar", x: 4, y: 0, w: 8, h: 6, minW: 5, minH: 4 },
  { i: "memo", x: 0, y: 3, w: 4, h: 3, minW: 3, minH: 2 },
  { i: "study", x: 0, y: 6, w: 4, h: 3, minW: 3, minH: 2 },
  { i: "career", x: 4, y: 6, w: 4, h: 3, minW: 3, minH: 2 },
  { i: "health", x: 8, y: 6, w: 2, h: 3, minW: 2, minH: 2 },
  { i: "money", x: 10, y: 6, w: 2, h: 3, minW: 2, minH: 2 },
  { i: "mood", x: 0, y: 9, w: 4, h: 3, minW: 3, minH: 2 },
];

export const tabletLayout: Layout[] = [
  { i: "today", x: 0, y: 0, w: 6, h: 3, minW: 3, minH: 2 },
  { i: "calendar", x: 0, y: 3, w: 6, h: 5, minW: 4, minH: 3 },
  { i: "memo", x: 6, y: 0, w: 6, h: 3, minW: 3, minH: 2 },
  { i: "study", x: 6, y: 3, w: 6, h: 3, minW: 3, minH: 2 },
  { i: "career", x: 0, y: 8, w: 6, h: 3, minW: 3, minH: 2 },
  { i: "health", x: 6, y: 6, w: 3, h: 3, minW: 2, minH: 2 },
  { i: "money", x: 9, y: 6, w: 3, h: 3, minW: 2, minH: 2 },
  { i: "mood", x: 0, y: 11, w: 6, h: 3, minW: 3, minH: 2 },
];

export const mobileLayout: Layout[] = [
  { i: "today", x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
  { i: "calendar", x: 0, y: 3, w: 4, h: 5, minW: 2, minH: 3 },
  { i: "memo", x: 0, y: 8, w: 4, h: 3, minW: 2, minH: 2 },
  { i: "study", x: 0, y: 11, w: 4, h: 3, minW: 2, minH: 2 },
  { i: "career", x: 0, y: 14, w: 4, h: 3, minW: 2, minH: 2 },
  { i: "health", x: 0, y: 17, w: 4, h: 3, minW: 2, minH: 2 },
  { i: "money", x: 0, y: 20, w: 4, h: 3, minW: 2, minH: 2 },
  { i: "mood", x: 0, y: 23, w: 4, h: 3, minW: 2, minH: 2 },
];

export const defaultLayouts: Layouts = {
  lg: desktopLayout,
  md: tabletLayout,
  sm: mobileLayout,
};
