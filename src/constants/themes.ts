export type ThemeId =
  | "pastel"
  | "glass-light"
  | "glass-dark"
  | "mac-core"
  | "pixel-desk"
  | "retro";

export type ThemeOption = {
  id: ThemeId;
  label: string;
  description: string;
};

const THEME_STORAGE_KEY = "glassday.theme";

export const themeOptions: ThemeOption[] = [
  {
    id: "pastel",
    label: "Pastel",
    description: "Soft pastel glass dashboard",
  },
  {
    id: "glass-light",
    label: "Glass Light",
    description: "Transparent desktop glass, light mode",
  },
  {
    id: "glass-dark",
    label: "Glass Dark",
    description: "Transparent desktop glass, dark mode",
  },
  {
    id: "mac-core",
    label: "Mac Core",
    description: "Cupertino desktop-inspired interface",
  },
  {
    id: "pixel-desk",
    label: "Pixel Desk",
    description: "Hard pixel desktop style",
  },
  {
    id: "retro",
    label: "Retro 98",
    description: "Win 98 inspired retro theme",
  },
];

export const topbarThemeOptions = themeOptions.filter(
  (theme) => theme.id !== "retro"
);

export const isThemeId = (value: unknown): value is ThemeId => {
  return (
    typeof value === "string" &&
    themeOptions.some((theme) => theme.id === value)
  );
};

const normalizeThemeId = (value: unknown): ThemeId => {
  if (value === "glass") return "glass-light";
  if (value === "pixel") return "pixel-desk";
  if (value === "mac") return "mac-core";

  return isThemeId(value) ? value : "pastel";
};

export const getCurrentTheme = (): ThemeId => {
  if (typeof window === "undefined") return "pastel";

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return normalizeThemeId(savedTheme);
};

type ApplyThemeOptions = {
  emit?: boolean;
};

const removeThemeClasses = (element: HTMLElement) => {
  themeOptions.forEach((theme) => {
    element.classList.remove(`theme-${theme.id}`);
  });

  element.classList.remove("theme-glass");
  element.classList.remove("theme-pixel");
  element.classList.remove("theme-mac");
};

export const applyTheme = (
  nextThemeInput: ThemeId,
  options: ApplyThemeOptions = {}
) => {
  if (typeof document === "undefined") return;

  const { emit = true } = options;
  const nextTheme = normalizeThemeId(nextThemeInput);

  const root = document.documentElement;
  const body = document.body;

  removeThemeClasses(root);
  removeThemeClasses(body);

  root.classList.add(`theme-${nextTheme}`);
  body.classList.add(`theme-${nextTheme}`);

  root.setAttribute("data-theme", nextTheme);
  body.setAttribute("data-theme", nextTheme);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);

    if (emit) {
      window.dispatchEvent(
        new CustomEvent<ThemeId>("glassday-theme-change", {
          detail: nextTheme,
        })
      );
    }
  }
};

export const resetTheme = () => {
  applyTheme("pastel");
};

export const getThemeStorageKey = () => THEME_STORAGE_KEY;