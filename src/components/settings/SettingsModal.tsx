import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  FileUp,
  Palette,
  RefreshCcw,
  RotateCcw,
  Settings,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { cn } from "../../lib/utils";
import {
  downloadGlassdayBackup,
  importGlassdayBackupFile,
  resetGlassdayData,
  resetGlassdayLayout,
  resetGlassdaySection,
} from "../../utils/backup";

type ThemeId = "pastel" | "glass" | "ios";

type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

const themeOptions: { id: ThemeId; label: string; description: string }[] = [
  {
    id: "pastel",
    label: "Pastel",
    description: "Soft pink daily dashboard",
  },
  {
    id: "glass",
    label: "Glass",
    description: "Transparent liquid glass style",
  },
  {
    id: "ios",
    label: "iOS",
    description: "Clean Apple-like frosted style",
  },
];

const getCurrentTheme = (): ThemeId => {
  const saved = localStorage.getItem("glassday.theme.v1");

  if (saved === "pastel" || saved === "glass" || saved === "ios") {
    return saved;
  }

  if (document.documentElement.classList.contains("theme-glass")) {
    return "glass";
  }

  if (document.documentElement.classList.contains("theme-ios")) {
    return "ios";
  }

  return "pastel";
};

const applyTheme = (theme: ThemeId) => {
  const root = document.documentElement;

  root.classList.remove("theme-pastel", "theme-glass", "theme-ios");
  root.classList.add(`theme-${theme}`);

  localStorage.setItem("glassday.theme.v1", theme);
};

const reloadSoon = () => {
  window.setTimeout(() => {
    window.location.reload();
  }, 250);
};

export const SettingsModal = ({ open, onClose }: SettingsModalProps) => {
  const [theme, setTheme] = useState<ThemeId>(getCurrentTheme);
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;

    setTheme(getCurrentTheme());
  }, [open]);

  if (!open) return null;

  const handleThemeChange = (nextTheme: ThemeId) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    setStatus(`Theme changed to ${nextTheme}.`);
  };

  const handleExport = () => {
    downloadGlassdayBackup();
    setStatus("Backup file downloaded.");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (file?: File) => {
    if (!file) return;

    try {
      await importGlassdayBackupFile(file);
      setStatus("Backup imported. Reloading...");
      reloadSoon();
    } catch (error) {
      console.error(error);
      setStatus("Import failed. Please check the backup file.");
    }
  };

  const handleResetLayout = () => {
    const ok = window.confirm(
      "위젯 위치/크기 레이아웃만 초기화할까? 데이터는 유지돼."
    );

    if (!ok) return;

    resetGlassdayLayout();
    setStatus("Layout reset. Reloading...");
    reloadSoon();
  };

  const handleResetSection = (section: string, label: string) => {
    const ok = window.confirm(`${label} 데이터만 초기화할까?`);

    if (!ok) return;

    resetGlassdaySection(section);
    setStatus(`${label} data reset. Reloading...`);
    reloadSoon();
  };

  const handleResetAll = () => {
    const ok = window.confirm(
      "정말 Glassday 전체 데이터를 초기화할까? 백업 안 했으면 복구하기 어려워."
    );

    if (!ok) return;

    resetGlassdayData();
    setStatus("All data reset. Reloading...");
    reloadSoon();
  };

  return createPortal(
    <div className="settings-modal-backdrop">
      <section className="settings-modal-window">
        <header className="settings-modal-header">
          <div className="flex items-center gap-3">
            <div className="settings-modal-icon">
              <Settings className="w-4 h-4" />
            </div>

            <div>
              <h2 className="text-base font-semibold">Settings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Theme, backup, reset, and sync preparation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="glass-button h-9 w-9 flex items-center justify-center"
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
                className="settings-action-card glass-tint-blue"
              >
                <Download className="w-4 h-4" />
                <div>
                  <strong>Export JSON</strong>
                  <span>Download all Glassday data.</span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleImportClick}
                className="settings-action-card glass-tint-mint"
              >
                <FileUp className="w-4 h-4" />
                <div>
                  <strong>Import JSON</strong>
                  <span>Restore from a backup file.</span>
                </div>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => handleImportFile(event.target.files?.[0])}
            />
          </section>

          <section className="settings-section">
            <div className="settings-section-title">
              <RefreshCcw className="w-4 h-4" />
              Reset
            </div>

            <div className="settings-reset-grid">
              <button
                type="button"
                onClick={handleResetLayout}
                className="settings-reset-button"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Layout
              </button>

              <button
                type="button"
                onClick={() => handleResetSection("memo", "Memo")}
                className="settings-reset-button"
              >
                Memo
              </button>

              <button
                type="button"
                onClick={() => handleResetSection("calendar", "Calendar")}
                className="settings-reset-button"
              >
                Calendar
              </button>

              <button
                type="button"
                onClick={() => handleResetSection("career", "Career")}
                className="settings-reset-button"
              >
                Career
              </button>

              <button
                type="button"
                onClick={handleResetAll}
                className="settings-reset-button is-danger"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset All
              </button>
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-title">
              <UploadCloud className="w-4 h-4" />
              Google Sync
            </div>

            <div className="settings-sync-box">
              <div>
                <strong>Google Calendar / Drive</strong>
                <p>
                  OAuth 연결 후 Calendar sync, memo Drive backup 기능으로 확장할 수
                  있어.
                </p>
              </div>

              <button type="button" className="glass-button h-9 px-4 text-xs">
                Connect later
              </button>
            </div>
          </section>

          {status && <div className="settings-status">{status}</div>}
        </div>
      </section>
    </div>,
    document.body
  );
};