/**
 * Workspace icon images cropped from the user's glassday-icons sprite sheets.
 * The numbered files are visually deduplicated and grouped by the two requested
 * styles. Keep this list generated from the asset counts so picker UI stays small
 * and every file remains directly selectable without another icon wrapper.
 */
export type WorkspaceIconCollectionId = "pink-iphone" | "retro-pixel";

export type WorkspaceIconChoice = {
  id: string;
  src: string;
  label: string;
};

const numberedIcons = (
  collection: WorkspaceIconCollectionId,
  count: number,
  label: string
): WorkspaceIconChoice[] =>
  Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(3, "0");
    return {
      id: `${collection}-${number}`,
      src: `/workspace-icons/${collection}/${number}.webp`,
      label: `${label} icon ${index + 1}`,
    };
  });

export const workspaceIconCollections: Record<WorkspaceIconCollectionId, WorkspaceIconChoice[]> = {
  "pink-iphone": numberedIcons("pink-iphone", 598, "핑크 iPhone"),
  "retro-pixel": numberedIcons("retro-pixel", 182, "레트로 픽셀"),
};
