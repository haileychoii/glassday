import type { Layouts } from "../../types/workspace";

export const defaultLayouts: Layouts = {
  lg: [
    { i: "today", x: 0, y: 0, w: 8, h: 10 },
    { i: "alerts", x: 8, y: 0, w: 8, h: 10 },

    { i: "journal", x: 0, y: 10, w: 8, h: 32 },
    { i: "calendar", x: 8, y: 10, w: 8, h: 14 },

    { i: "career", x: 8, y: 24, w: 8, h: 12 },
    { i: "memo", x: 8, y: 36, w: 8, h: 16 },

    { i: "study", x: 0, y: 42, w: 8, h: 18 },

    { i: "health", x: 8, y: 52, w: 4, h: 8 },
    { i: "money", x: 12, y: 52, w: 4, h: 8 },
    { i: "mood", x: 0, y: 60, w: 8, h: 8 },
  ],

  md: [
    { i: "today", x: 0, y: 0, w: 8, h: 10 },
    { i: "alerts", x: 8, y: 0, w: 8, h: 10 },

    { i: "journal", x: 0, y: 10, w: 8, h: 32 },
    { i: "calendar", x: 8, y: 10, w: 8, h: 14 },

    { i: "career", x: 8, y: 24, w: 8, h: 12 },
    { i: "memo", x: 8, y: 36, w: 8, h: 16 },

    { i: "study", x: 0, y: 42, w: 8, h: 18 },

    { i: "health", x: 8, y: 52, w: 4, h: 8 },
    { i: "money", x: 12, y: 52, w: 4, h: 8 },
    { i: "mood", x: 0, y: 60, w: 8, h: 8 },
  ],

  sm: [
    { i: "today", x: 0, y: 0, w: 16, h: 12 },
    { i: "alerts", x: 0, y: 12, w: 16, h: 11 },
    { i: "journal", x: 0, y: 23, w: 16, h: 34 },
    { i: "calendar", x: 0, y: 57, w: 16, h: 14 },
    { i: "career", x: 0, y: 71, w: 16, h: 12 },
    { i: "memo", x: 0, y: 83, w: 16, h: 16 },
    { i: "study", x: 0, y: 99, w: 16, h: 18 },
    { i: "health", x: 0, y: 117, w: 16, h: 9 },
    { i: "money", x: 0, y: 126, w: 16, h: 9 },
    { i: "mood", x: 0, y: 135, w: 16, h: 9 },
  ],
};
