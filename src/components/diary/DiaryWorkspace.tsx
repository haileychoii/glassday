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
  LayoutTemplate,
  Redo2,
  Save,
  SmilePlus,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import {
  useRef,
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

import { useDiaryDocument } from "../../hooks/useDiaryDocument";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { createDiaryTemplate } from "../../lib/diaryTemplates";
import { saveDiaryAsset } from "../../lib/mediaStore";
import {
  DIARY_TEMPLATES_STORAGE_KEY,
  type DiaryItem,
  type DiaryItemType,
  type DiaryTemplate,
} from "../../types/diary";
import {
  addDaysToDateString,
  todayString,
} from "../widgets/journal/journalUtils";
import { DiaryPage } from "./DiaryPage";

const EMPTY_TEMPLATES: DiaryTemplate[] = [];

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
  const [isNamingTemplate, setIsNamingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  // useLocalStorage is the same auto-save bridge used for diary pages in
  // useDiaryDocument.ts. / 템플릿도 별도 저장 키로 보관해 날짜별 기록과 분리한다.
  const { value: templates, setValue: setTemplates } = useLocalStorage(
    DIARY_TEMPLATES_STORAGE_KEY,
    EMPTY_TEMPLATES
  );
  const {
    page,
    addItem,
    updateItem,
    removeItem,
    bringItemToFront,
    addTemplateItems,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDiaryDocument(selectedDate);
  const selectedTemplate = templates.find((item) => item.id === selectedTemplateId);

  useEffect(() => {
    // Match desktop editors without stealing the browser's native text-field
    // undo. / 글을 입력 중일 때는 입력칸 고유의 되돌리기를 우선한다.
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "INPUT" ||
        target?.isContentEditable
      ) return;

      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey && canUndo) {
        event.preventDefault();
        undo();
      } else if ((key === "y" || (key === "z" && event.shiftKey)) && canRedo) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleHistoryShortcut);
    return () => window.removeEventListener("keydown", handleHistoryShortcut);
  }, [canRedo, canUndo, redo, undo]);

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

  const replaceMedia = async (itemId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      setStatus("이미지 파일만 사용할 수 있어요.");
      return;
    }

    try {
      const assetId = await saveDiaryAsset(file);
      updateItem(itemId, { assetId });
      setStatus("이미지를 교체했어요.");
    } catch (error) {
      console.error("Unable to replace diary media", error);
      setStatus("이미지를 저장하지 못했어요.");
    }
  };

  const saveLayout = () => {
    const name = templateName.trim();
    if (!name || page.items.length === 0) return;

    const template = createDiaryTemplate(name, page.items);
    setTemplates((current) => [...current, template]);
    setSelectedTemplateId(template.id);
    setTemplateName("");
    setIsNamingTemplate(false);
    setStatus("배치 템플릿을 저장했어요.");
  };

  const applyLayout = () => {
    if (!selectedTemplate) return;
    if (
      page.items.length > 0 &&
      !window.confirm("현재 날짜의 항목은 그대로 두고 선택한 배치를 추가할까요?")
    ) return;

    addTemplateItems(selectedTemplate);
    setSelectedItemId(null);
    setStatus("배치를 이 날짜에 추가했어요. 사진 자리를 눌러 이미지를 넣을 수 있어요.");
  };

  const deleteLayout = () => {
    if (!selectedTemplate) return;
    if (!window.confirm(`'${selectedTemplate.name}' 템플릿을 삭제할까요?`)) return;

    setTemplates((current) => current.filter((item) => item.id !== selectedTemplate.id));
    setSelectedTemplateId("");
    setStatus("템플릿을 삭제했어요.");
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
          <div className="diary-history-controls" aria-label="Edit history">
            <button
              type="button"
              className="glass-button diary-icon-button"
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
              aria-label="Undo"
            >
              <Undo2 aria-hidden="true" />
            </button>
            <button
              type="button"
              className="glass-button diary-icon-button"
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
              aria-label="Redo"
            >
              <Redo2 aria-hidden="true" />
            </button>
          </div>
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

        <div className="diary-template-controls" aria-label="Diary layouts">
          <LayoutTemplate aria-hidden="true" className="diary-template-icon" />
          <select
            className="diary-template-select"
            value={selectedTemplateId}
            onChange={(event) => setSelectedTemplateId(event.target.value)}
            aria-label="Saved layouts"
          >
            <option value="">Saved layouts</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
          <button
            type="button"
            className="glass-button diary-template-button"
            onClick={applyLayout}
            disabled={!selectedTemplate}
            title="Add layout to this date"
          >
            Apply
          </button>
          {isNamingTemplate ? (
            <form
              className="diary-template-name-form"
              onSubmit={(event) => {
                event.preventDefault();
                saveLayout();
              }}
            >
              <input
                className="diary-template-name-input"
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setIsNamingTemplate(false);
                }}
                maxLength={40}
                placeholder="Layout name"
                aria-label="Layout name"
                autoFocus
              />
              <button
                type="submit"
                className="glass-button diary-icon-button"
                disabled={!templateName.trim()}
                title="Save layout"
                aria-label="Save layout"
              >
                <Save aria-hidden="true" />
              </button>
              <button
                type="button"
                className="glass-button diary-template-button"
                onClick={() => setIsNamingTemplate(false)}
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="glass-button diary-template-button diary-save-template-button"
              onClick={() => setIsNamingTemplate(true)}
              disabled={page.items.length === 0}
              title="Save the current layout without text or photos"
            >
              <Save aria-hidden="true" />
              <span>Save layout</span>
            </button>
          )}
          <button
            type="button"
            className="glass-button diary-icon-button"
            onClick={deleteLayout}
            disabled={!selectedTemplate}
            title="Delete selected layout"
            aria-label="Delete selected layout"
          >
            <Trash2 aria-hidden="true" />
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
          onReplaceMedia={(itemId, file) => void replaceMedia(itemId, file)}
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
