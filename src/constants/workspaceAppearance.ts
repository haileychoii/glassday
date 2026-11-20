/**
 * Workspace appearance presets shared by Sidebar and WorkspaceTabsNav.
 *
 * EN: A sprite option stores the source sheet and cell coordinates instead of
 * stretching the whole sheet. WorkspaceTabIcon turns that descriptor into a
 * fixed square preview, so every workspace icon keeps the same visual box.
 * KO: 전체 스프라이트를 찌그러뜨리지 않고 셀 좌표만 저장한다. 실제 화면의
 * 고정 크기와 잘림 방식은 WorkspaceTabIcon.tsx/CSS가 담당한다.
 */

export type WorkspaceSpriteIcon = {
  kind: "sprite";
  src: string;
  cols: number;
  rows: number;
  col: number;
  row: number;
};

export type WorkspaceIconOption = {
  id: string;
  label: string;
  value: string;
  sprite?: WorkspaceSpriteIcon;
};

export type WorkspaceBackgroundOption = {
  id: string;
  label: string;
  value: string;
};

export const encodeWorkspaceSprite = (sprite: WorkspaceSpriteIcon) =>
  ["sprite", sprite.src, sprite.cols, sprite.rows, sprite.col, sprite.row].join("|");

export const decodeWorkspaceSprite = (value: string): WorkspaceSpriteIcon | null => {
  const [kind, src, cols, rows, col, row] = value.split("|");
  if (kind !== "sprite" || !src) return null;

  const numbers = [cols, rows, col, row].map(Number);
  if (numbers.some((number) => !Number.isFinite(number))) return null;

  return {
    kind: "sprite",
    src,
    cols: numbers[0],
    rows: numbers[1],
    col: numbers[2],
    row: numbers[3],
  };
};

const sprite = (
  id: string,
  label: string,
  src: string,
  cols: number,
  rows: number,
  col: number,
  row: number
): WorkspaceIconOption => {
  const descriptor = { kind: "sprite" as const, src, cols, rows, col, row };
  return { id, label, value: encodeWorkspaceSprite(descriptor), sprite: descriptor };
};

/** The supplied sheets are represented by curated cells using the same format. */
export const workspaceIconOptions: WorkspaceIconOption[] = [
  { id: "emoji-sparkle", label: "Sparkle", value: "✨" },
  { id: "emoji-heart", label: "Heart", value: "💗" },
  sprite("pink-cat", "Pink cat", "/workspace-icon-sources/pink_emoji_5.png", 9, 6, 0, 0),
  sprite("pink-books", "Pink books", "/workspace-icon-sources/pink_emoji_5.png", 9, 6, 8, 0),
  sprite("pink-calendar", "Pink calendar", "/workspace-icon-sources/pink_emoji_5.png", 9, 6, 6, 1),
  sprite("pink-camera", "Pink camera", "/workspace-icon-sources/pink_emoji_5.png", 9, 6, 4, 4),
  sprite("pink-flower", "Pink flower", "/workspace-icon-sources/pink_emoji_6.png", 9, 6, 2, 0),
  sprite("pink-heart", "Pink heart", "/workspace-icon-sources/pink_emoji_6.png", 9, 6, 1, 0),
  sprite("sanrio-laptop", "Sanrio laptop", "/workspace-icon-sources/sanrio5.png", 2, 2, 0, 0),
  sprite("sanrio-headphones", "Sanrio headphones", "/workspace-icon-sources/sanrio5.png", 2, 2, 1, 0),
  sprite("pixel-calendar", "Pixel calendar", "/workspace-icon-sources/pixel_emoji_1.png", 6, 5, 3, 0),
  sprite("pixel-cat", "Pixel cat", "/workspace-icon-sources/pixel_emoji_1.png", 6, 5, 2, 0),
  sprite("win-folder", "Windows folder", "/workspace-icon-sources/windows95-app-icons-1.png", 7, 8, 4, 0),
  sprite("win-computer", "Windows computer", "/workspace-icon-sources/windows95-app-icons-1.png", 7, 8, 6, 0),
];

export const workspaceBackgroundOptions: WorkspaceBackgroundOption[] = [
  { id: "default", label: "Default", value: "" },
  { id: "blush", label: "Blush", value: "linear-gradient(135deg, #f8dce9, #f4c4d7 48%, #f7eee9)" },
  { id: "mint", label: "Mint", value: "linear-gradient(135deg, #dff3e7, #b9ded7 48%, #edf3df)" },
  { id: "sky", label: "Sky", value: "linear-gradient(135deg, #dcecff, #c9d5f3 48%, #f5e8ee)" },
  { id: "lavender", label: "Lavender", value: "linear-gradient(135deg, #e7def5, #d8c8ed 48%, #f4e6ef)" },
  { id: "night", label: "Night", value: "linear-gradient(135deg, #172338, #2e2751 52%, #163b43)" },
];
