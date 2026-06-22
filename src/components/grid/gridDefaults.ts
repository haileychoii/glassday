import type { Layouts } from "../../types/workspace";

export const defaultLayouts: Layouts = {
  lg: [
    { i: "today", x: 0, y: 0, w: 4, h: 4 },
    { i: "alerts", x: 4, y: 0, w: 4, h: 4 },
    { i: "calendar", x: 8, y: 0, w: 8, h: 6 },

    { i: "career", x: 0, y: 4, w: 8, h: 7 },
    { i: "study", x: 8, y: 6, w: 8, h: 7 },

    { i: "memo", x: 0, y: 11, w: 8, h: 6 },
    { i: "journal", x: 8, y: 13, w: 8, h: 7 },

    { i: "health", x: 0, y: 17, w: 5, h: 5 },
    { i: "money", x: 5, y: 17, w: 5, h: 5 },
    { i: "mood", x: 10, y: 20, w: 6, h: 5 },
  ],

  md: [
    { i: "today", x: 0, y: 0, w: 8, h: 4 },
    { i: "alerts", x: 8, y: 0, w: 8, h: 4 },

    { i: "calendar", x: 0, y: 4, w: 16, h: 6 },

    { i: "career", x: 0, y: 10, w: 8, h: 7 },
    { i: "study", x: 8, y: 10, w: 8, h: 7 },

    { i: "memo", x: 0, y: 17, w: 8, h: 6 },
    { i: "journal", x: 8, y: 17, w: 8, h: 7 },

    { i: "health", x: 0, y: 24, w: 8, h: 5 },
    { i: "money", x: 8, y: 24, w: 8, h: 5 },
    { i: "mood", x: 0, y: 29, w: 16, h: 5 },
  ],

  sm: [
    { i: "today", x: 0, y: 0, w: 16, h: 4 },
    { i: "alerts", x: 0, y: 4, w: 16, h: 4 },

    { i: "calendar", x: 0, y: 8, w: 16, h: 6 },

    { i: "career", x: 0, y: 14, w: 16, h: 7 },
    { i: "study", x: 0, y: 21, w: 16, h: 7 },

    { i: "memo", x: 0, y: 28, w: 16, h: 6 },
    { i: "journal", x: 0, y: 34, w: 16, h: 8 },

    { i: "health", x: 0, y: 42, w: 16, h: 5 },
    { i: "money", x: 0, y: 47, w: 16, h: 5 },
    { i: "mood", x: 0, y: 52, w: 16, h: 5 },
  ],
};