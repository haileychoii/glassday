/**
 * Workspace icon editor shared by desktop navigation and mobile navigation.
 *
 * The picker keeps a draft while the user browses and previews that draft on
 * the tab. Only Save persists it; Undo restores the starting icon and Cancel
 * removes the preview without changing saved data.
 */
import { Check, Settings2 } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";

import {
  type WorkspaceIconCollectionId,
} from "../../constants/workspaceIconChoices";
import type { ThemeId } from "../../constants/themes";
import { resolveWorkspaceIconPath } from "../../constants/workspaceIconPaths";
import { cn } from "../../lib/utils";
import {
  getDefaultWorkspaceIconCatalog,
  loadWorkspaceIconCatalog,
  type WorkspaceIconCatalog,
} from "../../lib/workspaceIconCatalog";
import { WORKSPACE_ICON_ADMIN_USER_ID } from "../../constants/workspaceIconAdmin";
import { useCloudSync } from "../../context/CloudSyncContext";
import { WorkspaceIconAdminManager } from "./WorkspaceIconAdminManager";
import { getWorkspaceOutlineIcon } from "./workspaceOutlineIcons";

const iconCollectionForTheme = (theme: ThemeId): WorkspaceIconCollectionId =>
  theme === "pixel-desk" || theme === "retro" ? "retro-pixel" : "pink-iphone";

const collections: Array<{
  id: WorkspaceIconCollectionId;
  label: string;
}> = [
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

type WorkspaceIconPickerProps = {
  value: string;
  theme: ThemeId;
  onSave: (icon: string, applyToAllThemes: boolean) => void;
  /** Show a temporary icon on the tab while the picker is still a draft. */
  onPreview?: (icon: string, applyToAllThemes: boolean) => void;
  onCancel: () => void;
  className?: string;
  /** Optional viewport position for rendering the desktop picker in a portal. */
  style?: CSSProperties;
  saveLabel?: string;
  /** Names the tab that will receive the icon, especially on the mobile picker. */
  contextLabel?: string;
  showThemeScope?: boolean;
  /** Existing tab draft restored when the user switches between tabs. */
  draftValue?: string;
  initialApplyToAllThemes?: boolean;
  /** Lets Apply commit drafts staged on other tabs as well. */
  canApply?: boolean;
};

export const WorkspaceIconPicker = ({
  value,
  theme,
  onSave,
  onPreview,
  onCancel,
  className,
  style,
  saveLabel = "저장",
  contextLabel,
  showThemeScope = false,
  draftValue,
  initialApplyToAllThemes = false,
  canApply = false,
}: WorkspaceIconPickerProps) => {
  const { user } = useCloudSync();
  const [draftIcon, setDraftIcon] = useState(value);
  const [applyToAllThemes, setApplyToAllThemes] = useState(false);
  const [collection, setCollection] = useState<WorkspaceIconCollectionId>(
    () => iconCollectionForTheme(theme)
  );
  const [catalog, setCatalog] = useState<WorkspaceIconCatalog>(getDefaultWorkspaceIconCatalog);
  const [adminManagerOpen, setAdminManagerOpen] = useState(false);
  const isIconAdmin = user?.id === WORKSPACE_ICON_ADMIN_USER_ID;

  useEffect(() => {
    let active = true;
    void loadWorkspaceIconCatalog()
      .then((nextCatalog) => {
        if (active) setCatalog(nextCatalog);
      })
      .catch((error) => console.error("Could not load shared workspace icons.", error));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setDraftIcon(draftValue ?? value);
    setApplyToAllThemes(initialApplyToAllThemes);
  }, [contextLabel, draftValue, initialApplyToAllThemes, value]);

  useEffect(() => {
    setCollection(iconCollectionForTheme(theme));
  }, [theme]);

  const choices = catalog[collection];

  if (adminManagerOpen && isIconAdmin) {
    return (
      <WorkspaceIconAdminManager
        catalog={catalog}
        className={className}
        style={style}
        onCancel={() => setAdminManagerOpen(false)}
        onSaved={(nextCatalog) => {
          setCatalog(nextCatalog);
          setAdminManagerOpen(false);
        }}
      />
    );
  }

  const chooseIcon = (icon: string) => {
    setDraftIcon(icon);
    onPreview?.(icon, applyToAllThemes);
  };

  const chooseScope = (nextApplyToAllThemes: boolean) => {
    setApplyToAllThemes(nextApplyToAllThemes);
    onPreview?.(draftIcon, nextApplyToAllThemes);
  };

  return (
    <section
      className={cn("mobile-tab-icon-picker workspace-icon-picker", className)}
      style={style}
      role="dialog"
      aria-label={contextLabel ?? "워크스페이스 아이콘 선택"}
    >
      <div className="workspace-icon-picker-context" aria-live="polite">
        <div>
          <strong>{contextLabel ?? "아이콘 선택"}</strong>
          <span>아이콘을 누르면 탭에서 미리 볼 수 있어요.</span>
        </div>
        {isIconAdmin && (
          <button
            className="workspace-icon-admin-open"
            type="button"
            onClick={() => setAdminManagerOpen(true)}
            aria-label="아이콘 관리 열기"
          >
            <Settings2 size={16} /> 관리
          </button>
        )}
      </div>
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
        {choices.map((choice) => {
          const OutlineIcon = getWorkspaceOutlineIcon(choice.src);
          const selectedIcon = resolveWorkspaceIconPath(draftIcon) ?? draftIcon;

          return (
            <button
              key={choice.id}
              type="button"
              className="mobile-tab-icon-choice"
              aria-label={`${choice.label} 선택`}
              aria-pressed={selectedIcon === choice.src}
              title={choice.label}
              onClick={() => chooseIcon(choice.src)}
            >
              {OutlineIcon ? (
                <OutlineIcon className="workspace-icon-choice-outline" aria-hidden="true" />
              ) : (
                <img
                  src={choice.src}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                />
              )}
              {selectedIcon === choice.src && (
                <span className="mobile-tab-icon-choice-check" aria-hidden="true">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
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
            onClick={() => chooseScope(false)}
          >
            {!applyToAllThemes && <Check size={14} strokeWidth={3} aria-hidden="true" />}
            <span>현재 테마만 · {themeLabel(theme)}</span>
          </button>
          <button
            type="button"
            aria-pressed={applyToAllThemes}
            onClick={() => chooseScope(true)}
          >
            {applyToAllThemes && <Check size={14} strokeWidth={3} aria-hidden="true" />}
            <span>모든 테마</span>
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
          disabled={draftIcon === value && !applyToAllThemes && !canApply}
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
