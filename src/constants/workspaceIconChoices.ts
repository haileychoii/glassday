/**
 * Workspace icon catalog.
 *
 * This is the single index used by the mobile icon picker. Keep the file paths
 * stable because tabs save those paths as their icon value. The numbered image
 * sets contain the earlier artwork; the named entries below document the new
 * Drive additions so people can identify them with a screen reader or tooltip.
 *
 * Artwork groups describe what people will browse for: pink icons, pixel icons,
 * and folder icons. All files use transparent 160 × 160
 * WebP canvases and the same centered 136px artwork area.
 */
export type WorkspaceIconCollectionId = "pink-iphone" | "retro-pixel" | "folder-art";

export type WorkspaceIconChoice = {
  id: string;
  src: string;
  label: string;
};

/* Keep the original numeric paths stable for tabs that already saved an icon.
   These are repaired full illustrations whose matching complete version also
   appears elsewhere, so only the duplicate picker slots stay hidden. */
const repairedDuplicateSlots: Partial<Record<WorkspaceIconCollectionId, ReadonlySet<number>>> = {
  "pink-iphone": new Set([92, 99, 102, 177, 179, 355, 357, 398]),
  "retro-pixel": new Set([61, 62, 63, 69, 71, 109, 137, 139]),
};

const numberedIcons = (
  collection: Exclude<WorkspaceIconCollectionId, "folder-art">,
  lastStableNumber: number,
  label: string
): WorkspaceIconChoice[] =>
  Array.from({ length: lastStableNumber }, (_, index) => index + 1)
    .filter((number) => !repairedDuplicateSlots[collection]?.has(number))
    .map((number) => {
      const paddedNumber = String(number).padStart(3, "0");
      return {
        id: `${collection}-${paddedNumber}`,
        src: `/workspace-icons/${collection}/${paddedNumber}.webp`,
        label: `${label} ${number}`,
      };
    });

/**
 * Named Drive additions are kept beside their file path instead of hiding the
 * meaning behind a generated number. To add another icon, add its matching
 * label here and place its 160px transparent WebP in the same numbered slot.
 */
const namedIcons = (
  collection: WorkspaceIconCollectionId,
  entries: Array<{ number: number; label: string }>
): WorkspaceIconChoice[] =>
  entries.map(({ number, label }) => {
    const paddedNumber = String(number).padStart(3, "0");
    return {
      id: `${collection}-${paddedNumber}`,
      src: `/workspace-icons/${collection}/${paddedNumber}.webp`,
      label,
    };
  });

const pinkStickerAdditions = namedIcons("pink-iphone", [
  { number: 599, label: "푸른 지구 하트" },
  { number: 600, label: "반짝이는 핑크 별" },
  { number: 601, label: "리본 고양이" },
  { number: 602, label: "하트 장식 악마 고양이" },
  { number: 603, label: "반짝이 장난감 광선총" },
  { number: 604, label: "꽃 장식 고양이" },
  { number: 605, label: "하트 만드는 손" },
  { number: 606, label: "말풍선" },
  { number: 607, label: "하트 구름" },
  { number: 608, label: "하트 든 표정" },
  { number: 609, label: "꽃 구름" },
  { number: 610, label: "화난 표정 구름" },
  { number: 611, label: "왕관 쓴 악마 표정" },
  { number: 612, label: "피아노 건반" },
]);

const pixelArtAdditions = namedIcons("retro-pixel", [
  { number: 183, label: "픽셀 하트" },
  { number: 184, label: "픽셀 고양이" },
  { number: 185, label: "픽셀 별" },
  { number: 186, label: "픽셀 유성" },
  { number: 187, label: "초록 별 하트" },
  { number: 188, label: "픽셀 공룡" },
  { number: 189, label: "픽셀 음표" },
]);

const folderDesignAdditions = namedIcons("folder-art", [
  { number: 1, label: "파스텔 폴더 묶음" },
  { number: 2, label: "하늘색 폴더 묶음" },
  { number: 3, label: "핑크 폴더 묶음" },
  { number: 4, label: "별빛 폴더" },
  { number: 5, label: "보라 유광 폴더" },
  { number: 6, label: "픽셀 밤하늘 폴더" },
  { number: 7, label: "핑크 레오파드 폴더" },
  { number: 8, label: "젖소 무늬 폴더" },
  { number: 9, label: "파란 레오파드 폴더" },
  { number: 10, label: "하트 젖소 무늬 폴더" },
  { number: 11, label: "핑크 파일 묶음" },
  { number: 12, label: "브라운 레오파드 폴더" },
  { number: 13, label: "리본 퍼 폴더" },
]);

export const workspaceIconCollections: Record<WorkspaceIconCollectionId, WorkspaceIconChoice[]> = {
  "pink-iphone": [
    ...numberedIcons("pink-iphone", 598, "핑크 아이콘"),
    ...pinkStickerAdditions,
  ],
  "retro-pixel": [
    ...numberedIcons("retro-pixel", 182, "레트로 픽셀"),
    ...pixelArtAdditions,
  ],
  "folder-art": folderDesignAdditions,
};
