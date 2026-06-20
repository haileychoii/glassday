import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  Palette,
  RotateCcw,
  Settings,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { cn } from "../../lib/utils";
import {
  applyTheme,
  getCurrentTheme,
  themeOptions,
  type ThemeId,
} from "../../constants/themes";
import {
  downloadGlassdayBackup,
  importGlassdayBackupFile,
  resetGlassdayData,
  resetGlassdayLayout,
  resetGlassdaySection,
} from "../../utils/backup";

type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

export const SettingsModal = ({ open, onClose }: SettingsModalProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [theme, setTheme] = useState<ThemeId>(() => getCurrentTheme());
  const [status, setStatus] = useState("");

  if (!open) return null;

  const handleThemeChange = (nextTheme: ThemeId) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);

    const label =
      themeOptions.find((item) => item.id === nextTheme)?.label ?? nextTheme;

    setStatus(`Theme changed to ${label}.`);
  };

  const handleExport = () => {
    downloadGlassdayBackup();
    setStatus("Backup file exported.");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      await importGlassdayBackupFile(file);
      setStatus("Backup imported. Reloading...");
      window.setTimeout(() => {
        window.location.reload();
      }, 450);
    } catch (error) {
      console.error(error);
      setStatus("Import failed. Please check the backup file.");
    } finally {
      event.target.value = "";
    }
  };

  const handleResetLayout = () => {
    const ok = window.confirm(
      "위젯 배치와 탭 레이아웃을 초기화할까? 메모/공부/저널 내용은 유지돼."
    );

    if (!ok) return;

    resetGlassdayLayout();
    localStorage.removeItem("glassday.dashboard.tabs.v1");
    localStorage.removeItem("glassday.dashboard.activeTab.v1");

    setStatus("Layout reset. Reloading...");
    window.setTimeout(() => {
      window.location.reload();
    }, 450);
  };

  const handleResetSection = (section: string, label: string) => {
    const ok = window.confirm(`${label} 관련 저장 데이터를 초기화할까?`);

    if (!ok) return;

    resetGlassdaySection(section);

    setStatus(`${label} reset. Reloading...`);
    window.setTimeout(() => {
      window.location.reload();
    }, 450);
  };

  const handleResetAll = () => {
    const ok = window.confirm(
      "Glassday 전체 데이터를 초기화할까? 메모, 일정, 저널, 공부 기록까지 모두 삭제돼."
    );

    if (!ok) return;

    resetGlassdayData();

    setStatus("All data reset. Reloading...");
    window.setTimeout(() => {
      window.location.reload();
    }, 450);
  };

  return createPortal(
    <div className="settings-modal-backdrop" onMouseDown={onClose}>
      <section
        className="settings-modal-window"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="settings-modal-header">
          <div className="settings-modal-title-wrap">
            <div className="settings-modal-icon">
              <Settings className="w-4 h-4" />
            </div>

            <div>
              <h2>Settings</h2>
              <p>Theme, backup, sync, reset center</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="glass-button h-9 w-9 flex items-center justify-center"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="settings-modal-body">
          <section className="settings-section">
            <div className="settings-section-title">
              <Palette className="w-4 h-4" />
              Theme
            </div>

            <div className="settings-theme-grid">
              {themeOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleThemeChange(item.id)}
                  className={cn(
                    "settings-theme-card",
                    theme === item.id && "is-active"
                  )}
                >
                  <span className={`settings-theme-preview theme-${item.id}`}>
                    <span />
                    <span />
                    <span />
                  </span>

                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-title">
              <Download className="w-4 h-4" />
              Backup
            </div>

            <div className="settings-action-grid">
              <button
                type="button"
                onClick={handleExport}
                className="settings-action-card"
              >
                <Download className="w-4 h-4" />
                <strong>Export Backup</strong>
                <span>현재 Glassday 데이터를 JSON 파일로 저장</span>
              </button>

              <button
                type="button"
                onClick={handleImportClick}
                className="settings-action-card"
              >
                <Upload className="w-4 h-4" />
                <strong>Import Backup</strong>
                <span>저장해둔 백업 파일 불러오기</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-title">
              <RotateCcw className="w-4 h-4" />
              Reset Center
            </div>

            <div className="settings-reset-grid">
              <button
                type="button"
                onClick={handleResetLayout}
                className="settings-reset-button"
              >
                <RotateCcw className="w-4 h-4" />
                <strong>Reset Layout</strong>
                <span>위젯 배치 / 탭 초기화</span>
              </button>

              <button
                type="button"
                onClick={() => handleResetSection("memo", "Memo")}
                className="settings-reset-button"
              >
                <Trash2 className="w-4 h-4" />
                <strong>Reset Memo</strong>
                <span>메모 데이터 초기화</span>
              </button>

              <button
                type="button"
                onClick={() => handleResetSection("study", "Study")}
                className="settings-reset-button"
              >
                <Trash2 className="w-4 h-4" />
                <strong>Reset Study</strong>
                <span>공부 기록 초기화</span>
              </button>

              <button
                type="button"
                onClick={() => handleResetSection("journal", "Journal")}
                className="settings-reset-button"
              >
                <Trash2 className="w-4 h-4" />
                <strong>Reset Journal</strong>
                <span>저널 기록 초기화</span>
              </button>

              <button
                type="button"
                onClick={() => handleResetSection("calendar", "Calendar")}
                className="settings-reset-button"
              >
                <Trash2 className="w-4 h-4" />
                <strong>Reset Calendar</strong>
                <span>일정 데이터 초기화</span>
              </button>

              <button
                type="button"
                onClick={handleResetAll}
                className="settings-reset-button is-danger"
              >
                <Trash2 className="w-4 h-4" />
                <strong>Reset All</strong>
                <span>전체 데이터 삭제</span>
              </button>
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-title">
              <Settings className="w-4 h-4" />
              Sync
            </div>

            <div className="settings-sync-box">
              <strong>Google Sync 준비 중</strong>
              <p>
                Calendar, Gmail, Drive 연동은 나중에 OAuth 붙이면서 연결하면 돼.
                지금은 localStorage 기반 개인용 저장 구조야.
              </p>
            </div>
          </section>

          {status && <div className="settings-status">{status}</div>}
        </div>
      </section>
    </div>,
    document.body
  );
};