/**
 * [Diary templates / 다이어리 템플릿]
 * Used by DiaryWorkspace.tsx; layout fields come from types/diary.ts.
 * A template deliberately excludes written text and asset IDs. / 오늘 쓴 글과
 * 사진 파일을 다음 날짜에 복사하지 않고 배치 틀만 재사용한다.
 */
import type { DiaryItem, DiaryTemplate, DiaryTemplateItem } from "../types/diary";

const createTemplateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `diary-template-${crypto.randomUUID()}`
    : `diary-template-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const createDiaryTemplate = (
  name: string,
  items: DiaryItem[]
): DiaryTemplate => ({
  id: createTemplateId(),
  name: name.trim(),
  items: items.map((item): DiaryTemplateItem => ({
    type: item.type,
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    rotation: item.rotation,
    zIndex: item.zIndex,
    background: item.background,
    color: item.color,
  })),
  createdAt: Date.now(),
});
