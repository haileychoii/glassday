export type ThemeId = "pastel" | "glass" | "ios" | "pixel";

export type ThemeOption = {
  id: ThemeId;
  label: string;
  description: string;
};

export const themeOptions: ThemeOption[] = [
  {
    id: "pastel",
    label: "Pastel",
    description: "Soft pink daily dashboard",
  },
  {
    id: "glass",
    label: "Glass",
    description: "Transparent liquid glass style",
  },
  {
    id: "ios",
    label: "Mac Core",
    description: "macOS Finder and iOS widget style",
  },
  {
    id: "pixel",
    label: "Pixel Desk",
    description: "Retro 90s desktop window style",
  },
];

export const themeClassNames = [
  "theme-pastel",
  "theme-glass",
  "theme-ios",
  "theme-pixel",
];

export const isThemeId = (value: string | null): value is ThemeId => {
  return (
    value === "pastel" ||
    value === "glass" ||
    value === "ios" ||
    value === "pixel"
  );
};

export const getCurrentTheme = (): ThemeId => {
  const saved = localStorage.getItem("glassday.theme.v1");

  if (isThemeId(saved)) {
    return saved;
  }

  const root = document.documentElement;

  if (root.classList.contains("theme-glass")) return "glass";
  if (root.classList.contains("theme-ios")) return "ios";
  if (root.classList.contains("theme-pixel")) return "pixel";

  return "pastel";
};

export const applyTheme = (theme: ThemeId) => {
  const root = document.documentElement;

  root.classList.remove(...themeClassNames);
  root.classList.add(`theme-${theme}`);

  localStorage.setItem("glassday.theme.v1", theme);
};