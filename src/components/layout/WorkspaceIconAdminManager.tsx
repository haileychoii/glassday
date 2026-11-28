import { ArrowLeft, GripVertical, ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type PointerEvent } from "react";

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
type DragState = { id: string; collection: WorkspaceIconCollectionId; lastTarget: string | null };

const toDraft = (catalog: WorkspaceIconCatalog): DraftCatalog =>
  Object.fromEntries(
    categories.map(({ id }) => [id, catalog[id].map((choice) => ({ ...choice }))])
  ) as DraftCatalog;

const reorder = <T extends { id: string }>(items: T[], sourceId: string, targetId: string): T[] => {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return items;

  const result = [...items];
  const [moved] = result.splice(sourceIndex, 1);
  result.splice(targetIndex, 0, moved);
  return result;
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const previewUrlsRef = useRef<string[]>([]);

  useEffect(() => () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const target = document.elementFromPoint(event.clientX, event.clientY);
      const targetCard = target?.closest<HTMLElement>("[data-admin-icon-id]");
      const targetId = targetCard?.dataset.adminIconId;
      if (!targetId || targetId === drag.id) {
        drag.lastTarget = null;
        return;
      }
      if (drag.lastTarget === targetId) return;

      drag.lastTarget = targetId;
      setDraft((current) => ({
        ...current,
        [drag.collection]: reorder(current[drag.collection], drag.id, targetId),
      }));
    };

    const finishDrag = () => {
      dragRef.current = null;
      setDraggingId(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    };
  }, []);

  const startDrag = (
    event: PointerEvent<HTMLButtonElement> | DragEvent<HTMLElement>,
    id: string
  ) => {
    if ("button" in event && event.button !== 0) return;
    if ("pointerId" in event) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
    } else {
      event.dataTransfer.setData("text/plain", id);
      event.dataTransfer.effectAllowed = "move";
    }
    dragRef.current = { id, collection, lastTarget: null };
    setDraggingId(id);
  };

  const handleDrop = (event: DragEvent<HTMLElement>, targetId: string) => {
    event.preventDefault();
    const dragged = dragRef.current?.id;
    if (dragged && dragged !== targetId) {
      setDraft((current) => ({
        ...current,
        [collection]: reorder(current[collection], dragged, targetId),
      }));
    }
    dragRef.current = null;
    setDraggingId(null);
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
        {draft[collection].map((choice) => (
          <article
            key={choice.id}
            className={`workspace-icon-admin-card${selectedId === choice.id ? " is-selected" : ""}${draggingId === choice.id ? " is-dragging" : ""}`}
            data-admin-icon-id={choice.id}
            role="listitem"
            draggable
            onDragStart={(event) => startDrag(event, choice.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, choice.id)}
            onDragEnd={() => {
              dragRef.current = null;
              setDraggingId(null);
            }}
          >
            <button
              className="workspace-icon-admin-drag"
              type="button"
              aria-label={`${choice.label} 순서 이동`}
              onPointerDown={(event) => startDrag(event, choice.id)}
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
              onClick={() => deleteChoice(choice.id)}
            >
              <Trash2 size={15} />
            </button>
          </article>
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
    </section>
  );
};
