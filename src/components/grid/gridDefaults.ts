import type { Layouts } from "react-grid-layout";

export const defaultLayouts: Layouts = {
  lg: [
    { i: "today", x: 0, y: 0, w: 6, h: 5 },
    { i: "alerts", x: 6, y: 0, w: 6, h: 5 },
    { i: "calendar", x: 0, y: 5, w: 6, h: 5 },
    { i: "career", x: 6, y: 5, w: 6, h: 5 },
    { i: "memo", x: 0, y: 10, w: 6, h: 5 },
    { i: "study", x: 6, y: 10, w: 4, h: 4 },
    { i: "health", x: 10, y: 10, w: 2, h: 4 },
    { i: "money", x: 0, y: 15, w: 4, h: 4 },
    { i: "mood", x: 4, y: 15, w: 4, h: 4 },
  ],
  md: [
    { i: "today", x: 0, y: 0, w: 6, h: 5 },
    { i: "alerts", x: 6, y: 0, w: 6, h: 5 },
    { i: "calendar", x: 0, y: 5, w: 6, h: 5 },
    { i: "career", x: 6, y: 5, w: 6, h: 5 },
    { i: "memo", x: 0, y: 10, w: 6, h: 5 },
    { i: "study", x: 6, y: 10, w: 6, h: 4 },
    { i: "health", x: 0, y: 15, w: 6, h: 4 },
    { i: "money", x: 6, y: 15, w: 6, h: 4 },
    { i: "mood", x: 0, y: 19, w: 6, h: 4 },
  ],
  sm: [
    { i: "today", x: 0, y: 0, w: 4, h: 5 },
    { i: "alerts", x: 0, y: 5, w: 4, h: 5 },
    { i: "calendar", x: 0, y: 10, w: 4, h: 5 },
    { i: "career", x: 0, y: 15, w: 4, h: 5 },
    { i: "memo", x: 0, y: 20, w: 4, h: 5 },
    { i: "study", x: 0, y: 25, w: 4, h: 4 },
    { i: "health", x: 0, y: 29, w: 4, h: 4 },
    { i: "money", x: 0, y: 33, w: 4, h: 4 },
    { i: "mood", x: 0, y: 37, w: 4, h: 4 },
  ],
};