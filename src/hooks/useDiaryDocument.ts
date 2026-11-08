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
import { useMemo, useRef, useState } from "react";

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

type PageHistory = {
  undo: DiaryPage[];
  redo: DiaryPage[];
  lastTextEdit: { itemId: string; at: number } | null;
};

const HISTORY_LIMIT = 40;
const TEXT_EDIT_GROUP_MS = 900;

const getHistory = (histories: Record<string, PageHistory>, date: string) => {
  histories[date] ??= { undo: [], redo: [], lastTextEdit: null };
  return histories[date];
};

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
  // Undo belongs to each date and stays in memory only. Page content itself
  // remains auto-saved by useLocalStorage, including after reload. / 날짜별
  // 되돌리기는 현재 편집 세션에만 두고 원본 기록은 기존 저장 경로를 유지한다.
  const historiesRef = useRef<Record<string, PageHistory>>({});
  const [historyAvailability, setHistoryAvailability] = useState<
    Record<string, { undo: number; redo: number }>
  >({});
  const { value: storedDocument, setValue: setDocument } =
    useLocalStorage<DiaryDocument>(DIARY_DOCUMENT_STORAGE_KEY, emptyDocument);
  const document = useMemo(
    () => normalizeDocument(storedDocument),
    [storedDocument]
  );
  const page = document.pages[selectedDate] ?? createEmptyPage(selectedDate);

  const publishHistoryAvailability = (history: PageHistory) => {
    setHistoryAvailability((current) => ({
      ...current,
      [selectedDate]: { undo: history.undo.length, redo: history.redo.length },
    }));
  };

  const updatePage = (
    updater: (current: DiaryPage) => DiaryPage,
    textItemId?: string
  ) => {
    const history = getHistory(historiesRef.current, selectedDate);
    let changed = false;
    setDocument((current) => {
      const normalized = normalizeDocument(current);
      const currentPage = normalized.pages[selectedDate] ?? createEmptyPage(selectedDate);
      const nextPage = updater(currentPage);
      if (JSON.stringify(nextPage.items) === JSON.stringify(currentPage.items)) {
        return current;
      }

      const now = Date.now();
      const continuingTextEdit =
        textItemId &&
        history.lastTextEdit?.itemId === textItemId &&
        now - history.lastTextEdit.at < TEXT_EDIT_GROUP_MS;

      // useLocalStorage invokes this updater synchronously (see its publish
      // contract). A new action records the previous complete page once; quick
      // keystrokes in one text item share that undo step. / 글 입력 중 Ctrl+Z에
      // 준하는 되돌리기가 글자 하나씩만 지우지 않도록 묶는다.
      if (!continuingTextEdit) {
        history.undo.push(currentPage);
        if (history.undo.length > HISTORY_LIMIT) history.undo.shift();
      }
      history.redo = [];
      history.lastTextEdit = textItemId ? { itemId: textItemId, at: now } : null;
      changed = true;

      return {
        ...normalized,
        pages: {
          ...normalized.pages,
          [selectedDate]: {
            ...nextPage,
            date: selectedDate,
            updatedAt: now,
          },
        },
      };
    });
    if (changed) publishHistoryAvailability(history);
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
    }), Object.keys(patch).length === 1 && "text" in patch ? itemId : undefined);
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

  const restorePage = (direction: "undo" | "redo") => {
    const history = getHistory(historiesRef.current, selectedDate);
    const source = history[direction];
    if (source.length === 0) return;

    setDocument((current) => {
      const normalized = normalizeDocument(current);
      const currentPage = normalized.pages[selectedDate] ?? createEmptyPage(selectedDate);
      const restoredPage = source.pop();
      if (!restoredPage) return current;

      const destination = direction === "undo" ? history.redo : history.undo;
      destination.push(currentPage);
      if (destination.length > HISTORY_LIMIT) destination.shift();
      history.lastTextEdit = null;

      return {
        ...normalized,
        pages: {
          ...normalized.pages,
          [selectedDate]: { ...restoredPage, updatedAt: Date.now() },
        },
      };
    });
    publishHistoryAvailability(history);
  };

  return {
    document,
    page,
    addItem,
    updateItem,
    removeItem,
    bringItemToFront,
    undo: () => restorePage("undo"),
    redo: () => restorePage("redo"),
    canUndo: (historyAvailability[selectedDate]?.undo ?? 0) > 0,
    canRedo: (historyAvailability[selectedDate]?.redo ?? 0) > 0,
  };
};
