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

/* Keep the original numeric paths stable for tabs that already saved an icon.
   These slots now render repaired full illustrations but are hidden from the
   picker because a complete version already appears elsewhere in the collection. */
const repairedDuplicateSlots: Record<WorkspaceIconCollectionId, ReadonlySet<number>> = {
  "pink-iphone": new Set([92, 99, 102, 177, 179, 355, 357, 398]),
  "retro-pixel": new Set([61, 62, 63, 69, 71, 109, 137, 139]),
};

const numberedIcons = (
  collection: WorkspaceIconCollectionId,
  lastStableNumber: number,
  label: string
): WorkspaceIconChoice[] =>
  Array.from({ length: lastStableNumber }, (_, index) => index + 1)
    .filter((number) => !repairedDuplicateSlots[collection].has(number))
    .map((number) => {
      const paddedNumber = String(number).padStart(3, "0");
      return {
        id: `${collection}-${paddedNumber}`,
        src: `/workspace-icons/${collection}/${paddedNumber}.webp`,
        label: `${label} icon ${number}`,
      };
    });

export const workspaceIconCollections: Record<WorkspaceIconCollectionId, WorkspaceIconChoice[]> = {
  "pink-iphone": numberedIcons("pink-iphone", 598, "핑크 iPhone"),
  "retro-pixel": numberedIcons("retro-pixel", 182, "레트로 픽셀"),
};
