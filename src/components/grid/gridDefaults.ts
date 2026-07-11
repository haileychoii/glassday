import type { DashboardLayoutMode, Layouts } from "../../types/workspace";

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
      i: "health",
      x: 0,
      y: 119,
      w: 16,
      h: 9,
    },

    {
      i: "money",
      x: 0,
      y: 128,
      w: 16,
      h: 9,
    },

    {
      i: "mood",
      x: 0,
      y: 137,
      w: 16,
      h: 9,
    },
  ],
};

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
  ],
  sm: [
    { i: "today", x: 0, y: 0, w: 16, h: 10 },
    { i: "alerts", x: 0, y: 10, w: 16, h: 10 },
    { i: "journal", x: 0, y: 20, w: 16, h: 28 },
    { i: "calendar", x: 0, y: 48, w: 16, h: 14, minW: 4, minH: 6 },
    { i: "study", x: 0, y: 62, w: 16, h: 15 },
    { i: "career", x: 0, y: 77, w: 16, h: 11 },
    { i: "memo", x: 0, y: 88, w: 16, h: 15 },
    { i: "health", x: 0, y: 103, w: 16, h: 8 },
    { i: "money", x: 0, y: 111, w: 16, h: 8 },
    { i: "mood", x: 0, y: 119, w: 16, h: 8 },
  ],
};

export const defaultLayoutsByMode: Record<DashboardLayoutMode, Layouts> = {
  wide: wideDefaultLayouts,
  laptop: laptopDefaultLayouts,
};

export const defaultLayouts = wideDefaultLayouts;
