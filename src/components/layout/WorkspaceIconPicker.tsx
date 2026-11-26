/**
 * Workspace icon editor shared by desktop navigation and mobile navigation.
 *
 * The picker keeps a draft while the user browses and previews that draft on
 * the tab. Only Save persists it; Undo restores the starting icon and Cancel
 * removes the preview without changing saved data.
 */
import { Check } from "lucide-react";
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
  { id: "emoji-expressions", label: "표정·손" },
  { id: "emoji-people", label: "사람·동물" },
  { id: "emoji-nature", label: "자연·음식" },
  { id: "emoji-food-travel", label: "음식·이동" },
  { id: "emoji-objects", label: "생활·기호" },
];

type WorkspaceIconPickerProps = {
  value: string;
  theme: ThemeId;
  onSave: (icon: string, applyToAllThemes: boolean) => void;
  /** Show a temporary icon on the tab while the picker is still a draft. */
  onPreview?: (icon: string) => void;
  onCancel: () => void;
  className?: string;
  saveLabel?: string;
  /** Names the tab that will receive the icon, especially on the mobile picker. */
  contextLabel?: string;
  showThemeScope?: boolean;
};

export const WorkspaceIconPicker = ({
  value,
  theme,
  onSave,
  onPreview,
  onCancel,
  className,
  saveLabel = "저장",
  contextLabel,
  showThemeScope = false,
}: WorkspaceIconPickerProps) => {
  const [draftIcon, setDraftIcon] = useState(value);
  const [applyToAllThemes, setApplyToAllThemes] = useState(false);
  const [collection, setCollection] = useState<WorkspaceIconCollectionId>(
    () => iconCollectionForTheme(theme)
  );

  useEffect(() => {
    setDraftIcon(value);
    setApplyToAllThemes(false);
  }, [contextLabel, value]);

  useEffect(() => {
    setCollection(iconCollectionForTheme(theme));
  }, [theme]);

  const choices = workspaceIconCollections[collection];

  const chooseIcon = (icon: string) => {
    setDraftIcon(icon);
    onPreview?.(icon);
  };

  return (
    <section
      className={cn("mobile-tab-icon-picker workspace-icon-picker", className)}
      role="dialog"
      aria-label={contextLabel ?? "워크스페이스 아이콘 선택"}
    >
      {contextLabel && (
        <div className="workspace-icon-picker-context" aria-live="polite">
          <strong>{contextLabel}</strong>
          <span>아이콘을 누르면 탭에서 미리 볼 수 있어요.</span>
        </div>
      )}
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
            aria-label={`${choice.label} 선택`}
            aria-pressed={draftIcon === choice.src}
            title={choice.label}
            onClick={() => chooseIcon(choice.src)}
          >
            <img
              src={choice.src}
              alt=""
              aria-hidden="true"
              draggable={false}
              loading="lazy"
              decoding="async"
            />
            {draftIcon === choice.src && (
              <span className="mobile-tab-icon-choice-check" aria-hidden="true">
                <Check size={11} strokeWidth={3} />
              </span>
            )}
          </button>
        ))}
      </div>

      {showThemeScope && (
        <div
          className="workspace-icon-scope-control"
          role="group"
          aria-label="아이콘 적용 범위"
        >
          <span className="workspace-icon-scope-heading">적용 범위</span>
          <button
            type="button"
            aria-pressed={!applyToAllThemes}
            onClick={() => setApplyToAllThemes(false)}
          >
            현재 테마만 · {themeLabel(theme)}
          </button>
          <button
            type="button"
            aria-pressed={applyToAllThemes}
            onClick={() => setApplyToAllThemes(true)}
          >
            모든 테마
          </button>
        </div>
      )}
      <div className="workspace-icon-picker-actions">
        <button
          type="button"
          onClick={() => chooseIcon(value)}
          disabled={draftIcon === value && !applyToAllThemes}
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
          disabled={draftIcon === value && !applyToAllThemes}
          onClick={() => onSave(draftIcon, applyToAllThemes)}
        >
          {saveLabel}
        </button>
      </div>
    </section>
  );
};

const themeLabel = (theme: ThemeId) => ({
  pastel: "Pastel",
  "glass-light": "Glass Light",
  "glass-dark": "Glass Dark",
  aurora: "Aurora",
  "mac-core": "Mac Core",
  "pixel-desk": "Pixel",
  retro: "Retro",
}[theme]);
