/**
 * ============================================================
 * [Diary] Document state hook / 날짜별 페이지 상태
 * ============================================================
 *
 * Consumer: src/components/diary/DiaryWorkspace.tsx
 * Types: src/types/diary.ts
 * Persistence: useLocalStorage -> glassdayStorage event/cloud snapshot bridge
 * Media bytes: src/lib/mediaStore.ts (IndexedDB, referenced by assetId)
 */
import { useMemo } from "react";

import { useLocalStorage } from "./useLocalStorage";
import {
  DIARY_DOCUMENT_STORAGE_KEY,
  type DiaryDocument,
  type DiaryItem,
  type DiaryPage,
} from "../types/diary";

const createItemId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `diary-${crypto.randomUUID()}`;
  }

  return `diary-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const emptyDocument: DiaryDocument = {
  version: 1,
  pages: {},
};

const createEmptyPage = (date: string): DiaryPage => ({
  date,
  items: [],
  updatedAt: Date.now(),
});

const normalizeItem = (item: Partial<DiaryItem>, index: number): DiaryItem => ({
  id: typeof item.id === "string" ? item.id : createItemId(),
  type:
    item.type === "photo" || item.type === "sticker" ? item.type : "text",
  x: Number.isFinite(item.x) ? Number(item.x) : 80 + index * 24,
  y: Number.isFinite(item.y) ? Number(item.y) : 80 + index * 24,
  width: Number.isFinite(item.width) ? Math.max(60, Number(item.width)) : 260,
  height: Number.isFinite(item.height) ? Math.max(50, Number(item.height)) : 160,
  rotation: Number.isFinite(item.rotation) ? Number(item.rotation) : 0,
  zIndex: Number.isFinite(item.zIndex) ? Number(item.zIndex) : index + 1,
  text: typeof item.text === "string" ? item.text : "",
  assetId: typeof item.assetId === "string" ? item.assetId : undefined,
  background: typeof item.background === "string" ? item.background : undefined,
  color: typeof item.color === "string" ? item.color : undefined,
});

const normalizeDocument = (value: DiaryDocument): DiaryDocument => {
  const pages = Object.fromEntries(
    Object.entries(value?.pages ?? {}).map(([date, page]) => [
      date,
      {
        date,
        updatedAt: Number.isFinite(page?.updatedAt) ? page.updatedAt : Date.now(),
        items: Array.isArray(page?.items)
          ? page.items.map((item, index) => normalizeItem(item, index))
          : [],
      } satisfies DiaryPage,
    ])
  );

  return { version: 1, pages };
};

export const useDiaryDocument = (selectedDate: string) => {
  const { value: storedDocument, setValue: setDocument } =
    useLocalStorage<DiaryDocument>(DIARY_DOCUMENT_STORAGE_KEY, emptyDocument);
  const document = useMemo(
    () => normalizeDocument(storedDocument),
    [storedDocument]
  );
  const page = document.pages[selectedDate] ?? createEmptyPage(selectedDate);

  const updatePage = (updater: (current: DiaryPage) => DiaryPage) => {
    setDocument((current) => {
      const normalized = normalizeDocument(current);
      const currentPage = normalized.pages[selectedDate] ?? createEmptyPage(selectedDate);
      const nextPage = updater(currentPage);

      return {
        ...normalized,
        pages: {
          ...normalized.pages,
          [selectedDate]: {
            ...nextPage,
            date: selectedDate,
            updatedAt: Date.now(),
          },
        },
      };
    });
  };

  const addItem = (draft: Omit<DiaryItem, "id" | "zIndex">) => {
    const item: DiaryItem = {
      ...draft,
      id: createItemId(),
      zIndex: Math.max(0, ...page.items.map((candidate) => candidate.zIndex)) + 1,
    };

    updatePage((current) => ({
      ...current,
      items: [...current.items, item],
    }));

    return item;
  };

  const updateItem = (itemId: string, patch: Partial<DiaryItem>) => {
    updatePage((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId ? normalizeItem({ ...item, ...patch }, 0) : item
      ),
    }));
  };

  const removeItem = (itemId: string) => {
    updatePage((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
    }));
  };

  const bringItemToFront = (itemId: string) => {
    const nextZIndex = Math.max(0, ...page.items.map((item) => item.zIndex)) + 1;
    updateItem(itemId, { zIndex: nextZIndex });
  };

  return {
    document,
    page,
    addItem,
    updateItem,
    removeItem,
    bringItemToFront,
  };
};
