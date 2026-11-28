/**
 * Public asset folders mirror the icon-picker category tabs. Keep filenames
 * stable within a category so the catalog, picker, and saved workspace icons
 * all point at the same individual image file.
 */
const categoryFolderByCollection: Record<string, string> = {
  "pink-iphone": "illustration",
  "retro-pixel": "pixel",
  "folder-art": "folder-pattern",
  "emoji-expressions": "expressions-hands",
  "emoji-people": "people-animals",
  "emoji-nature": "nature-food",
  "emoji-food-travel": "food-travel",
  "emoji-objects": "lifestyle-symbols",
};

/**
 * Artwork that began in the pink sheet but is now offered in the Pixel tab.
 * Keep its original source path readable for saved tabs and legacy migration.
 */
export const pinkPixelIllustrationNumbers = new Set([
  94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108,
  109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122,
  123, 124, 125, 126, 127, 128, 129,
  350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363,
  364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377,
  378, 379, 380, 381, 384, 385, 386, 387, 388, 414,
]);

const filenameNumber = (filename: string) => Number.parseInt(filename, 10);

/** Return the new category path that catalog choices should use. */
export const workspaceIconAssetPath = (collection: string, filename: string) => {
  const originalBasename = filename.split("/").pop() ?? filename;
  const basename =
    collection === "emoji-expressions" && originalBasename === "146.webp"
      ? "146-balanced.webp"
      : originalBasename;
  const number = filenameNumber(basename);

  if (collection === "retro-pixel") return `/workspace-icons/pixel/retro-${basename}`;
  if (collection === "pink-iphone" && pinkPixelIllustrationNumbers.has(number)) {
    return `/workspace-icons/pixel/pink-${basename}`;
  }

  const folder = categoryFolderByCollection[collection];
  return folder
    ? `/workspace-icons/${folder}/${basename}`
    : `/workspace-icons/${collection}/${basename}`;
};

/** Keep tabs saved with the earlier workspace-icons URL layout working. */
export const resolveWorkspaceIconPath = (icon: string) => {
  const legacyPath = icon.match(/^\/workspace-icons\/([^/]+)\/([^/]+)$/);
  if (!legacyPath) return null;
  if (Object.values(categoryFolderByCollection).includes(legacyPath[1])) return icon;

  return workspaceIconAssetPath(legacyPath[1], legacyPath[2]);
};
