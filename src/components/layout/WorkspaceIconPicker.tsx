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

// Search all categories so the preview keeps the right name after browsing to
// a different category from the one that contains the selected icon.
const iconChoicesBySource = new Map(
  Object.values(workspaceIconCollections)
    .flat()
    .map((choice) => [choice.src, choice] as const)
);

const defaultIconLabels: Record<string, string> = {
  home: "홈 기본 아이콘",
  career: "커리어 기본 아이콘",
  study: "스터디 기본 아이콘",
  memo: "메모 기본 아이콘",
  life: "라이프 기본 아이콘",
};

const defaultIconGlyphs: Record<string, string> = {
  home: "🏠",
  career: "💼",
  study: "📚",
  memo: "📝",
  life: "🌿",
};

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
  const selectedChoice = iconChoicesBySource.get(draftIcon);
  const selectedLabel =
    selectedChoice?.label ?? defaultIconLabels[draftIcon] ?? "선택한 아이콘";
  const selectedGlyph = defaultIconGlyphs[draftIcon] ?? draftIcon;

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

      {/* A visible draft preview makes the selected artwork easy to recognize
          and mirrors it on the tab before the user commits the change. */}
      <div className="workspace-icon-picker-preview" role="status" aria-live="polite">
        <span className="workspace-icon-picker-preview-art" aria-hidden="true">
          {draftIcon.startsWith("/workspace-icons/") ? (
            <img src={draftIcon} alt="" draggable={false} />
          ) : (
            selectedGlyph
          )}
        </span>
        <span className="workspace-icon-picker-preview-copy">
          <small>선택한 아이콘</small>
          <strong>{selectedLabel}</strong>
        </span>
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
        <label className="workspace-icon-scope-control">
          <input
            type="checkbox"
            checked={applyToAllThemes}
            onChange={(event) => setApplyToAllThemes(event.target.checked)}
          />
          <span>{applyToAllThemes ? "모든 테마에 적용" : `${themeLabel(theme)} 테마에만 적용`}</span>
        </label>
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
