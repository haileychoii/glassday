import { LayoutGrid, Settings, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  applyTheme,
  getCurrentTheme,
  isThemeId,
  themeOptions,
  topbarThemeOptions,
  type ThemeId,
} from "../../constants/themes";

import { cn } from "../../lib/utils";

type TopbarProps = {
  editMode: boolean;
  onToggleEditMode: () => void;
  onOpenSettings: () => void;
};

export const Topbar = ({
  editMode,
  onToggleEditMode,
  onOpenSettings,
}: TopbarProps) => {
  const [theme, setTheme] = useState<ThemeId>(() => getCurrentTheme());

  const isTopbarTheme = useMemo(() => {
    return topbarThemeOptions.some((item) => item.id === theme);
  }, [theme]);

  const currentThemeLabel = useMemo(() => {
    return themeOptions.find((item) => item.id === theme)?.label ?? "Theme";
  }, [theme]);

  /**
   * 앱 최초 진입 시 저장된 테마를 한 번만 적용.
   * 여기서는 이벤트 emit 금지.
   */
  useEffect(() => {
    const savedTheme = getCurrentTheme();

    setTheme(savedTheme);
    applyTheme(savedTheme, { emit: false });
  }, []);

  /**
   * SettingsModal 등 다른 곳에서 테마를 바꿨을 때
   * Topbar active 상태만 동기화.
   * 여기서 applyTheme 다시 호출하면 루프 생길 수 있음.
   */
  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<ThemeId>;
      const nextTheme = customEvent.detail;

      if (!isThemeId(nextTheme)) return;

      setTheme((prevTheme) => {
        return prevTheme === nextTheme ? prevTheme : nextTheme;
      });
    };

    window.addEventListener("glassday-theme-change", handleThemeChange);

    return () => {
      window.removeEventListener("glassday-theme-change", handleThemeChange);
    };
  }, []);

  /**
   * 다른 탭/localStorage 변경까지 반영하고 싶을 때 대비.
   */
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== "glassday.theme") return;

      const nextTheme = event.newValue;

      if (!isThemeId(nextTheme)) return;

      setTheme(nextTheme);
      applyTheme(nextTheme, { emit: false });
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleTopbarThemeChange = useCallback((nextTheme: ThemeId) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  const handleMobileThemeChange = useCallback(
    (value: string) => {
      if (!isThemeId(value)) return;

      handleTopbarThemeChange(value);
    },
    [handleTopbarThemeChange]
  );

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-title">
          <div className="topbar-title-row">
            <Sparkles className="topbar-sparkle" />
            <h1>Good Morning, Junhee</h1>
          </div>

          <p>Focus. Create. Elevate.</p>
        </div>

        <div className="topbar-actions">
          <div
            className="theme-segmented-control theme-button-group"
            aria-label="Theme selector"
          >
            {topbarThemeOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTopbarThemeChange(item.id)}
                className={cn(
                  "theme-segment-button",
                  theme === item.id && "is-active"
                )}
                title={item.description}
                aria-pressed={theme === item.id}
              >
                {item.label}
              </button>
            ))}
          </div>

          <select
            className="theme-select-mobile"
            value={isTopbarTheme ? theme : ""}
            onChange={(event) => handleMobileThemeChange(event.target.value)}
            aria-label="Theme selector"
          >
            {!isTopbarTheme && (
              <option value="" disabled>
                {currentThemeLabel}
              </option>
            )}

            {topbarThemeOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenSettings}
            className="glass-button topbar-action-button"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={onToggleEditMode}
            className={cn(
              "glass-button topbar-action-button",
              editMode && "is-active"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{editMode ? "Done" : "Edit"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};