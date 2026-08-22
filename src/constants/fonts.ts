/**
 * ============================================================
 * [Typography Registry] Interface + Memo Font Options
 * ============================================================
 *
 * 화면 연결:
 * - Settings: src/components/settings/SettingsModal.tsx
 * - Memo editor: src/components/widgets/MemoWidget.tsx
 * - Font faces: src/styles/fonts.css 및 public/fonts
 *
 * 저장:
 * - APP_FONT_STORAGE_KEY는 Dashboard interface 전체의 font 선택이다.
 * - MEMO_DEFAULT_FONT_STORAGE_KEY는 새 Memo의 기본 editor font다.
 * - CUSTOM_WEB_FONTS_STORAGE_KEY는 사용자가 추가한 web font metadata다.
 *
 * Figma Mapping:
 * - FontGroup = Settings Select의 option group
 * - FontOption = Typography style 후보
 * - Memo 본문 font는 Theme font와 독립적인 per-note property가 될 수 있다.
 * ============================================================
 */
export type FontOption = {
  label: string;
  value: string;
};

export type FontGroup = {
  label: string;
  fonts: FontOption[];
};

export type CustomFontSourceType =
  | "stylesheet"
  | "woff2"
  | "woff"
  | "ttf"
  | "otf";

export type CustomFontEntry = {
  /** 저장/삭제 시 사용하는 custom font record id. */
  id: string;
  /** Settings 목록에 보이는 사용자용 이름. */
  label: string;
  /** CSS font-family에 전달되는 실제 family name. */
  family: string;
  sourceUrl: string;
  sourceType: CustomFontSourceType;
};

export const APP_FONT_STORAGE_KEY = "glassday.ui.font.v1";
export const MEMO_DEFAULT_FONT_STORAGE_KEY = "glassday.memo.default-font.v1";
export const CUSTOM_WEB_FONTS_STORAGE_KEY = "glassday.custom.web-fonts.v1";
export const FONT_CHANGE_EVENT = "glassday-fonts-change";
const APP_FONT_USER_SELECTED_KEY = "glassday.ui.font.user-selected.v1";

const defaultSansFallback =
  "Pretendard, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif";
const defaultSerifFallback =
  "Ridibatang, 'Noto Serif KR', 'Noto Serif', Georgia, serif";
const defaultMonoFallback =
  "'D2Coding', 'NeoDunggeunmo', 'Courier New', monospace";
const defaultHandwritingFallback =
  "'OngleipKonkon', 'Kyobo Handwriting 2020', cursive";
const pixelDeskFallback =
  "'Mona12', 'MonaS12', 'RoundedFixedsys', 'NeoDunggeunmo', 'MS Sans Serif', Tahoma, Arial, sans-serif";
const macCoreFallback =
  "'Apple SD Gothic Neo', AppleGothic, -apple-system, BlinkMacSystemFont, 'SF Pro KR', 'SF Pro Text', 'Helvetica Neue', Inter, ui-sans-serif, system-ui, 'Segoe UI', sans-serif";

export const DEFAULT_APP_FONT = defaultSansFallback;
export const DEFAULT_MEMO_FONT = defaultSansFallback;

const withFallback = (primary: string, fallback: string = defaultSansFallback) =>
  `${primary}, ${fallback}`;

const font = (
  label: string,
  primary: string,
  fallback?: string
): FontOption => ({
  label,
  value: withFallback(primary, fallback),
});

const builtInFontGroups: FontGroup[] = [
  {
    label: "Korean UI Fonts",
    fonts: [
      font("Pretendard", "Pretendard"),
      font("Apple SD Gothic Neo", "'Apple SD Gothic Neo'"),
      font("Gmarket Sans", "'Gmarket Sans'"),
      font("The Jamsil", "'TheJamsil'"),
      font("Cafe24 Ssurround", "'Cafe24Ssurround'"),
      font("Cafe24 Ssurround Air", "'Cafe24SsurroundAir'"),
      font("School Safety HalfMoon", "'SchoolSafetyHalfMoon'"),
      font("Mona12", "'Mona12'", pixelDeskFallback),
      font("MonaS12", "'MonaS12'", pixelDeskFallback),
      font("Rounded Fixedsys", "'RoundedFixedsys'", defaultMonoFallback),
      font("NeoDunggeunmo", "'NeoDunggeunmo'", defaultMonoFallback),
      font("D2Coding", "'D2Coding'", defaultMonoFallback),
    ],
  },
  {
    label: "Korean Handwriting & Display",
    fonts: [
      font("Yeogiottae Jalnan", "'YeogiOttaeJalnan'"),
      font("Kyobo Handwriting 2020", "'Kyobo Handwriting 2020'", defaultHandwritingFallback),
      font("Ongleip Konkon", "'OngleipKonkon'", defaultHandwritingFallback),
      font("Ongleip Park Dahyeon", "'OngleipParkDahyeon'", defaultHandwritingFallback),
      font("Ongleip Study Well", "'OngleipStudyWell'", defaultHandwritingFallback),
      font("Ongleip RyuTtung", "'OngleipRyuttung'", defaultHandwritingFallback),
      font("Ongleip Ppukka", "'OngleipPpukka'", defaultHandwritingFallback),
      font("Ongleip NyangNyang", "'OngleipNyangNyang'", defaultHandwritingFallback),
      font("EF Diary", "'EFDiary'", defaultHandwritingFallback),
      font("Memoment Kkukkukk", "'MemomentKkukkukk'", defaultHandwritingFallback),
      font("Peoplefirst Neat&Loud", "'PeoplefirstNeatLoud'", defaultHandwritingFallback),
      font("Wavve PADO", "'WavvePADO'", defaultHandwritingFallback),
      font("Wiggle Hangeul", "'WiggleHangeul'", defaultHandwritingFallback),
      font("Minggi Jeokche", "'MinggiJeokche'", defaultHandwritingFallback),
      font("Okticon", "'Okticon'", defaultHandwritingFallback),
    ],
  },
  {
    label: "Serif & Editorial",
    fonts: [
      font("Ridibatang", "'Ridibatang'", defaultSerifFallback),
      font("Noto Serif KR", "'Noto Serif KR'", defaultSerifFallback),
      font("DM Serif Text", "'DM Serif Text'", defaultSerifFallback),
      font("DM Serif Display", "'DM Serif Display'", defaultSerifFallback),
      font("Roboto Slab", "'Roboto Slab'", defaultSerifFallback),
    ],
  },
  {
    label: "Latin Display",
    fonts: [
      font("Mona", "'Mona'", defaultMonoFallback),
      font("Permanent Marker", "'Permanent Marker'", defaultHandwritingFallback),
      font("Pacifico", "'Pacifico'", defaultHandwritingFallback),
      font("Courgette", "'Courgette'", defaultHandwritingFallback),
      font("Yellowtail", "'Yellowtail'", defaultHandwritingFallback),
      font("Anton", "'Anton'"),
      font("Alfa Slab One", "'Alfa Slab One'"),
      font("Shrikhand", "'Shrikhand'"),
    ],
  },
];

const uiPriorityLabels = new Set([
  "Pretendard",
  "Apple SD Gothic Neo",
  "Gmarket Sans",
  "The Jamsil",
  "Cafe24 Ssurround",
  "Cafe24 Ssurround Air",
  "School Safety HalfMoon",
  "Mona12",
  "MonaS12",
  "Rounded Fixedsys",
  "NeoDunggeunmo",
  "D2Coding",
  "Yeogiottae Jalnan",
  "Kyobo Handwriting 2020",
  "Ongleip Konkon",
  "Ridibatang",
  "Noto Serif KR",
]);

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `font-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const dispatchFontChange = () => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(FONT_CHANGE_EVENT));
};

const safeParseCustomFonts = (raw: string | null): CustomFontEntry[] => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is CustomFontEntry => {
      if (!item || typeof item !== "object") return false;

      const candidate = item as Partial<CustomFontEntry>;

      return Boolean(
        candidate.id &&
          candidate.label &&
          candidate.family &&
          candidate.sourceUrl &&
          candidate.sourceType
      );
    });
  } catch (error) {
    console.error("Failed to parse saved custom fonts", error);
    return [];
  }
};

export const getSavedCustomFonts = (): CustomFontEntry[] => {
  if (typeof window === "undefined") return [];

  return safeParseCustomFonts(
    window.localStorage.getItem(CUSTOM_WEB_FONTS_STORAGE_KEY)
  );
};

const saveCustomFonts = (entries: CustomFontEntry[]) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    CUSTOM_WEB_FONTS_STORAGE_KEY,
    JSON.stringify(entries)
  );
  dispatchFontChange();
};

const customFontToOption = (entry: CustomFontEntry): FontOption => ({
  label: entry.label,
  value: withFallback(`'${entry.family}'`),
});

export const getMemoFontGroups = (): FontGroup[] => {
  const customFonts = getSavedCustomFonts();

  if (!customFonts.length) return builtInFontGroups;

  return [
    ...builtInFontGroups,
    {
      label: "Imported Web Fonts",
      fonts: customFonts.map(customFontToOption),
    },
  ];
};

export const getAppFontOptions = (): FontOption[] => {
  const baseFonts = builtInFontGroups
    .flatMap((group) => group.fonts)
    .filter((option) => uiPriorityLabels.has(option.label));

  const customFonts = getSavedCustomFonts().map(customFontToOption);

  return [...baseFonts, ...customFonts];
};

export const getSavedAppFont = (): string => {
  if (typeof window === "undefined") return DEFAULT_APP_FONT;

  if (hasUserSelectedAppFont()) {
    return window.localStorage.getItem(APP_FONT_STORAGE_KEY) || DEFAULT_APP_FONT;
  }

  const theme = document.documentElement.getAttribute("data-theme");
  return getDefaultAppFontForTheme(theme);
};

export const getSavedDefaultMemoFont = (): string => {
  if (typeof window === "undefined") return DEFAULT_MEMO_FONT;

  return (
    window.localStorage.getItem(MEMO_DEFAULT_FONT_STORAGE_KEY) ||
    DEFAULT_MEMO_FONT
  );
};

export const getDefaultAppFontForTheme = (theme: string | null | undefined) => {
  switch (theme) {
    case "pixel-desk":
      return pixelDeskFallback;
    case "mac-core":
      return macCoreFallback;
    default:
      return DEFAULT_APP_FONT;
  }
};

export const hasUserSelectedAppFont = () => {
  if (typeof window === "undefined") return false;

  if (window.localStorage.getItem(APP_FONT_USER_SELECTED_KEY) === "true") {
    return true;
  }

  const saved = window.localStorage.getItem(APP_FONT_STORAGE_KEY);
  if (!saved) return false;

  /* Migration guard:
     Old builds stored the startup default as if it were a user choice. Treat
     only non-default legacy values as selected. / 기존 기본값 저장은 선택으로 보지 않는다. */
  const defaultValues = new Set([
    DEFAULT_APP_FONT,
    pixelDeskFallback,
    macCoreFallback,
  ]);

  return !defaultValues.has(saved);
};

export const applyAppFont = (
  fontValue: string,
  options: { persist?: boolean; markUserChoice?: boolean } = {}
) => {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const root = document.documentElement;
  const body = document.body;
  const persist = options.persist ?? true;
  const markUserChoice = options.markUserChoice ?? persist;

  root.style.setProperty("--glassday-app-font", fontValue);
  body.style.setProperty("--glassday-app-font", fontValue);

  if (persist) {
    window.localStorage.setItem(APP_FONT_STORAGE_KEY, fontValue);
  }

  if (markUserChoice) {
    window.localStorage.setItem(APP_FONT_USER_SELECTED_KEY, "true");
  }

  dispatchFontChange();
};

export const saveDefaultMemoFont = (fontValue: string) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(MEMO_DEFAULT_FONT_STORAGE_KEY, fontValue);
  dispatchFontChange();
};

const loadedFontKeys = new Set<string>();

const normalizeFormat = (sourceType: CustomFontSourceType) => {
  switch (sourceType) {
    case "ttf":
      return "truetype";
    case "otf":
      return "opentype";
    default:
      return sourceType;
  }
};

export const loadCustomFont = async (entry: CustomFontEntry) => {
  if (typeof document === "undefined") return false;

  const key = `${entry.family}:${entry.sourceType}:${entry.sourceUrl}`;

  if (loadedFontKeys.has(key)) return true;

  try {
    if (entry.sourceType === "stylesheet") {
      const stylesheetId = `glassday-font-link-${entry.id}`;

      if (!document.getElementById(stylesheetId)) {
        const link = document.createElement("link");
        link.id = stylesheetId;
        link.rel = "stylesheet";
        link.href = entry.sourceUrl;
        document.head.appendChild(link);
      }

      loadedFontKeys.add(key);
      return true;
    }

    const source = `url("${entry.sourceUrl}") format("${normalizeFormat(
      entry.sourceType
    )}")`;

    if ("FontFace" in window && document.fonts) {
      const fontFace = new FontFace(entry.family, source, {
        display: "swap",
      });
      const loadedFace = await fontFace.load();
      document.fonts.add(loadedFace);
      loadedFontKeys.add(key);
      return true;
    }

    const styleId = `glassday-font-style-${entry.id}`;

    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `@font-face { font-family: "${entry.family}"; src: ${source}; font-display: swap; }`;
      document.head.appendChild(style);
    }

    loadedFontKeys.add(key);
    return true;
  } catch (error) {
    console.error(`Failed to load font "${entry.label}"`, error);
    return false;
  }
};

export const loadSavedCustomFonts = async () => {
  const fonts = getSavedCustomFonts();

  await Promise.all(fonts.map((entry) => loadCustomFont(entry)));
};

export const addCustomFont = async (
  input: Omit<CustomFontEntry, "id">
): Promise<CustomFontEntry | null> => {
  const entry: CustomFontEntry = {
    ...input,
    id: createId(),
  };

  const loaded = await loadCustomFont(entry);

  if (!loaded) return null;

  const next = [...getSavedCustomFonts(), entry];
  saveCustomFonts(next);

  return entry;
};

export const removeCustomFont = (id: string) => {
  const target = getSavedCustomFonts().find((entry) => entry.id === id);
  const next = getSavedCustomFonts().filter((entry) => entry.id !== id);

  saveCustomFonts(next);

  if (!target || typeof document === "undefined") return;

  const link = document.getElementById(`glassday-font-link-${target.id}`);
  const style = document.getElementById(`glassday-font-style-${target.id}`);

  link?.remove();
  style?.remove();
  loadedFontKeys.delete(`${target.family}:${target.sourceType}:${target.sourceUrl}`);
};
