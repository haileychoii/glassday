/**
 * Workspace icon editor shared by desktop navigation and mobile navigation.
 *
 * The picker keeps a draft while the user browses. Only Save calls the tab
 * persistence callback, Undo restores the icon that was present when editing
 * began, and Cancel closes without changing saved data.
 */
import { useEffect, useState } from "react";

import {
  workspaceIconCollections,
  type WorkspaceIconCollectionId,
} from "../../constants/workspaceIconChoices";
import type { ThemeId } from "../../constants/themes";
import { cn } from "../../lib/utils";

const iconCollectionForTheme = (theme: ThemeId): WorkspaceIconCollectionId =>
  theme === "pixel-desk" || theme === "retro" ? "retro-pixel" : "pink-iphone";

const collections: Array<{
  id: WorkspaceIconCollectionId;
  label: string;
}> = [
  { id: "pink-iphone", label: "일러스트 아이콘" },
  { id: "retro-pixel", label: "픽셀 아이콘" },
  { id: "folder-art", label: "폴더·패턴" },
];

type WorkspaceIconPickerProps = {
  value: string;
  theme: ThemeId;
  onSave: (icon: string) => void;
  onCancel: () => void;
  className?: string;
  saveLabel?: string;
};

export const WorkspaceIconPicker = ({
  value,
  theme,
  onSave,
  onCancel,
  className,
  saveLabel = "저장",
}: WorkspaceIconPickerProps) => {
  const [draftIcon, setDraftIcon] = useState(value);
  const [collection, setCollection] = useState<WorkspaceIconCollectionId>(
    () => iconCollectionForTheme(theme)
  );

  useEffect(() => {
    setDraftIcon(value);
  }, [value]);

  useEffect(() => {
    setCollection(iconCollectionForTheme(theme));
  }, [theme]);

  const choices = workspaceIconCollections[collection];

  return (
    <section
      className={cn("mobile-tab-icon-picker workspace-icon-picker", className)}
      role="dialog"
      aria-label="워크스페이스 아이콘 선택"
    >
      <div className="mobile-tab-icon-collections" role="group" aria-label="아이콘 분류">
        {collections.map((option) => (
          <button
            key={option.id}
            type="button"
            className="mobile-tab-icon-collection"
            aria-pressed={collection === option.id}
            onClick={() => setCollection(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div
        className="mobile-tab-icon-grid"
        role="group"
        aria-label={`${collections.find((item) => item.id === collection)?.label} 아이콘`}
      >
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className="mobile-tab-icon-choice"
            aria-label={choice.label}
            aria-pressed={draftIcon === choice.src}
            title={choice.label}
            onClick={() => setDraftIcon(choice.src)}
          >
            <img
              src={choice.src}
              alt=""
              aria-hidden="true"
              draggable={false}
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>

      <div className="workspace-icon-picker-actions">
        <button
          type="button"
          onClick={() => setDraftIcon(value)}
          disabled={draftIcon === value}
        >
          되돌리기
        </button>
        <span className="workspace-icon-picker-spacer" />
        <button type="button" onClick={onCancel}>
          취소
        </button>
        <button
          type="button"
          className="workspace-icon-picker-save"
          disabled={draftIcon === value}
          onClick={() => onSave(draftIcon)}
        >
          {saveLabel}
        </button>
      </div>
    </section>
  );
};
