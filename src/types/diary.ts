/**
 * ============================================================
 * [Diary] Free-layout document types / 자유 배치 문서 타입
 * ============================================================
 *
 * Page metadata is JSON-safe so glassdayStorage.ts can include it in backup
 * and cloud snapshots. Image bytes are referenced by assetId and stored in
 * IndexedDB through src/lib/mediaStore.ts.
 *
 * 페이지 좌표는 실제 pixel이 아니라 1000 x 700 logical canvas 기준이다.
 * 화면 크기가 달라도 같은 비율로 복원하기 위한 의도적인 좌표계다.
 */

export type DiaryItemType = "text" | "photo" | "sticker";

export type DiaryItem = {
  /** 같은 종류를 여러 번 배치할 수 있도록 type과 분리된 instance id. */
  id: string;
  type: DiaryItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  text?: string;
  assetId?: string;
  background?: string;
  color?: string;
};

export type DiaryPage = {
  date: string;
  items: DiaryItem[];
  updatedAt: number;
};

export type DiaryDocument = {
  version: 1;
  pages: Record<string, DiaryPage>;
};

/** Reusable geometry and appearance, never a dated note or personal photo. */
export type DiaryTemplateItem = Omit<DiaryItem, "id" | "text" | "assetId">;

export type DiaryTemplate = {
  id: string;
  name: string;
  items: DiaryTemplateItem[];
  createdAt: number;
};

export const DIARY_DOCUMENT_STORAGE_KEY = "glassday.diary.document.v1";
export const DIARY_TEMPLATES_STORAGE_KEY = "glassday.diary.templates.v1";
export const DIARY_CANVAS_WIDTH = 1000;
export const DIARY_CANVAS_HEIGHT = 700;
