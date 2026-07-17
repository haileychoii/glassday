export type ThemeId =
  | "pastel"
  | "glass-light"
  | "glass-dark"
  | "aurora"
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
    id: "aurora",
    label: "Aurora",
    description: "Deeper holographic night glass with aurora tint",
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
  return themeOptions.some((theme) => theme.id === value);
};

export const getCurrentTheme = (): ThemeId => {
  if (typeof window === "undefined") return "pastel";

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  // 기존 glass 저장값 호환
  if (savedTheme === "glass") {
    return "glass-light";
  }

  return isThemeId(savedTheme) ? savedTheme : "pastel";
};

export const applyTheme = (theme: ThemeId) => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const body = document.body;

  themeOptions.forEach((item) => {
    root.classList.remove(`theme-${item.id}`);
    body.classList.remove(`theme-${item.id}`);
  });

  // 예전 glass class 제거
  root.classList.remove("theme-glass");
  body.classList.remove("theme-glass");
  root.classList.remove("theme-glass-dark");
  body.classList.remove("theme-glass-dark");

  root.classList.add(`theme-${theme}`);
  body.classList.add(`theme-${theme}`);

  /* Aurora reuses the existing glass-dark widget-level dark styling as a
     compatibility layer, then overrides the surface palette in aurora.css. */
  if (theme === "aurora") {
    root.classList.add("theme-glass-dark");
    body.classList.add("theme-glass-dark");
  }

  root.setAttribute("data-theme", theme);
  body.setAttribute("data-theme", theme);

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);

  window.dispatchEvent(
    new CustomEvent<ThemeId>("glassday-theme-change", {
      detail: theme,
    })
  );
};
