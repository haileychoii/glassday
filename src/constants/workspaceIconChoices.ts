/**
 * Workspace icon catalog.
 *
 * This is the one catalog used by the tab-icon picker. Tabs save an icon's URL,
 * so existing URLs and their numbered files must stay in place when artwork is
 * updated. The collection IDs below correspond to the visible category buttons
 * in WorkspaceIconPicker.tsx. Emoji sheet numbers refer to cells in the uploaded
 * source sheets; named additions use a descriptive label for screen readers.
 * Every new image is a transparent 160 × 160 WebP with artwork centered in the
 * same 136px area, so icons from different sources appear at a consistent size.
 */
export type WorkspaceIconCollectionId =
  | "pink-iphone"
  | "retro-pixel"
  | "folder-art"
  | "emoji-expressions"
  | "emoji-people"
  | "emoji-nature"
  | "emoji-food-travel"
  | "emoji-objects";

export type WorkspaceIconChoice = {
  id: string;
  src: string;
  label: string;
};

/* Keep the original numeric paths stable for tabs that already saved an icon.
   Repaired paths stay available to existing saved tabs; when a clean duplicate
   exists, hide only that duplicate slot from new selections.
   Asset audit 2026-11 removed detached crop fragments from 108, 140, 165, 281,
   282, 289, 408, 515, 517, 519, 520, and 578. The remote branch has since
   restored the full artwork at 168, so it remains available in the picker. */
const repairedDuplicateSlots: Partial<Record<WorkspaceIconCollectionId, ReadonlySet<number>>> = {
  "pink-iphone": new Set([92, 99, 102, 177, 179, 355, 357, 398]),
  "retro-pixel": new Set([61, 62, 63, 69, 71, 109, 137, 139]),
};

const numberedIcons = (
  collection: Exclude<WorkspaceIconCollectionId, "folder-art" | `emoji-${string}`>,
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
  // 최근 Drive 추가분 중 핑크 일러스트 분류와 어울리는 단독 하트 아이콘.
  { number: 613, label: "사탕 핑크 하트" },
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

/**
 * Build one browseable category from one emoji sheet. Keeping the original cell
 * number in the URL makes replacements easy to track back to the source sheet.
 * A few slots are deliberately omitted: they are duplicates, an empty cell, or
 * a stray pixel rather than a usable icon. The generated image files use the
 * shared transparent 160px canvas described at the top of this catalog.
 */
const emojiSheet = (
  collection: Extract<WorkspaceIconCollectionId, `emoji-${string}`>,
  label: string,
  lastStableNumber: number,
  extraLabels: Record<number, string> = {}
): WorkspaceIconChoice[] =>
  Array.from({ length: lastStableNumber }, (_, index) => index + 1)
    // These two repeated drawings are visually identical to earlier cells.
    .filter((number) => !(collection === "emoji-people" && number === 138))
    .filter((number) => !(collection === "emoji-nature" && number === 56))
    // These last slots are a stray transparent pixel and an empty grid cell.
    .filter((number) => !(collection === "emoji-objects" && number === 72))
    .filter((number) => !(collection === "emoji-objects" && number === 140))
    .map((number) => ({
      id: `${collection}-${String(number).padStart(3, "0")}`,
      src: `/workspace-icons/${collection}/${String(number).padStart(3, "0")}.webp`,
      label: extraLabels[number] ?? `${label} ${number}`,
    }));

const expressionEmojis = emojiSheet("emoji-expressions", "표정·손", 150, {
  141: "점선 얼굴",
  142: "싸움 구름",
  143: "하트 장식 열나는 얼굴",
  // 144–150은 Drive 이미지에서 표정 하나씩 잘라 배경을 정리한 아이콘입니다.
  144: "혀 내민 장난 표정",
  145: "빙글빙글 어지러운 얼굴",
  146: "왜곡된 얼굴",
  147: "파티 얼굴",
  148: "애원하는 얼굴",
  149: "추워서 떠는 얼굴",
  150: "하트와 함께 웃는 얼굴",
});

/**
 * Keep each stored icon URL stable while showing newer faces beside similar
 * expressions. This makes the picker browse by facial expression rather than
 * hiding every recent face at the end of the numbered source sheet.
 */
const expressionFaceInsertions: Readonly<Record<number, readonly number[]>> = {
  17: [150], // Put the smiling face surrounded by hearts beside other affectionate faces.
  26: [144], // Put the tongue-out, zany face beside its playful lookalikes.
  32: [147], // Keep the party face with celebratory expressions.
  45: [148], // Keep the pleading face with the sad, teary expressions.
  48: [142], // The comic fight cloud belongs beside the angry face.
  53: [146], // Put the wide-eyed distorted face beside surprised faces.
  55: [149], // Keep the chattering cold face with other cold expressions.
  63: [141], // Put the dotted outline face beside thinking and quiet faces.
  84: [145], // Keep the dizzy face near the unwell expressions.
  87: [143], // Put the feverish, heart-decorated face with the sick faces.
};

const orderedExpressionEmojis: WorkspaceIconChoice[] = (() => {
  const emojiByNumber = new Map(
    expressionEmojis.map((choice) => [Number(choice.id.slice(-3)), choice] as const)
  );
  const insertedNumbers = new Set(Object.values(expressionFaceInsertions).flat());
  const ordered: WorkspaceIconChoice[] = [];

  for (const choice of expressionEmojis) {
    const number = Number(choice.id.slice(-3));
    if (insertedNumbers.has(number)) continue;

    ordered.push(choice);
    for (const nearbyNumber of expressionFaceInsertions[number] ?? []) {
      const nearbyChoice = emojiByNumber.get(nearbyNumber);
      if (nearbyChoice) ordered.push(nearbyChoice);
    }
  }

  return ordered;
})();
const natureEmojis = emojiSheet("emoji-nature", "자연·음식", 141, {
  141: "해파리",
});

export const workspaceIconCollections: Record<WorkspaceIconCollectionId, WorkspaceIconChoice[]> = {
  "pink-iphone": [
    ...numberedIcons("pink-iphone", 598, "일러스트 아이콘"),
    ...pinkStickerAdditions,
  ],
  "retro-pixel": [
    ...numberedIcons("retro-pixel", 182, "레트로 픽셀"),
    ...pixelArtAdditions,
  ],
  "folder-art": folderDesignAdditions,
  "emoji-expressions": orderedExpressionEmojis,
  "emoji-people": emojiSheet("emoji-people", "사람·동물", 140),
  "emoji-nature": natureEmojis,
  "emoji-food-travel": emojiSheet("emoji-food-travel", "음식·이동", 140),
  // Basic Emoticon 05 uses two centered rows of nine icons after item 90.
  // The old uniform ten-column crops split the hearts and red symbols across
  // neighboring cells. Slots 091–108 keep their saved URLs, with each image
  // recropped around the complete original artwork.
  "emoji-objects": emojiSheet("emoji-objects", "생활·기호", 140),
};
