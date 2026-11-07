/**
 * ============================================================
 * [Diary] Date-based free-layout workspace / 날짜별 다이어리 작업공간
 * ============================================================
 *
 * Connections / 연결:
 * - Mounted by src/App.tsx when the locked `diary` workspace is active.
 * - Page metadata comes from src/hooks/useDiaryDocument.ts.
 * - Image files are written by src/lib/mediaStore.ts.
 * - Date helpers reuse Daily Journal logic from
 *   src/components/widgets/journal/journalUtils.ts so both screens use the
 *   same local-date rules. / Daily Journal과 날짜가 어긋나지 않게 재사용한다.
 * ============================================================
 */
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  SmilePlus,
  Type,
} from "lucide-react";
import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { useDiaryDocument } from "../../hooks/useDiaryDocument";
import { saveDiaryAsset } from "../../lib/mediaStore";
import type { DiaryItem, DiaryItemType } from "../../types/diary";
import {
  addDaysToDateString,
  todayString,
} from "../widgets/journal/journalUtils";
import { DiaryPage } from "./DiaryPage";

const formatDiaryDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${value}T00:00:00`));

export const DiaryWorkspace = () => {
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const {
    page,
    addItem,
    updateItem,
    removeItem,
    bringItemToFront,
  } = useDiaryDocument(selectedDate);

  const changeDate = (nextDate: string) => {
    setSelectedDate(nextDate);
    setSelectedItemId(null);
  };

  const getCascadePosition = () => {
    const offset = (page.items.length % 8) * 24;
    return { x: 72 + offset, y: 72 + offset };
  };

  const addTextItem = () => {
    const position = getCascadePosition();
    const item = addItem({
      type: "text",
      ...position,
      width: 320,
      height: 180,
      rotation: 0,
      text: "",
      background: "rgba(255, 255, 255, 0.78)",
      color: "#2f2938",
    });

    setSelectedItemId(item.id);
  };

  const addMediaItem = async (file: File, type: Exclude<DiaryItemType, "text">) => {
    if (!file.type.startsWith("image/")) {
      setStatus("이미지 파일만 추가할 수 있어요.");
      return;
    }

    try {
      const assetId = await saveDiaryAsset(file);
      const position = getCascadePosition();
      const item = addItem({
        type,
        ...position,
        width: type === "sticker" ? 190 : 340,
        height: type === "sticker" ? 190 : 240,
        rotation: 0,
        assetId,
      });

      setSelectedItemId(item.id);
      setStatus(type === "sticker" ? "스티커를 추가했어요." : "사진을 추가했어요.");
    } catch (error) {
      console.error("Unable to add diary media", error);
      setStatus("이미지를 저장하지 못했어요.");
    }
  };

  const handleMediaChange = (
    event: ChangeEvent<HTMLInputElement>,
    type: Exclude<DiaryItemType, "text">
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) void addMediaItem(file, type);
  };

  const handleItemChange = (itemId: string, patch: Partial<DiaryItem>) => {
    updateItem(itemId, patch);
  };

  return (
    <section className="diary-workspace" aria-labelledby="diary-workspace-title">
      <header className="diary-toolbar">
        <div className="diary-toolbar-title">
          <CalendarDays aria-hidden="true" />
          <div>
            <h2 id="diary-workspace-title">Diary</h2>
            <p>{formatDiaryDate(selectedDate)}</p>
          </div>
        </div>

        <div className="diary-date-controls" aria-label="Diary date">
          <button
            type="button"
            className="glass-button diary-icon-button"
            onClick={() => changeDate(addDaysToDateString(selectedDate, -1))}
            title="Previous day"
            aria-label="Previous day"
          >
            <ChevronLeft aria-hidden="true" />
          </button>

          <input
            type="date"
            className="diary-date-input"
            value={selectedDate}
            onChange={(event) => changeDate(event.target.value)}
            aria-label="Diary date"
          />

          <button
            type="button"
            className="glass-button diary-icon-button"
            onClick={() => changeDate(addDaysToDateString(selectedDate, 1))}
            title="Next day"
            aria-label="Next day"
          >
            <ChevronRight aria-hidden="true" />
          </button>

          <button
            type="button"
            className="glass-button diary-today-button"
            onClick={() => changeDate(todayString())}
          >
            Today
          </button>
        </div>

        <div className="diary-add-controls" aria-label="Add diary item">
          <button
            type="button"
            className="glass-button diary-add-button"
            onClick={addTextItem}
            title="Add text"
          >
            <Type aria-hidden="true" />
            <span>Text</span>
          </button>

          <button
            type="button"
            className="glass-button diary-add-button"
            onClick={() => photoInputRef.current?.click()}
            title="Add photo"
          >
            <ImagePlus aria-hidden="true" />
            <span>Photo</span>
          </button>

          <button
            type="button"
            className="glass-button diary-add-button"
            onClick={() => stickerInputRef.current?.click()}
            title="Add transparent sticker"
          >
            <SmilePlus aria-hidden="true" />
            <span>Sticker</span>
          </button>
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => handleMediaChange(event, "photo")}
        />
        <input
          ref={stickerInputRef}
          type="file"
          accept="image/png,image/webp,image/gif"
          hidden
          onChange={(event) => handleMediaChange(event, "sticker")}
        />
      </header>

      <div className="diary-canvas-region">
        <DiaryPage
          items={page.items}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          onChangeItem={handleItemChange}
          onBringToFront={bringItemToFront}
          onRemoveItem={(itemId) => {
            removeItem(itemId);
            setSelectedItemId((current) => (current === itemId ? null : current));
          }}
        />
      </div>

      {status && (
        <div
          className="diary-status"
          role="status"
          onAnimationEnd={() => setStatus("")}
        >
          {status}
        </div>
      )}
    </section>
  );
};
