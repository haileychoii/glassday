export type ThemeId = "pastel" | "glass" | "mac-core" | "pixel-desk" | "retro";

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
    id: "glass",
    label: "Glass",
    description: "Holographic glassmorphism",
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

  if (isThemeId(savedTheme)) {
    return savedTheme;
  }

  return "pastel";
};

export const applyTheme = (theme: ThemeId) => {
  const root = document.documentElement;
  const body = document.body;

  themeOptions.forEach((item) => {
    root.classList.remove(`theme-${item.id}`);
    body.classList.remove(`theme-${item.id}`);
  });

  root.classList.add(`theme-${theme}`);
  body.classList.add(`theme-${theme}`);

  root.setAttribute("data-theme", theme);
  body.setAttribute("data-theme", theme);

  localStorage.setItem("glassday.theme", theme);

  window.dispatchEvent(
    new CustomEvent("glassday-theme-change", {
      detail: theme,
    })
  );
};