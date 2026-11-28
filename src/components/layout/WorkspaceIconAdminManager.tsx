import { ArrowLeft, GripVertical, ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";

import {
  type WorkspaceIconChoice,
  type WorkspaceIconCollectionId,
} from "../../constants/workspaceIconChoices";
import {
  saveWorkspaceIconCatalog,
  type WorkspaceIconCatalog,
} from "../../lib/workspaceIconCatalog";
import { supabase } from "../../lib/supabase";
import { getWorkspaceOutlineIcon } from "./workspaceOutlineIcons";
import type { CSSProperties } from "react";

const UPLOAD_BUCKET = "workspace-icon-uploads";

const categories: Array<{ id: WorkspaceIconCollectionId; label: string }> = [
  { id: "pink-iphone", label: "일러스트" },
  { id: "retro-pixel", label: "픽셀" },
  { id: "folder-art", label: "폴더" },
  { id: "emoji-expressions", label: "표정·손" },
  { id: "emoji-people", label: "사람·동물" },
  { id: "emoji-nature", label: "자연·음식" },
  { id: "emoji-food-travel", label: "음식·이동" },
  { id: "emoji-objects", label: "생활·기호" },
  { id: "outline-icons", label: "기본 선" },
];

type DraftChoice = WorkspaceIconChoice & { pendingFile?: File };
type DraftCatalog = Record<WorkspaceIconCollectionId, DraftChoice[]>;
type DragState = {
  id: string;
  collection: WorkspaceIconCollectionId;
  startX: number;
  startY: number;
  lastY: number;
  startedAt: number;
  pointerType: string;
  mode: "pending" | "dragging" | "scrolling";
  src: string;
  label: string;
};
type DragPreview = { src: string; label: string; x: number; y: number };

const toDraft = (catalog: WorkspaceIconCatalog): DraftCatalog =>
  Object.fromEntries(
    categories.map(({ id }) => [id, catalog[id].map((choice) => ({ ...choice }))])
  ) as DraftCatalog;

/** Insert at a grid slot, including blank space after the last icon. */
const reorderAt = <T extends { id: string }>(items: T[], sourceId: string, insertionIndex: number): T[] => {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  if (sourceIndex < 0) return items;
  const result = [...items];
  const [moved] = result.splice(sourceIndex, 1);
  const adjustedIndex = Math.max(0, Math.min(result.length, insertionIndex));
  if (adjustedIndex === sourceIndex) return items;
  result.splice(adjustedIndex, 0, moved);
  return result;
};

/** Find the insertion boundary on the regular 4-column icon grid. */
const getGridInsertionIndex = (
  grid: HTMLElement,
  target: Element | null,
  x: number,
  y: number,
  sourceId: string
): number => {
  const cards = Array.from(grid.querySelectorAll<HTMLElement>("[data-admin-icon-id]"))
    .filter((card) => card.dataset.adminIconId !== sourceId);
  if (cards.length === 0) return 0;
  const hitCard = target?.closest<HTMLElement>("[data-admin-icon-id]");
  const hitIndex = hitCard?.dataset.adminIconId !== sourceId && hitCard ? cards.indexOf(hitCard) : -1;
  const candidates = hitIndex >= 0 ? [cards[hitIndex]] : cards;
  const nearest = candidates.reduce<{ card: HTMLElement; distance: number } | null>((best, card) => {
    const rect = card.getBoundingClientRect();
    const distance = Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2));
    return !best || distance < best.distance ? { card, distance } : best;
  }, null);
  if (!nearest) return cards.length;
  const index = cards.indexOf(nearest.card);
  const rect = nearest.card.getBoundingClientRect();
  const after = y > rect.top + rect.height / 2 ||
    (Math.abs(y - (rect.top + rect.height / 2)) <= rect.height / 2 && x > rect.left + rect.width / 2);
  return index + (after ? 1 : 0);
};

const fileExtension = (file: File): string => {
  const fromName = file.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif", "avif"].includes(fromName ?? "")) {
    return fromName === "jpeg" ? "jpg" : fromName!;
  }
  const fromType: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  };
  return fromType[file.type] ?? "png";
};

type WorkspaceIconAdminManagerProps = {
  catalog: WorkspaceIconCatalog;
  onCancel: () => void;
  onSaved: (catalog: WorkspaceIconCatalog) => void;
  className?: string;
  style?: CSSProperties;
};

export const WorkspaceIconAdminManager = ({ catalog, onCancel, onSaved, className, style }: WorkspaceIconAdminManagerProps) => {
  const [draft, setDraft] = useState<DraftCatalog>(() => toDraft(catalog));
  const [collection, setCollection] = useState<WorkspaceIconCollectionId>("pink-iphone");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const previewUrlsRef = useRef<string[]>([]);
  const dropIndexRef = useRef<number | null>(null);
  const previousCardRectsRef = useRef<Map<string, DOMRect> | null>(null);
  const pointerPositionRef = useRef<{ x: number; y: number } | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const previousRects = previousCardRectsRef.current;
    if (!previousRects) return;
    previousCardRectsRef.current = null;
    document.querySelectorAll<HTMLElement>(".workspace-icon-admin-grid [data-admin-icon-id]").forEach((card) => {
      const id = card.dataset.adminIconId;
      const previous = id ? previousRects.get(id) : undefined;
      if (!previous) return;
      const current = card.getBoundingClientRect();
      const deltaX = previous.left - current.left;
      const deltaY = previous.top - current.top;
      if (deltaX || deltaY) {
        card.animate(
          [{ transform: `translate(${deltaX}px, ${deltaY}px)` }, { transform: "translate(0, 0)" }],
          { duration: 180, easing: "cubic-bezier(0.2, 0.75, 0.25, 1)" }
        );
      }
    });
  }, [dropIndex]);

  useEffect(() => () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    const clearDropSlot = () => {
      if (dropIndexRef.current !== null) {
        dropIndexRef.current = null;
        setDropIndex(null);
      }
    };

    const updateDropSlot = (grid: HTMLElement, target: Element | null, x: number, y: number, sourceId: string) => {
      const insertionIndex = getGridInsertionIndex(grid, target, x, y, sourceId);
      if (dropIndexRef.current === insertionIndex) return;
      previousCardRectsRef.current = new Map(
        Array.from(grid.querySelectorAll<HTMLElement>("[data-admin-icon-id]"))
          .map((card) => [card.dataset.adminIconId ?? "", card.getBoundingClientRect()])
      );
      dropIndexRef.current = insertionIndex;
      setDropIndex(insertionIndex);
    };

    const updateDropTargetAtPointer = (x: number, y: number, sourceId: string) => {
      const target = document.elementFromPoint(x, y);
      const targetCard = target?.closest<HTMLElement>("[data-admin-icon-id]");
      const targetCategory = target?.closest<HTMLElement>("[data-admin-collection]");
      const grid = document.querySelector<HTMLElement>(".workspace-icon-admin-grid");
      if (grid?.contains(target as Node)) {
        updateDropSlot(grid, target, x, y, sourceId);
        setDropTargetId(targetCard?.dataset.adminIconId ?? null);
      } else {
        clearDropSlot();
        setDropTargetId(targetCategory?.dataset.adminCollection ?? null);
      }
    };

    const autoScrollTick = () => {
      autoScrollFrameRef.current = null;
      const drag = dragRef.current;
      const pointer = pointerPositionRef.current;
      const grid = document.querySelector<HTMLElement>(".workspace-icon-admin-grid");
      if (!drag || drag.mode !== "dragging" || !pointer || !grid) return;

      const rect = grid.getBoundingClientRect();
      const edgeZone = Math.min(64, rect.height * 0.2);
      const topAmount = Math.max(0, Math.min(1, (rect.top + edgeZone - pointer.y) / edgeZone));
      const bottomAmount = Math.max(0, Math.min(1, (pointer.y - (rect.bottom - edgeZone)) / edgeZone));
      const scrollSpeed = topAmount > 0
        ? -Math.max(2, Math.ceil(18 * topAmount * topAmount))
        : bottomAmount > 0
          ? Math.max(2, Math.ceil(18 * bottomAmount * bottomAmount))
          : 0;

      if (scrollSpeed) {
        const previousScrollTop = grid.scrollTop;
        grid.scrollTop += scrollSpeed;
        if (grid.scrollTop !== previousScrollTop) {
          updateDropTargetAtPointer(pointer.x, pointer.y, drag.id);
          autoScrollFrameRef.current = requestAnimationFrame(autoScrollTick);
        }
      }
    };

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const deltaY = drag.lastY - event.clientY;
      drag.lastY = event.clientY;

      // Touch swipes scroll the library. Holding briefly before moving starts
      // icon sorting, matching the familiar home-screen long-press interaction.
      if (drag.pointerType === "touch" && drag.mode === "pending") {
        const deltaX = event.clientX - drag.startX;
        const deltaFromStartY = event.clientY - drag.startY;
        if (Date.now() - drag.startedAt < 250 && Math.abs(deltaFromStartY) >= 6 && Math.abs(deltaFromStartY) >= Math.abs(deltaX)) {
          drag.mode = "scrolling";
          suppressClickRef.current = true;
        } else if (Date.now() - drag.startedAt < 250 && Math.abs(deltaX) >= 6 && Math.abs(deltaX) > Math.abs(deltaFromStartY)) {
          drag.mode = "dragging";
        } else if (Date.now() - drag.startedAt >= 250 && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= 6) {
          drag.mode = "dragging";
        } else {
          return;
        }
      } else if (drag.mode === "pending") {
        if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
        drag.mode = "dragging";
      }

      if (drag.mode === "scrolling") {
        const grid = document.querySelector<HTMLElement>(".workspace-icon-admin-grid");
        if (grid) grid.scrollTop += deltaY;
        return;
      }

      if (drag.mode === "dragging") {
        setDraggingId(drag.id);
        setDragPreview({ src: drag.src, label: drag.label, x: event.clientX, y: event.clientY });
        pointerPositionRef.current = { x: event.clientX, y: event.clientY };
      }

      updateDropTargetAtPointer(event.clientX, event.clientY, drag.id);
      if (drag.mode === "dragging" && autoScrollFrameRef.current === null) {
        autoScrollFrameRef.current = requestAnimationFrame(autoScrollTick);
      }
    };

    const finishDrag = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (drag?.mode === "dragging") {
        suppressClickRef.current = true;
        window.setTimeout(() => { suppressClickRef.current = false; }, 0);
        const target = document.elementFromPoint(event.clientX, event.clientY);
        const targetCard = target?.closest<HTMLElement>("[data-admin-icon-id]");
        const targetCategory = target?.closest<HTMLElement>("[data-admin-collection]");
        const targetId = targetCard?.dataset.adminIconId;
        const targetCollection = (targetCard?.dataset.adminCollection ?? targetCategory?.dataset.adminCollection) as
          | WorkspaceIconCollectionId
          | undefined;

        if (targetCollection && targetCollection !== drag.collection) {
          const movedId = drag.id;
          setDraft((current) => {
            const moved = current[drag.collection].find((item) => item.id === movedId);
            if (!moved) return current;
            const sourceItems = current[drag.collection].filter((item) => item.id !== movedId);
            const destinationItems = [...current[targetCollection]];
            const targetIndex = targetId
              ? destinationItems.findIndex((item) => item.id === targetId)
              : -1;
            destinationItems.splice(targetIndex < 0 ? destinationItems.length : targetIndex, 0, moved);
            return {
              ...current,
              [drag.collection]: sourceItems,
              [targetCollection]: destinationItems,
            };
          });
          setCollection(targetCollection);
          setSelectedId(null);
        } else {
          const grid = document.querySelector<HTMLElement>(".workspace-icon-admin-grid");
          const insertionIndex = grid?.contains(target as Node)
            ? getGridInsertionIndex(grid, target, event.clientX, event.clientY, drag.id)
            : -1;
          if (insertionIndex >= 0) {
            setDraft((current) => ({
              ...current,
              [drag.collection]: reorderAt(current[drag.collection], drag.id, insertionIndex),
            }));
          }
        }
      }
      if (drag?.mode === "scrolling") {
        window.setTimeout(() => { suppressClickRef.current = false; }, 0);
      }
      dragRef.current = null;
      pointerPositionRef.current = null;
      if (autoScrollFrameRef.current !== null) cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
      setDraggingId(null);
      setDropTargetId(null);
      dropIndexRef.current = null;
      setDropIndex(null);
      setDragPreview(null);
    };

    const cancelDrag = () => {
      dragRef.current = null;
      pointerPositionRef.current = null;
      if (autoScrollFrameRef.current !== null) cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
      setDraggingId(null);
      setDropTargetId(null);
      dropIndexRef.current = null;
      setDropIndex(null);
      setDragPreview(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", cancelDrag);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", cancelDrag);
      if (autoScrollFrameRef.current !== null) cancelAnimationFrame(autoScrollFrameRef.current);
    };
  }, []);

  const startDrag = (event: PointerEvent<HTMLElement>, id: string) => {
    if (event.button !== 0) return;
    // The delete control keeps its own click action and must never start a drag.
    if ((event.target as HTMLElement).closest(".workspace-icon-admin-delete")) return;
    const choice = draft[collection].find((item) => item.id === id);
    if (!choice) return;
    dragRef.current = {
      id,
      collection,
      startX: event.clientX,
      startY: event.clientY,
      lastY: event.clientY,
      startedAt: Date.now(),
      pointerType: event.pointerType,
      mode: "pending",
      src: choice.src,
      label: choice.label,
    };
    setDropTargetId(null);
    dropIndexRef.current = null;
    setDropIndex(null);
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const unsupported = files.find((file) => !file.type.startsWith("image/"));
    if (unsupported) {
      setError("이미지 파일만 추가할 수 있어요.");
      event.target.value = "";
      return;
    }
    const oversized = files.find((file) => file.size > 5 * 1024 * 1024);
    if (oversized) {
      setError("이미지 한 장의 크기는 5MB 이하여야 해요.");
      event.target.value = "";
      return;
    }

    const additions = files.map((file) => {
      const src = URL.createObjectURL(file);
      previewUrlsRef.current.push(src);
      return {
        id: `pending-${crypto.randomUUID()}`,
        src,
        label: file.name.replace(/\.[^.]+$/, ""),
        pendingFile: file,
      };
    });

    setError("");
    setDraft((current) => ({
      ...current,
      [collection]: [...current[collection], ...additions],
    }));
    event.target.value = "";
  };

  const moveSelected = (nextCollection: WorkspaceIconCollectionId) => {
    if (!selectedId || nextCollection === collection) return;
    const choice = draft[collection].find((item) => item.id === selectedId);
    if (!choice) return;
    setDraft((current) => ({
      ...current,
      [collection]: current[collection].filter((item) => item.id !== selectedId),
      [nextCollection]: [...current[nextCollection], choice],
    }));
    setCollection(nextCollection);
    setSelectedId(null);
    setError("");
  };

  const deleteChoice = (id: string) => {
    const choice = draft[collection].find((item) => item.id === id);
    if (choice?.pendingFile) URL.revokeObjectURL(choice.src);
    setDraft((current) => ({
      ...current,
      [collection]: current[collection].filter((item) => item.id !== id),
    }));
    if (selectedId === id) setSelectedId(null);
  };

  const save = async () => {
    if (!supabase || saving) return;
    setSaving(true);
    setError("");
    const uploadedPaths: string[] = [];

    try {
      const persisted = {} as WorkspaceIconCatalog;
      for (const category of categories) {
        const entries: WorkspaceIconChoice[] = [];
        for (const choice of draft[category.id]) {
          if (!choice.pendingFile) {
            entries.push({ id: choice.id, src: choice.src, label: choice.label });
            continue;
          }

          const file = choice.pendingFile;
          const path = `${category.id}/${crypto.randomUUID()}.${fileExtension(file)}`;
          const { error: uploadError } = await supabase.storage
            .from(UPLOAD_BUCKET)
            .upload(path, file, { cacheControl: "31536000", contentType: file.type, upsert: false });
          if (uploadError) throw uploadError;
          uploadedPaths.push(path);
          const { data } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
          entries.push({ id: choice.id, src: data.publicUrl, label: choice.label });
        }
        persisted[category.id] = entries;
      }

      await saveWorkspaceIconCatalog(persisted);
      onSaved(persisted);
    } catch (saveError) {
      if (uploadedPaths.length && supabase) {
        await supabase.storage.from(UPLOAD_BUCKET).remove(uploadedPaths);
      }
      setError(saveError instanceof Error ? saveError.message : "아이콘 저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  const currentCategory = categories.find((item) => item.id === collection);
  const selectedChoice = draft[collection].find((item) => item.id === selectedId);
  const activeDrag = dragRef.current;
  const isSortingCurrentCategory = Boolean(
    draggingId && activeDrag?.mode === "dragging" && activeDrag.collection === collection
  );
  const sourceIndex = isSortingCurrentCategory
    ? draft[collection].findIndex((item) => item.id === draggingId)
    : -1;
  const visibleChoices = isSortingCurrentCategory
    ? draft[collection].filter((item) => item.id !== draggingId)
    : draft[collection];
  const slotIndex = isSortingCurrentCategory
    ? Math.max(0, Math.min(visibleChoices.length, dropIndex ?? sourceIndex))
    : -1;
  const gridEntries: Array<{ key: string; choice: DraftChoice | null }> = visibleChoices.map((choice) => ({
    key: choice.id,
    choice,
  }));
  if (isSortingCurrentCategory) {
    gridEntries.splice(slotIndex, 0, { key: "drag-slot", choice: null });
  }

  return (
    <section
      className={`mobile-tab-icon-picker workspace-icon-picker workspace-icon-admin${className ? ` ${className}` : ""}`}
      style={style}
      role="dialog"
      aria-label="아이콘 관리"
    >
      <header className="workspace-icon-admin-header">
        <button type="button" onClick={onCancel} aria-label="아이콘 선택으로 돌아가기">
          <ArrowLeft size={18} />
        </button>
        <div>
          <strong>아이콘 관리</strong>
          <span>드래그해 순서를 바꾸고, 추가하거나 정리하세요.</span>
        </div>
      </header>

      <div className="mobile-tab-icon-collections workspace-icon-admin-categories" role="group" aria-label="관리할 아이콘 분류">
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            data-admin-collection={item.id}
            className="mobile-tab-icon-collection"
            aria-pressed={collection === item.id}
            onClick={() => {
              setCollection(item.id);
              setSelectedId(null);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="workspace-icon-admin-tools">
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          <ImagePlus size={17} /> 아이콘 추가
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          multiple
          hidden
          onChange={handleFiles}
        />
        {selectedChoice && (
          <select
            aria-label="선택한 아이콘을 다른 분류로 이동"
            value=""
            onChange={(event) => moveSelected(event.target.value as WorkspaceIconCollectionId)}
          >
            <option value="" disabled>이동…</option>
            {categories.filter((item) => item.id !== collection).map((item) => (
              <option key={item.id} value={item.id}>{item.label}로 이동</option>
            ))}
          </select>
        )}
        <span>{draft[collection].length}개</span>
      </div>

      <div className="workspace-icon-admin-grid" role="list" aria-label={`${currentCategory?.label} 아이콘 관리`}>
        {gridEntries.map(({ key, choice }) => choice ? (
          <article
            key={key}
            className={`workspace-icon-admin-card${selectedId === choice.id ? " is-selected" : ""}${dropTargetId === choice.id ? " is-drop-target" : ""}`}
            data-admin-icon-id={choice.id}
            data-admin-collection={collection}
            role="listitem"
            draggable={false}
            onPointerDown={(event) => startDrag(event, choice.id)}
            onClickCapture={(event) => {
              if (!suppressClickRef.current) return;
              suppressClickRef.current = false;
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <button
              className="workspace-icon-admin-drag"
              type="button"
              aria-label={`${choice.label} 순서 이동`}
            >
              <GripVertical size={16} />
            </button>
            <button
              className="workspace-icon-admin-preview"
              type="button"
              aria-label={`${choice.label} 선택`}
              aria-pressed={selectedId === choice.id}
              onClick={() => setSelectedId(choice.id)}
            >
              {(() => {
                const OutlineIcon = getWorkspaceOutlineIcon(choice.src);
                return OutlineIcon
                  ? <OutlineIcon aria-hidden="true" />
                  : <img src={choice.src} alt="" draggable={false} />;
              })()}
              <span>{choice.label}</span>
            </button>
            <button
              className="workspace-icon-admin-delete"
              type="button"
              aria-label={`${choice.label} 선택 목록에서 삭제`}
              title="선택 목록에서 삭제"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => deleteChoice(choice.id)}
            >
              <Trash2 size={15} />
            </button>
          </article>
        ) : (
          <div key={key} className="workspace-icon-admin-slot" data-admin-drop-slot role="listitem" aria-hidden="true" />
        ))}
      </div>

      {error && <p className="workspace-icon-admin-error" role="alert">{error}</p>}

      <footer className="workspace-icon-picker-actions">
        <button type="button" onClick={onCancel} disabled={saving}>취소</button>
        <span className="workspace-icon-picker-spacer" />
        <button className="workspace-icon-picker-save" type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "저장 중…" : "적용"}
        </button>
      </footer>
      {dragPreview && createPortal(
        <div
          className="workspace-icon-admin-drag-preview"
          style={{ left: dragPreview.x, top: dragPreview.y }}
          aria-hidden="true"
        >
          {(() => {
            const OutlineIcon = getWorkspaceOutlineIcon(dragPreview.src);
            return OutlineIcon
              ? <OutlineIcon />
              : <img src={dragPreview.src} alt="" draggable={false} />;
          })()}
          <span>{dragPreview.label}</span>
        </div>,
        document.body
      )}
    </section>
  );
};
