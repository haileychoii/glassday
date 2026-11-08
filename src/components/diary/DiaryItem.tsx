/**
 * ============================================================
 * [Diary] One movable page item / 자유 배치 요소 한 개
 * ============================================================
 *
 * Connections / 연결:
 * - Parent canvas: src/components/diary/DiaryPage.tsx
 * - Saved metadata: src/hooks/useDiaryDocument.ts
 * - Photo bytes: src/lib/mediaStore.ts
 * - Interaction engine: react-moveable (drag, resize, rotate)
 *
 * React state is not updated for every pointer pixel. Moveable changes the DOM
 * while the pointer is moving, then this component commits one logical-canvas
 * patch when the gesture ends. / 드래그 중에는 DOM만 움직이고 손을 놓을 때
 * 한 번만 저장하여 localStorage 새로고침 비용을 줄인다.
 * ============================================================
 */
import {
  BringToFront,
  GripHorizontal,
  Image as ImageIcon,
  ImagePlus,
  Trash2,
} from "lucide-react";
import Moveable, {
  type OnDrag,
  type OnResize,
  type OnRotate,
} from "react-moveable";
import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import { getDiaryAsset } from "../../lib/mediaStore";
import {
  DIARY_CANVAS_HEIGHT,
  DIARY_CANVAS_WIDTH,
  type DiaryItem as DiaryItemModel,
} from "../../types/diary";

type DiaryItemProps = {
  item: DiaryItemModel;
  selected: boolean;
  canvasRef: RefObject<HTMLDivElement | null>;
  onSelect: (itemId: string) => void;
  onChange: (itemId: string, patch: Partial<DiaryItemModel>) => void;
  onReplaceMedia: (itemId: string, file: File) => void;
  onBringToFront: (itemId: string) => void;
  onRemove: (itemId: string) => void;
};

const MIN_ITEM_WIDTH = 80;
const MIN_ITEM_HEIGHT = 56;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

export const DiaryItem = ({
  item,
  selected,
  canvasRef,
  onSelect,
  onChange,
  onReplaceMedia,
  onBringToFront,
  onRemove,
}: DiaryItemProps) => {
  const [targetElement, setTargetElement] = useState<HTMLDivElement | null>(null);
  const [dragHandleElement, setDragHandleElement] =
    useState<HTMLButtonElement | null>(null);
  const [asset, setAsset] = useState<{ id: string; url: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pendingPatchRef = useRef<Partial<DiaryItemModel> | null>(null);

  useEffect(() => {
    const assetId = item.assetId;
    if (!assetId) return;

    let active = true;
    let objectUrl: string | null = null;

    void getDiaryAsset(assetId).then((blob) => {
      if (!blob || !active) return;

      objectUrl = URL.createObjectURL(blob);
      setAsset({ id: assetId, url: objectUrl });
    }).catch((error) => console.error("Unable to load diary image", error));

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item.assetId]);

  const getCanvasScale = () => {
    const canvasRect = canvasRef.current?.getBoundingClientRect();

    return {
      x: canvasRect?.width ? DIARY_CANVAS_WIDTH / canvasRect.width : 1,
      y: canvasRect?.height ? DIARY_CANVAS_HEIGHT / canvasRect.height : 1,
    };
  };

  const normalizePatch = (patch: Partial<DiaryItemModel>) => {
    const width = clamp(
      patch.width ?? item.width,
      MIN_ITEM_WIDTH,
      DIARY_CANVAS_WIDTH
    );
    const height = clamp(
      patch.height ?? item.height,
      MIN_ITEM_HEIGHT,
      DIARY_CANVAS_HEIGHT
    );

    return {
      ...patch,
      width,
      height,
      x: clamp(patch.x ?? item.x, 0, DIARY_CANVAS_WIDTH - width),
      y: clamp(patch.y ?? item.y, 0, DIARY_CANVAS_HEIGHT - height),
    } satisfies Partial<DiaryItemModel>;
  };

  const applyCommittedStyle = (
    target: HTMLElement | SVGElement,
    patch: Partial<DiaryItemModel>
  ) => {
    const next = normalizePatch(patch);

    target.style.left = toPercent(next.x ?? item.x, DIARY_CANVAS_WIDTH);
    target.style.top = toPercent(next.y ?? item.y, DIARY_CANVAS_HEIGHT);
    target.style.width = toPercent(next.width ?? item.width, DIARY_CANVAS_WIDTH);
    target.style.height = toPercent(next.height ?? item.height, DIARY_CANVAS_HEIGHT);
    target.style.transform = `rotate(${next.rotation ?? item.rotation}deg)`;
  };

  const commitInteraction = (target: HTMLElement | SVGElement) => {
    const patch = pendingPatchRef.current;
    if (!patch) return;

    const normalized = normalizePatch(patch);
    applyCommittedStyle(target, normalized);
    pendingPatchRef.current = null;
    onChange(item.id, normalized);
  };

  const handleDrag = (event: OnDrag) => {
    const scale = getCanvasScale();
    const [deltaX, deltaY] = event.beforeTranslate;

    event.target.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${item.rotation}deg)`;
    pendingPatchRef.current = normalizePatch({
      x: item.x + deltaX * scale.x,
      y: item.y + deltaY * scale.y,
    });
  };

  const handleResize = (event: OnResize) => {
    const scale = getCanvasScale();
    const [deltaX, deltaY] = event.drag.beforeTranslate;

    event.target.style.width = `${event.width}px`;
    event.target.style.height = `${event.height}px`;
    event.target.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${item.rotation}deg)`;
    pendingPatchRef.current = normalizePatch({
      x: item.x + deltaX * scale.x,
      y: item.y + deltaY * scale.y,
      width: event.width * scale.x,
      height: event.height * scale.y,
    });
  };

  const handleRotate = (event: OnRotate) => {
    event.target.style.transform = `rotate(${event.rotation}deg)`;
    pendingPatchRef.current = { rotation: event.rotation };
  };

  return (
    <>
      <div
        ref={setTargetElement}
        className={`diary-item diary-item-${item.type}${selected ? " is-selected" : ""}`}
        style={{
          left: toPercent(item.x, DIARY_CANVAS_WIDTH),
          top: toPercent(item.y, DIARY_CANVAS_HEIGHT),
          width: toPercent(item.width, DIARY_CANVAS_WIDTH),
          height: toPercent(item.height, DIARY_CANVAS_HEIGHT),
          transform: `rotate(${item.rotation}deg)`,
          zIndex: item.zIndex,
          background: item.background,
          color: item.color,
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelect(item.id);
        }}
        data-diary-item-id={item.id}
      >
        {selected && (
          <div className="diary-item-tools" aria-label="Selected item tools">
            <button
              ref={setDragHandleElement}
              type="button"
              className="diary-item-tool diary-item-drag-handle"
              title="Move item"
              aria-label="Move item"
            >
              <GripHorizontal aria-hidden="true" />
            </button>

            {item.type !== "text" && (
              <button
                type="button"
                className="diary-item-tool"
                onClick={() => imageInputRef.current?.click()}
                title="Replace image"
                aria-label="Replace image"
              >
                <ImagePlus aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              className="diary-item-tool"
              onClick={() => onBringToFront(item.id)}
              title="Bring to front"
              aria-label="Bring item to front"
            >
              <BringToFront aria-hidden="true" />
            </button>

            <button
              type="button"
              className="diary-item-tool is-danger"
              onClick={() => onRemove(item.id)}
              title="Delete item"
              aria-label="Delete item"
            >
              <Trash2 aria-hidden="true" />
            </button>
          </div>
        )}

        {item.type === "text" ? (
          <textarea
            className="diary-text-editor"
            value={item.text ?? ""}
            onChange={(event) => onChange(item.id, { text: event.target.value })}
            placeholder="Write something..."
            aria-label="Diary text"
          />
        ) : asset && asset.id === item.assetId ? (
          <img
            className="diary-media-image"
            src={asset.url}
            alt={item.type === "sticker" ? "Diary sticker" : "Diary photo"}
            draggable={false}
          />
        ) : (
          <button
            type="button"
            className="diary-media-placeholder"
            onClick={() => imageInputRef.current?.click()}
            aria-label={item.assetId ? "Image unavailable; choose another" : "Choose image for this slot"}
            title="Choose image"
          >
            <ImageIcon aria-hidden="true" />
          </button>
        )}
        {item.type !== "text" && (
          <input
            ref={imageInputRef}
            type="file"
            accept={item.type === "sticker" ? "image/png,image/webp,image/gif" : "image/*"}
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onReplaceMedia(item.id, file);
            }}
          />
        )}
      </div>

      {selected && targetElement && (
        <Moveable
          target={targetElement}
          dragTarget={dragHandleElement}
          draggable
          resizable
          rotatable
          keepRatio={item.type !== "text"}
          rotationPosition="top"
          origin={false}
          throttleResize={1}
          throttleRotate={1}
          onDragStart={(event) => event.set([0, 0])}
          onDrag={handleDrag}
          onDragEnd={(event) => commitInteraction(event.target)}
          onResize={handleResize}
          onResizeEnd={(event) => commitInteraction(event.target)}
          onRotateStart={(event) => event.set(item.rotation)}
          onRotate={handleRotate}
          onRotateEnd={(event) => commitInteraction(event.target)}
        />
      )}
    </>
  );
};
