/**
 * Workspace icon/background chooser.
 *
 * EN: This dialog is intentionally local to navigation. It updates only the
 * selected DashboardTab metadata through useDashboardTabs.updateTabAppearance;
 * widget records and layouts are untouched.
 * KO: 위젯 내용과 배치는 건드리지 않고 현재 workspace의 아이콘·배경만
 * 선택해 저장하는 작은 설정창이다. 사용자 이미지 업로드도 같은 고정
 * 아이콘 박스에 contain으로 표시해 찌그러짐을 막는다.
 */
import { useState, type ChangeEvent } from "react";

import {
  workspaceBackgroundOptions,
  workspaceIconOptions,
} from "../../constants/workspaceAppearance";
import type { DashboardTab } from "../../types/workspace";

import { WorkspaceTabIcon } from "./WorkspaceTabIcon";

type WorkspaceAppearanceDialogProps = {
  tab: DashboardTab;
  theme: Parameters<typeof WorkspaceTabIcon>[0]["theme"];
  onSave: (
    tabId: string,
    appearance: { icon: string; background: string; iconSource?: string }
  ) => void;
  onClose: () => void;
};

export const WorkspaceAppearanceDialog = ({
  tab,
  theme,
  onSave,
  onClose,
}: WorkspaceAppearanceDialogProps) => {
  const [icon, setIcon] = useState(tab.icon || "✨");
  const [background, setBackground] = useState(tab.background || "");
  const [iconSource, setIconSource] = useState(tab.iconSource || "preset");

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setIcon(reader.result);
        setIconSource("upload");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="workspace-appearance-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="workspace-appearance-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-appearance-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="workspace-appearance-header">
          <div>
            <h2 id="workspace-appearance-title">Customize workspace</h2>
            <p>{tab.label}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close customization">×</button>
        </header>

        <div className="workspace-appearance-section">
          <h3>Icon</h3>
          <div className="workspace-icon-option-grid">
            {workspaceIconOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={icon === option.value ? "is-selected" : ""}
                onClick={() => {
                  setIcon(option.value);
                  setIconSource(option.id);
                }}
                title={option.label}
                aria-label={option.label}
              >
                <span className="workspace-icon-option-preview">
                  <WorkspaceTabIcon tabId={tab.id} tabLabel={tab.label} theme={theme} icon={option.value} />
                </span>
              </button>
            ))}
          </div>

          <label className="workspace-upload-button">
            <span>Use an image</span>
            <input type="file" accept="image/*" onChange={handleUpload} />
          </label>
        </div>

        <div className="workspace-appearance-section">
          <h3>Background</h3>
          <div className="workspace-background-option-grid">
            {workspaceBackgroundOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={background === option.value ? "is-selected" : ""}
                onClick={() => setBackground(option.value)}
                style={{ background: option.value || undefined }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <footer className="workspace-appearance-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button
            type="button"
            onClick={() => {
              onSave(tab.id, { icon, background, iconSource });
              onClose();
            }}
          >
            Save
          </button>
        </footer>
      </section>
    </div>
  );
};
