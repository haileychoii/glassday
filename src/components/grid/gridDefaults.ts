import type { Layouts } from "react-grid-layout";

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
    { i: "today", x: 0, y: 0, w: 16, h: 8 },
    { i: "alerts", x: 0, y: 8, w: 16, h: 9 },
    { i: "journal", x: 0, y: 17, w: 16, h: 20 },
    { i: "calendar", x: 0, y: 37, w: 16, h: 10 },
    { i: "career", x: 0, y: 47, w: 16, h: 8 },
    { i: "memo", x: 0, y: 55, w: 16, h: 11 },
    { i: "study", x: 0, y: 66, w: 16, h: 12 },
    { i: "health", x: 0, y: 78, w: 16, h: 6 },
    { i: "money", x: 0, y: 84, w: 16, h: 6 },
    { i: "mood", x: 0, y: 90, w: 16, h: 6 },
  ],
};