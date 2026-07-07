import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { createPortal } from "react-dom";
import {
  Cloud,
  Download,
  Globe,
  LogIn,
  LogOut,
  Mail,
  Palette,
  RotateCcw,
  Settings,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { cn } from "../../lib/utils";
import {
  addCustomFont,
  applyAppFont,
  FONT_CHANGE_EVENT,
  getAppFontOptions,
  getMemoFontGroups,
  getSavedAppFont,
  getSavedCustomFonts,
  getSavedDefaultMemoFont,
  loadSavedCustomFonts,
  removeCustomFont,
  saveDefaultMemoFont,
  type CustomFontSourceType,
} from "../../constants/fonts";
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
import { useCloudSync } from "../../context/CloudSyncContext";

type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

const THEME_STORAGE_KEY = "glassday.theme";

// const forceApplyTheme = (nextTheme: ThemeId) => {
//   applyTheme(nextTheme);

//   if (typeof document === "undefined") return;

//   const root = document.documentElement;
//   const body = document.body;

//   themeOptions.forEach((item) => {
//     root.classList.remove(`theme-${item.id}`);
//     body.classList.remove(`theme-${item.id}`);
//   });

//   root.classList.add(`theme-${nextTheme}`);
//   body.classList.add(`theme-${nextTheme}`);

//   root.setAttribute("data-theme", nextTheme);
//   body.setAttribute("data-theme", nextTheme);

//   window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);

//   window.dispatchEvent(
//     new CustomEvent("glassday-theme-change", {
//       detail: nextTheme,
//     })
//   );
// };

const forceApplyTheme = (nextTheme: ThemeId) => {
  applyTheme(nextTheme);
};

const renderThemePreview = (themeId: ThemeId) => (
  <span
    className={cn("settings-theme-preview", `settings-theme-preview-${themeId}`)}
    aria-hidden="true"
  >
    <span className="settings-preview-window">
      <span className="settings-preview-titlebar">
        <span className="settings-preview-lights">
          <span />
          <span />
          <span />
        </span>
        <span className="settings-preview-title-chip" />
      </span>

      <span className="settings-preview-body">
        <span className="settings-preview-sidebar" />

        <span className="settings-preview-content">
          <span className="settings-preview-panel settings-preview-panel-wide" />
          <span className="settings-preview-panel-row">
            <span className="settings-preview-panel settings-preview-panel-small" />
            <span className="settings-preview-panel settings-preview-panel-tall" />
          </span>
        </span>
      </span>
    </span>
  </span>
);

export const SettingsModal = ({ open, onClose }: SettingsModalProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    isConfigured,
    user,
    syncStatus,
    syncMessage,
    lastSyncedAt,
    signInWithGoogle,
    signInWithMagicLink,
    signOut,
    syncNow,
  } = useCloudSync();

  const [theme, setTheme] = useState<ThemeId>(() => getCurrentTheme());
  const [appFont, setAppFont] = useState(() => getSavedAppFont());
  const [defaultMemoFont, setDefaultMemoFont] = useState(() =>
    getSavedDefaultMemoFont()
  );
  const [customFonts, setCustomFonts] = useState(() => getSavedCustomFonts());
  const [customFontLabel, setCustomFontLabel] = useState("");
  const [customFontFamily, setCustomFontFamily] = useState("");
  const [customFontUrl, setCustomFontUrl] = useState("");
  const [customFontType, setCustomFontType] =
    useState<CustomFontSourceType>("stylesheet");
  const [status, setStatus] = useState("");
  const [syncEmail, setSyncEmail] = useState("");
  const appFontOptions = useMemo(() => getAppFontOptions(), [customFonts]);

  useEffect(() => {
    if (!open) return;

    setTheme(getCurrentTheme());
    setAppFont(getSavedAppFont());
    setDefaultMemoFont(getSavedDefaultMemoFont());
    setCustomFonts(getSavedCustomFonts());
  }, [open]);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<ThemeId>;

      if (customEvent.detail) {
        setTheme(customEvent.detail);
      }
    };

    window.addEventListener("glassday-theme-change", handleThemeChange);

    return () => {
      window.removeEventListener("glassday-theme-change", handleThemeChange);
    };
  }, []);

  useEffect(() => {
    const syncFonts = () => {
      setAppFont(getSavedAppFont());
      setDefaultMemoFont(getSavedDefaultMemoFont());
      setCustomFonts(getSavedCustomFonts());
    };

    window.addEventListener(FONT_CHANGE_EVENT, syncFonts);

    return () => {
      window.removeEventListener(FONT_CHANGE_EVENT, syncFonts);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleThemeChange = (nextTheme: ThemeId) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);

    const label =
      themeOptions.find((item) => item.id === nextTheme)?.label ?? nextTheme;

    setStatus(`Theme changed to ${label}.`);
  };

  const handleAppFontChange = (nextFont: string) => {
    setAppFont(nextFont);
    applyAppFont(nextFont);
    setStatus("Interface font updated.");
  };

  const handleDefaultMemoFontChange = (nextFont: string) => {
    setDefaultMemoFont(nextFont);
    saveDefaultMemoFont(nextFont);
    setStatus("Default memo font updated.");
  };

  const handleAddCustomFont = async () => {
    const trimmedLabel = customFontLabel.trim();
    const trimmedFamily = customFontFamily.trim();
    const trimmedUrl = customFontUrl.trim();

    if (!trimmedLabel || !trimmedFamily || !trimmedUrl) {
      setStatus("Add a label, family name, and font URL first.");
      return;
    }

    const entry = await addCustomFont({
      label: trimmedLabel,
      family: trimmedFamily,
      sourceUrl: trimmedUrl,
      sourceType: customFontType,
    });

    if (!entry) {
      setStatus("That font could not be loaded. Check the URL or type.");
      return;
    }

    await loadSavedCustomFonts();
    setCustomFonts(getSavedCustomFonts());
    setCustomFontLabel("");
    setCustomFontFamily("");
    setCustomFontUrl("");
    setStatus(`${trimmedLabel} added to the font library.`);
  };

  const handleRemoveCustomFont = (id: string, label: string) => {
    removeCustomFont(id);
    setCustomFonts(getSavedCustomFonts());
    setStatus(`${label} removed from the font library.`);
  };

  const handleExport = () => {
    downloadGlassdayBackup();
    setStatus("Backup file exported.");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
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

  const handleMagicLinkLogin = async () => {
    const email = syncEmail.trim();

    if (!email) {
      setStatus("Enter your email first.");
      return;
    }

    await signInWithMagicLink(email);
    setStatus(`Magic link sent to ${email}.`);
  };

  return createPortal(
    <div className="settings-modal-backdrop" onMouseDown={onClose}>
      <section
        className="settings-modal-window settings-window settings-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Glassday Settings"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="settings-modal-header settings-header settings-titlebar">
          <div className="settings-modal-title-wrap">
            <div className="settings-modal-icon settings-icon">
              <Settings className="w-4 h-4" />
            </div>

            <div className="settings-modal-title-text">
              <h2>Settings</h2>
              <p>Theme, backup, sync, reset center</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="glass-button settings-close-button"
            title="Close"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="settings-modal-body settings-body settings-content">
          <section className="settings-section settings-card">
            <div className="settings-section-title settings-card-title">
              <Palette className="w-4 h-4" />
              <span>Theme</span>
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
                  aria-pressed={theme === item.id}
                >
                  {renderThemePreview(item.id)}

                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="settings-section settings-card">
            <div className="settings-section-title settings-card-title">
              <Globe className="w-4 h-4" />
              <span>Fonts</span>
            </div>

            <div className="settings-font-stack">
              <label className="settings-field">
                <span>Interface Font</span>
                <select
                  value={appFont}
                  onChange={(event) => handleAppFontChange(event.target.value)}
                  className="settings-input"
                >
                  {appFontOptions.map((option) => (
                    <option
                      key={`${option.label}-${option.value}`}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="settings-field">
                <span>Default Memo Font</span>
                <select
                  value={defaultMemoFont}
                  onChange={(event) =>
                    handleDefaultMemoFontChange(event.target.value)
                  }
                  className="settings-input"
                >
                  {getMemoFontGroups().map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.fonts.map((font) => (
                        <option key={`${group.label}-${font.label}`} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            </div>

            <div className="settings-font-helper">
              `public/fonts`에 넣은 로컬 폰트와 메모 폰트 목록을 같이 묶어뒀고,
              여기서 웹폰트 URL도 추가할 수 있어.
            </div>

            <div className="settings-webfont-grid">
              <label className="settings-field">
                <span>Label</span>
                <input
                  value={customFontLabel}
                  onChange={(event) => setCustomFontLabel(event.target.value)}
                  className="settings-input"
                  placeholder="e.g. My Study Font"
                />
              </label>

              <label className="settings-field">
                <span>Font Family</span>
                <input
                  value={customFontFamily}
                  onChange={(event) => setCustomFontFamily(event.target.value)}
                  className="settings-input"
                  placeholder="e.g. OngleipStudyWell"
                />
              </label>

              <label className="settings-field">
                <span>Source Type</span>
                <select
                  value={customFontType}
                  onChange={(event) =>
                    setCustomFontType(event.target.value as CustomFontSourceType)
                  }
                  className="settings-input"
                >
                  <option value="stylesheet">Stylesheet URL</option>
                  <option value="woff2">WOFF2 File</option>
                  <option value="woff">WOFF File</option>
                  <option value="ttf">TTF File</option>
                  <option value="otf">OTF File</option>
                </select>
              </label>

              <label className="settings-field settings-field-wide">
                <span>Source URL</span>
                <input
                  value={customFontUrl}
                  onChange={(event) => setCustomFontUrl(event.target.value)}
                  className="settings-input"
                  placeholder="https://... or /fonts/..."
                />
              </label>
            </div>

            <div className="settings-font-actions">
              <button
                type="button"
                onClick={() => void handleAddCustomFont()}
                className="settings-action-card settings-font-add-button"
              >
                <Globe className="w-4 h-4" />
                <div>
                  <strong>Add Web Font</strong>
                  <span>Load it for settings and memo font selectors</span>
                </div>
              </button>
            </div>

            {customFonts.length > 0 && (
              <div className="settings-custom-font-list">
                {customFonts.map((font) => (
                  <div key={font.id} className="settings-custom-font-item">
                    <div>
                      <strong>{font.label}</strong>
                      <span>{font.family}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCustomFont(font.id, font.label)}
                      className="settings-reset-button"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="settings-section settings-card">
            <div className="settings-section-title settings-card-title">
              <Download className="w-4 h-4" />
              <span>Backup</span>
            </div>

            <div className="settings-action-grid settings-backup-grid">
              <button
                type="button"
                onClick={handleExport}
                className="settings-action-card settings-backup-button"
              >
                <Download className="w-4 h-4" />

                <div>
                  <strong>Export Backup</strong>
                  <span>현재 Glassday 데이터를 JSON 파일로 저장</span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleImportClick}
                className="settings-action-card settings-backup-button"
              >
                <Upload className="w-4 h-4" />

                <div>
                  <strong>Import Backup</strong>
                  <span>저장해둔 백업 파일 불러오기</span>
                </div>
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

          <section className="settings-section settings-card">
            <div className="settings-section-title settings-card-title">
              <RotateCcw className="w-4 h-4" />
              <span>Reset Center</span>
            </div>

            <div className="settings-reset-grid">
              <button
                type="button"
                onClick={handleResetLayout}
                className="settings-reset-button"
              >
                <RotateCcw className="w-4 h-4" />

                <div>
                  <strong>Reset Layout</strong>
                  <span>위젯 배치 / 탭 초기화</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleResetSection("memo", "Memo")}
                className="settings-reset-button"
              >
                <Trash2 className="w-4 h-4" />

                <div>
                  <strong>Reset Memo</strong>
                  <span>메모 데이터 초기화</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleResetSection("study", "Study")}
                className="settings-reset-button"
              >
                <Trash2 className="w-4 h-4" />

                <div>
                  <strong>Reset Study</strong>
                  <span>공부 기록 초기화</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleResetSection("journal", "Journal")}
                className="settings-reset-button"
              >
                <Trash2 className="w-4 h-4" />

                <div>
                  <strong>Reset Journal</strong>
                  <span>저널 기록 초기화</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleResetSection("calendar", "Calendar")}
                className="settings-reset-button"
              >
                <Trash2 className="w-4 h-4" />

                <div>
                  <strong>Reset Calendar</strong>
                  <span>일정 데이터 초기화</span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleResetAll}
                className="settings-reset-button is-danger"
              >
                <Trash2 className="w-4 h-4" />

                <div>
                  <strong>Reset All</strong>
                  <span>전체 데이터 삭제</span>
                </div>
              </button>
            </div>
          </section>

          <section className="settings-section settings-card">
            <div className="settings-section-title settings-card-title">
              <Cloud className="w-4 h-4" />
              <span>Sync</span>
            </div>

            <div className="settings-sync-box hidden">
              <strong>Google Sync 준비 중</strong>
              <p>
                Calendar, Gmail, Drive 연동은 나중에 OAuth 붙이면서 연결하면 돼.
                지금은 localStorage 기반 개인용 저장 구조야.
              </p>
            </div>
          </section>

          <section className="settings-section settings-card">
            <div className="settings-section-title settings-card-title">
              <Cloud className="w-4 h-4" />
              <span>Supabase Sync</span>
            </div>

            <div className="settings-sync-box">
              <strong>Supabase Cloud Save</strong>
              <p>
                Sign in and keep your Glassday dashboard saved across devices
                with one cloud snapshot per user.
              </p>

              <div className="settings-font-helper">
                {isConfigured
                  ? user?.email
                    ? `Signed in as ${user.email}.`
                    : syncMessage
                  : "Add Supabase env values first."}
                {lastSyncedAt
                  ? ` Last sync: ${new Date(lastSyncedAt).toLocaleString()}.`
                  : ""}
                {` Status: ${syncStatus}.`}
                {syncMessage ? ` ${syncMessage}` : ""}
              </div>

              {isConfigured ? (
                user ? (
                  <div className="settings-action-grid settings-backup-grid">
                    <button
                      type="button"
                      onClick={() => void syncNow()}
                      className="settings-action-card settings-backup-button"
                    >
                      <Cloud className="w-4 h-4" />

                      <div>
                        <strong>Sync Now</strong>
                        <span>Upload the latest dashboard snapshot</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="settings-action-card settings-backup-button"
                    >
                      <LogOut className="w-4 h-4" />

                      <div>
                        <strong>Sign Out</strong>
                        <span>Disconnect this browser session</span>
                      </div>
                    </button>
                  </div>
                ) : (
                  <>
                    <label className="settings-field">
                      <span>Email Magic Link</span>
                      <input
                        value={syncEmail}
                        onChange={(event) => setSyncEmail(event.target.value)}
                        className="settings-input"
                        placeholder="you@example.com"
                      />
                    </label>

                    <div className="settings-action-grid settings-backup-grid">
                      <button
                        type="button"
                        onClick={() => void handleMagicLinkLogin()}
                        className="settings-action-card settings-backup-button"
                      >
                        <Mail className="w-4 h-4" />

                        <div>
                          <strong>Send Magic Link</strong>
                          <span>Login from any device with email</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => void signInWithGoogle()}
                        className="settings-action-card settings-backup-button"
                      >
                        <LogIn className="w-4 h-4" />

                        <div>
                          <strong>Continue with Google</strong>
                          <span>Use Supabase OAuth after provider setup</span>
                        </div>
                      </button>
                    </div>
                  </>
                )
              ) : (
                <div className="settings-font-helper">
                  Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your
                  Vercel project, then create the `user_storage_snapshots`
                  table in Supabase.
                </div>
              )}
            </div>
          </section>

          {status && <div className="settings-status">{status}</div>}
        </div>
      </section>
    </div>,
    document.body
  );
};
