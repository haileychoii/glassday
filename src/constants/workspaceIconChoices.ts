/**
 * Workspace icon catalog.
 *
 * This is the one catalog used by the tab-icon picker. Tabs save an icon's URL,
 * so existing URLs and their numbered files must stay in place when artwork is
 * updated. The collection IDs below correspond to the visible category buttons
 * in WorkspaceIconPicker.tsx. Emoji sheet numbers refer to cells in the uploaded
 * source sheets; named additions use a descriptive label for screen readers.
 * New images use transparent 160 × 160 WebP canvases; their visible artwork is
 * centered and scaled to a maximum side of 136px for consistent display size.
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
   Duplicate or incomplete art is hidden from new choices without breaking an
   existing tab that still points to its original image URL. */
const repairedDuplicateSlots: Partial<Record<WorkspaceIconCollectionId, ReadonlySet<number>>> = {
  "pink-iphone": new Set([92, 99, 102, 177, 179, 355, 357, 398]),
  "retro-pixel": new Set([61, 62, 63, 69, 71, 109, 137, 139]),
};

/**
 * These pink illustration crops are visibly incomplete (detached shapes,
 * chopped paw pads, or a leftover sliver). Keep their files for old saved URLs,
 * but leave them out of the picker so nobody can select a broken-looking icon.
 */
const unusablePinkIllustrationSlots = new Set([
  133, 139, 288, // sparkle crops contain a stray partial second sparkle
  216, 217, 218, // detached pink bars/squares with crop artifacts
  405, // the growth-chart crop is missing most of its bars
  345, 348, // paw artwork was split into disconnected pieces
  407, 408, 409, // isolated pill/bar fragments with stray crop pixels
  539, // a single leftover sliver rather than a complete illustration
]);

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

/*
 * Icons from the latest Drive upload are cut from their original 5 × 5 sheets
 * one cell at a time. Their filenames keep the catalog IDs stable; the labels
 * describe the artwork so a person choosing icons does not need to know which
 * sheet or cell it came from. Blank cells and close repeats were left out.
 *
 * The source sheets have different amounts of transparent padding, so their
 * original crop sizes would make some pictures look tiny beside others. Each
 * generated WebP was trimmed to its visible pixels and scaled so its
 * longest visible side is exactly 136 px on a transparent 160 px canvas. This
 * also gives every heart the same visible-size target as the existing pink
 * heart icons while preserving each heart's original shape and proportions.
 */
const pinkDriveAdditions = namedIcons("pink-iphone", [
  { number: 614, label: "유성별" },
  { number: 615, label: "자주색 초승달" },
  { number: 616, label: "보름달" },
  { number: 617, label: "토성" },
  { number: 618, label: "진한 분홍 장미" },
  { number: 619, label: "남색 장미" },
  { number: 620, label: "검은 장미" },
  { number: 621, label: "와인색 꽃" },
  { number: 622, label: "남색 꽃" },
  { number: 623, label: "붉은 꽃" },
  { number: 624, label: "작은 꽃가지" },
  { number: 625, label: "파란 수국" },
  { number: 626, label: "체리" },
  { number: 627, label: "딸기" },
  { number: 628, label: "산딸기" },
  { number: 629, label: "블랙베리" },
  { number: 630, label: "블루베리" },
  { number: 631, label: "석류" },
  { number: 632, label: "마카롱" },
  { number: 633, label: "체리 컵케이크" },
  { number: 634, label: "케이크 조각" },
  { number: 635, label: "레드 와인" },
  { number: 636, label: "아이스 커피" },
  { number: 637, label: "향수병" },
  { number: 638, label: "유리 촛불" },
  { number: 639, label: "무지개 유리 하트" },
  { number: 640, label: "분홍 유리 하트" },
  { number: 641, label: "보라 유리 하트" },
  { number: 642, label: "파란 유리 하트" },
  { number: 643, label: "민트 유리 하트" },
  { number: 644, label: "금빛 유리 하트" },
  { number: 645, label: "반짝이는 핑크 하트" },
  { number: 646, label: "짙은 남색 하트" },
  { number: 647, label: "오팔 리본" },
  { number: 648, label: "분홍 리본" },
  { number: 649, label: "보라 리본" },
  { number: 650, label: "파란 리본" },
  { number: 651, label: "민트 리본" },
  { number: 652, label: "금빛 리본" },
  { number: 653, label: "진주빛 분홍 리본" },
  { number: 654, label: "검정 리본" },
  { number: 655, label: "오팔 별 반짝이" },
  { number: 656, label: "분홍 별 반짝이" },
  { number: 657, label: "보라 별 반짝이" },
  { number: 658, label: "파란 별 반짝이" },
  { number: 659, label: "민트 별 반짝이" },
  { number: 660, label: "분홍 별" },
  { number: 661, label: "오팔 별" },
  { number: 662, label: "유성별" },
  { number: 663, label: "오팔 행성" },
  { number: 664, label: "분홍 튤립" },
  { number: 665, label: "파란 수국" },
  { number: 666, label: "은방울꽃" },
  { number: 667, label: "체리" },
  { number: 668, label: "분홍 딸기" },
  { number: 669, label: "산딸기" },
  { number: 670, label: "블루베리" },
  { number: 671, label: "노란 레몬" },
  { number: 672, label: "연두 포도" },
  { number: 673, label: "멜론" },
  { number: 674, label: "딸기 케이크" },
  { number: 675, label: "바닐라 푸딩" },
  { number: 676, label: "딸기 아이스크림" },
  { number: 677, label: "핑크 에이드" },
  { number: 678, label: "분홍 찻잔" },
  { number: 679, label: "유리 촛불" },
  { number: 680, label: "리본 선물" },
  { number: 681, label: "분홍 콤팩트" },
  { number: 682, label: "보라 헤드폰" },
  { number: 683, label: "분홍 카메라" },
  { number: 684, label: "분홍 노트북" },
  { number: 685, label: "리본 선물 상자" },
  { number: 686, label: "파스텔 책 더미" },
  { number: 687, label: "분홍 체크리스트" },
  { number: 688, label: "분홍 하트" },
  { number: 689, label: "별 장식 하트" },
  { number: 690, label: "보석 하트" },
  { number: 691, label: "하트 윤곽" },
  { number: 692, label: "리본 달린 하트" },
  { number: 693, label: "하트 열쇠" },
  { number: 694, label: "두 개의 하트" },
  { number: 695, label: "분홍 리본" },
  { number: 696, label: "진주빛 리본" },
  { number: 697, label: "체크 리본" },
  { number: 698, label: "새틴 리본" },
  { number: 699, label: "분홍 리본 장식" },
  { number: 700, label: "별 장식" },
  { number: 701, label: "유성 별" },
  { number: 702, label: "분홍 반짝이 별" },
  { number: 703, label: "벚꽃" },
  { number: 704, label: "장미" },
  { number: 705, label: "분홍 튤립" },
  { number: 706, label: "분홍 데이지" },
  { number: 707, label: "복숭아" },
  { number: 708, label: "버건디 하트" },
  { number: 709, label: "자주색 하트" },
  { number: 710, label: "보라색 하트" },
  { number: 711, label: "남색 하트" },
  { number: 712, label: "검정 하트" },
  { number: 713, label: "광택 와인 하트" },
  { number: 714, label: "은색 하트" },
  { number: 715, label: "루비 하트" },
  { number: 716, label: "하트 윤곽" },
  { number: 717, label: "겹친 하트" },
  { number: 718, label: "버건디 리본" },
  { number: 719, label: "자주색 리본" },
  { number: 720, label: "남색 리본" },
  { number: 721, label: "검정 리본" },
  { number: 722, label: "시스루 장미 리본" },
  { number: 723, label: "회보라 리본" },
  { number: 724, label: "체크 리본" },
  { number: 725, label: "하트 자물쇠" },
  { number: 726, label: "하트 열쇠" },
  { number: 727, label: "버건디 반짝이" },
  { number: 728, label: "남색 반짝이" },
  { number: 729, label: "은색 반짝이" },
  { number: 730, label: "버건디 별" },
  { number: 731, label: "남색 별" },
  { number: 732, label: "은색 별" },
  { number: 733, label: "핑크 마카롱" },
  { number: 734, label: "체리 컵케이크" },
  { number: 735, label: "딸기 아이스크림" },
  { number: 736, label: "분홍 찻주전자" },
  { number: 737, label: "와인 잔" },
  { number: 738, label: "분홍 리본 립스틱" },
  { number: 739, label: "분홍 네일 폴리시" },
  { number: 740, label: "하트 거울" },
  { number: 741, label: "분홍 카메라" },
  { number: 742, label: "분홍 전화기" },
  { number: 743, label: "분홍 노트북" },
  { number: 744, label: "분홍 쇼핑백" },
  { number: 745, label: "하트 장식 달력" },
  { number: 746, label: "분홍 펜" },
  { number: 747, label: "분홍 체크리스트" },
  { number: 748, label: "분홍 바인더 클립" },
  { number: 749, label: "분홍 종이 클립" },
  { number: 750, label: "민트 하트" },
  { number: 751, label: "흰색 하트" },
  { number: 752, label: "보석 하트" },
  { number: 753, label: "하트 윤곽" },
  { number: 754, label: "겹친 하트" },
  { number: 755, label: "크림색 리본" },
  { number: 756, label: "파란 체크 리본" },
  { number: 757, label: "분홍 체크 리본" },
  { number: 758, label: "작은 별 반짝이" },
  { number: 759, label: "금빛 별" },
  { number: 760, label: "흰 꽃" },
  { number: 761, label: "보라 꽃" },
  { number: 762, label: "파란 꽃" },
  { number: 763, label: "흰 백합" },
  { number: 764, label: "보라 초승달" },
  { number: 765, label: "분홍 초승달" },
  { number: 766, label: "북극성" },
  { number: 767, label: "눈송이" },
  { number: 768, label: "비눗방울" },
  { number: 769, label: "분홍 벚꽃" },
  { number: 770, label: "은빛 백합" },
  { number: 771, label: "초록 네잎클로버" },
  { number: 772, label: "파란 수국" },
  { number: 773, label: "은방울꽃" },
  { number: 774, label: "하트 복숭아" },
  { number: 775, label: "노란 레몬" },
  { number: 776, label: "분홍 젤리" },
  { number: 777, label: "오팔 다이아몬드" },
]);

/**
 * The illustration sheet was assembled from many source sheets, so its saved
 * numeric order jumps between unrelated objects. Put recognizable families
 * together in the picker. Any icon not listed here keeps its stable source
 * order after these curated groups.
 */
const pinkIllustrationGroups: readonly (readonly number[])[] = [
  // Cameras stay together, followed by computer and phone illustrations.
  [59, 155, 318, 415, 516, 594],
  [2, 98, 111, 114, 129, 197, 198, 248, 360, 368, 371, 372, 381, 387, 489, 528],
  [5, 66, 81, 120, 191, 247, 302, 359, 383, 418, 556],
  // Office supplies, writing tools, notes, books, files, and bags.
  [11, 13, 14, 15, 18, 19, 21, 25, 51, 54, 56, 61, 62, 82, 85, 96, 106, 112, 115, 124, 143, 149, 176, 194, 195, 200, 201, 202, 203, 205, 206, 207, 253, 261, 268, 272, 377, 379, 385, 396, 436, 441, 442, 449, 490, 493, 494, 524, 525, 526, 533, 535, 561, 562, 563, 564, 567, 568],
  [16, 64, 79, 94, 120, 159, 193, 251, 309, 312, 349, 369, 386, 433, 508, 534],
  [17, 28, 49, 80, 89, 95, 116, 117, 165, 208, 220, 267, 296, 303, 365, 367, 380, 435, 447, 503, 512, 514, 571, 574, 576],
  // Pink hearts and heart-shaped gifts.
  [10, 20, 53, 54, 72, 76, 87, 88, 101, 107, 113, 130, 138, 225, 232, 242, 250, 269, 275, 290, 300, 303, 315, 317, 328, 339, 346, 356, 374, 391, 392, 401, 425, 452, 479, 487, 492, 515, 522, 527, 535, 554, 572, 588, 592, 598, 599, 605, 607, 608, 613],
  // Cats and other cuddly characters.
  [6, 26, 40, 41, 44, 45, 47, 63, 65, 71, 78, 83, 84, 93, 95, 97, 99, 103, 108, 117, 118, 122, 166, 167, 169, 177, 179, 181, 182, 183, 184, 185, 186, 187, 189, 190, 252, 255, 257, 259, 278, 279, 280, 281, 283, 284, 285, 286, 287, 325, 340, 343, 350, 354, 355, 357, 358, 363, 367, 370, 373, 376, 380, 384, 388, 389, 400, 422, 429, 430, 431, 434, 444, 477, 483, 520, 529, 530, 537, 540, 546, 547, 548, 552, 577, 601, 602, 604, 608, 610, 611],
  // Flowers, plants, weather, and other nature illustrations.
  [4, 8, 35, 43, 57, 58, 69, 90, 131, 135, 136, 137, 140, 158, 172, 178, 219, 223, 235, 236, 238, 239, 243, 245, 262, 288, 289, 293, 295, 298, 299, 314, 320, 321, 323, 324, 334, 335, 341, 343, 344, 347, 403, 404, 405, 410, 417, 420, 439, 465, 471, 472, 473, 474, 475, 476, 478, 482, 484, 511, 518, 519, 542, 543, 545, 549, 550, 553, 593, 596, 597, 600, 603, 604, 609],
  // Cups, sweets, fruit, and other food or travel items.
  [1, 31, 32, 33, 34, 35, 37, 39, 46, 60, 73, 74, 75, 77, 91, 104, 105, 132, 141, 144, 145, 146, 147, 148, 150, 160, 164, 170, 196, 204, 210, 212, 213, 214, 215, 221, 222, 224, 226, 227, 229, 230, 231, 234, 241, 244, 254, 256, 258, 263, 266, 275, 291, 292, 294, 297, 304, 307, 310, 311, 313, 316, 319, 322, 326, 327, 329, 331, 332, 333, 337, 338, 353, 375, 382, 393, 394, 395, 397, 399, 402, 406, 411, 412, 413, 416, 421, 423, 426, 427, 428, 432, 437, 438, 440, 443, 445, 446, 450, 451, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 466, 467, 468, 469, 470, 481, 485, 486, 491, 495, 496, 497, 499, 500, 501, 506, 509, 510, 513, 521, 536, 538, 541, 544, 555, 559, 560, 565, 566, 569, 570, 575, 578, 580, 581, 582, 583, 584, 585, 586, 587, 589, 590, 591, 592, 595, 598],
  // New heart designs stay together for easy side-by-side size comparison.
  [639, 640, 641, 642, 643, 644, 645, 646, 688, 689, 690, 691, 692, 693, 694, 708, 709, 710, 711, 712, 713, 714, 715, 716, 717, 725, 726, 740, 745, 750, 751, 752, 753, 754, 774],
  // Ribbon color and fabric variations stay in one group.
  [647, 648, 649, 650, 651, 652, 653, 654, 680, 685, 695, 696, 697, 698, 699, 718, 719, 720, 721, 722, 723, 724, 738, 755, 756, 757],
  // Moons, stars, planets, snow, and sparkle motifs.
  [614, 615, 616, 617, 655, 656, 657, 658, 659, 660, 661, 662, 663, 700, 701, 702, 730, 731, 732, 758, 759, 764, 765, 767, 768],
  // Flowers and plants grouped independently from food.
  [618, 619, 620, 621, 622, 623, 624, 625, 664, 665, 666, 703, 704, 705, 760, 761, 762, 763, 769, 770, 771, 772, 773],
  // Fruit, drinks, desserts, and candle art.
  [626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 667, 668, 669, 670, 671, 672, 673, 674, 675, 676, 677, 678, 679, 707, 733, 734, 735, 736, 737, 775, 776],
  // Cameras, phones, computers, and headphones.
  [682, 683, 684, 741, 742, 743],
  // Beauty items, stationery, accessories, and household objects.
  [681, 686, 687, 706, 727, 728, 729, 739, 744, 746, 747, 748, 749, 766, 777],
];

const arrangePinkIllustrations = (choices: WorkspaceIconChoice[]): WorkspaceIconChoice[] => {
  const byNumber = new Map(choices.map((choice) => [Number(choice.id.slice(-3)), choice] as const));
  const arranged: WorkspaceIconChoice[] = [];
  const used = new Set<number>();

  for (const group of pinkIllustrationGroups) {
    for (const number of group) {
      const choice = byNumber.get(number);
      if (!choice || used.has(number) || unusablePinkIllustrationSlots.has(number)) continue;
      arranged.push(choice);
      used.add(number);
    }
  }

  for (const choice of choices) {
    const number = Number(choice.id.slice(-3));
    if (used.has(number) || unusablePinkIllustrationSlots.has(number)) continue;
    arranged.push(choice);
    used.add(number);
  }

  return arranged;
};

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
      // The distorted face artwork alone needs a smaller drawing so its round
      // face matches neighboring expressions. Heart decorations keep source size.
      src:
        collection === "emoji-expressions" && number === 146
          ? "/workspace-icons/emoji-expressions/146-balanced.webp"
          : `/workspace-icons/${collection}/${String(number).padStart(3, "0")}.webp`,
      label: extraLabels[number] ?? `${label} ${number}`,
    }));

const expressionEmojis = emojiSheet("emoji-expressions", "표정·손", 146, {
  141: "점선 얼굴",
  142: "싸움 구름",
  143: "하트 장식 열나는 얼굴",
  // 144–150은 Drive 이미지에서 표정 하나씩 잘라 배경을 정리한 아이콘입니다.
  144: "혀 내민 장난 표정",
  145: "빙글빙글 어지러운 얼굴",
  146: "왜곡된 얼굴",
});

/**
 * Keep each stored icon URL stable while showing newer faces beside similar
 * expressions. This makes the picker browse by facial expression rather than
 * hiding every recent face at the end of the numbered source sheet.
 */
const expressionFaceInsertions: Readonly<Record<number, readonly number[]>> = {
  26: [144], // Put the tongue-out, zany face beside its playful lookalikes.
  48: [142], // The comic fight cloud belongs beside the angry face.
  53: [146], // Put the wide-eyed distorted face beside surprised faces.
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
    ...arrangePinkIllustrations([
      ...numberedIcons("pink-iphone", 598, "일러스트 아이콘"),
      ...pinkStickerAdditions,
      ...pinkDriveAdditions,
    ]),
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
