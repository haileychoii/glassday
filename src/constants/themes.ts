export type ThemeId = "pastel" | "glass" | "mac-core" | "pixel-desk";

export type ThemeOption = {
  id: ThemeId;
  label: string;
  description: string;
};

export const themeOptions: ThemeOption[] = [
  {
    id: "pastel",
    label: "Pastel",
    description: "Soft pastel glass theme",
  },
  {
    id: "glass",
    label: "Glass",
    description: "Dark cosmic glass theme",
  },
  {
    id: "mac-core",
    label: "Mac Core",
    description: "Cupertino macOS-inspired theme",
  },
  {
    id: "pixel-desk",
    label: "Pixel Desk",
    description: "Retro pixel desktop theme",
  },
];

const THEME_STORAGE_KEY = "glassday-theme";

const allThemeClasses = [
  "pastel",
  "glass",
  "mac-core",
  "pixel-desk",
  "ios",
  "mac",
  "pixel",
  "cloud",
  "night",

  "theme-pastel",
  "theme-glass",
  "theme-mac-core",
  "theme-pixel-desk",
  "theme-ios",
  "theme-mac",
  "theme-pixel",
  "theme-cloud",
  "theme-night",

  "theme_pastel",
  "theme_glass",
  "theme_mac_core",
  "theme_pixel_desk",
  "theme_ios",
  "theme_mac",
  "theme_pixel",
  "theme_cloud",
  "theme_night",
];

const normalizeTheme = (theme: unknown): ThemeId => {
  const value = String(theme ?? "pastel");

  if (value === "pastel") return "pastel";
  if (value === "glass") return "glass";
  if (value === "mac-core") return "mac-core";
  if (value === "pixel-desk") return "pixel-desk";

  if (value === "ios") return "mac-core";
  if (value === "mac") return "mac-core";
  if (value === "pixel") return "pixel-desk";

  return "pastel";
};

export const getCurrentTheme = (): ThemeId => {
  if (typeof window === "undefined") return "pastel";

  return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
};

export const applyTheme = (theme: ThemeId) => {
  if (typeof document === "undefined") return;

  const nextTheme = normalizeTheme(theme);
  const root = document.documentElement;
  const body = document.body;

  root.classList.remove(...allThemeClasses);
  body.classList.remove(...allThemeClasses);

  root.setAttribute("data-theme", nextTheme);
  root.setAttribute("data-theme-id", nextTheme);
  body.setAttribute("data-theme", nextTheme);
  body.setAttribute("data-theme-id", nextTheme);

  root.classList.add(nextTheme, `theme-${nextTheme}`);
  body.classList.add(nextTheme, `theme-${nextTheme}`);

  if (nextTheme === "mac-core") {
    root.classList.add("theme-ios", "ios", "mac");
    body.classList.add("theme-ios", "ios", "mac");
  }

  if (nextTheme === "pixel-desk") {
    root.classList.add("theme-pixel", "pixel");
    body.classList.add("theme-pixel", "pixel");
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
};