import type { Layouts } from "../../types/workspace";

export const defaultLayouts: Layouts = {
  lg: [
    { i: "today", x: 0, y: 0, w: 8, h: 8 },
    { i: "alerts", x: 8, y: 0, w: 8, h: 8 },

    { i: "journal", x: 0, y: 8, w: 8, h: 26 },
    { i: "calendar", x: 8, y: 8, w: 8, h: 10 },

    { i: "career", x: 8, y: 18, w: 8, h: 8 },
    { i: "memo", x: 0, y: 26, w: 8, h: 12 },

    { i: "study", x: 8, y: 26, w: 8, h: 12 },

    { i: "health", x: 0, y: 37, w: 4, h: 6 },
    { i: "money", x: 4, y: 37, w: 4, h: 6 },
    { i: "mood", x: 8, y: 38, w: 4, h: 6 },
  ],

  md: [
    { i: "today", x: 0, y: 0, w: 8, h: 8 },
    { i: "alerts", x: 8, y: 0, w: 8, h: 8 },

    { i: "journal", x: 0, y: 8, w: 8, h: 26 },
    { i: "calendar", x: 8, y: 8, w: 8, h: 10 },

    { i: "career", x: 8, y: 18, w: 8, h: 8 },
    { i: "memo", x: 0, y: 26, w: 8, h: 12 },

    { i: "study", x: 8, y: 26, w: 8, h: 12 },

    { i: "health", x: 0, y: 37, w: 4, h: 6 },
    { i: "money", x: 4, y: 37, w: 4, h: 6 },
    { i: "mood", x: 8, y: 38, w: 4, h: 6 },
  ],

  sm: [
  { i: "today", x: 0, y: 0, w: 16, h: 10 },
  { i: "alerts", x: 0, y: 10, w: 16, h: 10 },
  { i: "journal", x: 0, y: 20, w: 16, h: 26 },
  { i: "calendar", x: 0, y: 46, w: 16, h: 12 },
  { i: "career", x: 0, y: 58, w: 16, h: 10 },
  { i: "memo", x: 0, y: 68, w: 16, h: 14 },
  { i: "study", x: 0, y: 82, w: 16, h: 14 },
  { i: "health", x: 0, y: 96, w: 16, h: 8 },
  { i: "money", x: 0, y: 104, w: 16, h: 8 },
  { i: "mood", x: 0, y: 112, w: 16, h: 8 },
],
};
