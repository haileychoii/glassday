import { Grid2X2, Settings } from "lucide-react";

type ThemeId =
  | "pastel"
  | "cloud"
  | "night"
  | "glass"
  | "aurora"
  | "ios"
  | "mac-core"
  | "pixel-desk";

type ModeId = "apply" | "study" | "rest";

type TopbarProps = {
  theme?: ThemeId | string;
  activeTheme?: ThemeId | string;
  currentTheme?: ThemeId | string;
  setTheme?: (theme: ThemeId | string) => void;
  onThemeChange?: (theme: ThemeId | string) => void;

  mode?: ModeId | string;
  activeMode?: ModeId | string;
  setMode?: (mode: ModeId | string) => void;
  onModeChange?: (mode: ModeId | string) => void;

  isEditMode?: boolean;
  editMode?: boolean;
  onToggleEdit?: () => void;
  toggleEditMode?: () => void;

  onOpenSettings?: () => void;
  openSettings?: () => void;

  userName?: string;
  name?: string;

  [key: string]: unknown;
};

const themes = [
  { id: "pastel", label: "Pastel" },
  { id: "cloud", label: "Cloud" },
  { id: "night", label: "Night" },
  { id: "glass", label: "Glass" },
  { id: "ios", label: "iOS" },
  { id: "mac-core", label: "Mac Core" },
  { id: "pixel-desk", label: "Pixel Desk" },
] as const;

const modes = [
  { id: "apply", label: "Apply" },
  { id: "study", label: "Study" },
  { id: "rest", label: "Rest" },
] as const;

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

export const Topbar = ({
  theme,
  activeTheme,
  currentTheme,
  setTheme,
  onThemeChange,

  mode,
  activeMode,
  setMode,
  onModeChange,

  isEditMode,
  editMode,
  onToggleEdit,
  toggleEditMode,

  onOpenSettings,
  openSettings,

  userName,
  name,
}: TopbarProps) => {
  const selectedTheme = String(activeTheme ?? currentTheme ?? theme ?? "glass");
  const selectedMode = String(activeMode ?? mode ?? "apply");
  const editing = Boolean(isEditMode ?? editMode);
  const displayName = String(userName ?? name ?? "Junhee");

  const handleThemeClick = (nextTheme: string) => {
    setTheme?.(nextTheme);
    onThemeChange?.(nextTheme);
  };

  const handleModeClick = (nextMode: string) => {
    setMode?.(nextMode);
    onModeChange?.(nextMode);
  };

  const handleEditClick = () => {
    onToggleEdit?.();
    toggleEditMode?.();
  };

  const handleSettingsClick = () => {
    onOpenSettings?.();
    openSettings?.();
  };

  return (
    <header className="topbar mb-5 w-full rounded-[26px] border border-white/55 bg-white/55 px-4 py-3 shadow-[0_18px_50px_rgba(80,70,100,0.10)] backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-[170px] shrink-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
            Glassday
          </p>

          <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {displayName}
          </h1>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          <div className="flex max-w-full items-center gap-2 overflow-x-auto rounded-[22px] border border-white/55 bg-white/45 p-1.5 backdrop-blur-xl">
            {modes.map((item) => {
              const active = selectedMode === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleModeClick(item.id)}
                  className={[
                    "shrink-0 rounded-[18px] px-3.5 py-2 text-sm font-bold transition",
                    active
                      ? "bg-slate-950 text-white shadow-[0_8px_20px_rgba(15,23,42,0.22)]"
                      : "text-slate-600 hover:bg-white/80 hover:text-slate-950",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex max-w-full items-center gap-2 overflow-x-auto rounded-[22px] border border-white/55 bg-white/45 p-1.5 backdrop-blur-xl">
            {themes.map((item) => {
              const active = selectedTheme === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleThemeClick(item.id)}
                  className={[
                    "shrink-0 rounded-[18px] px-3.5 py-2 text-sm font-bold transition",
                    active
                      ? "bg-white text-slate-950 shadow-[0_8px_20px_rgba(15,23,42,0.12)]"
                      : "text-slate-600 hover:bg-white/80 hover:text-slate-950",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleSettingsClick}
            className="flex shrink-0 items-center gap-2 rounded-[20px] border border-white/60 bg-white/55 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-white"
          >
            <Settings size={18} />
            Settings
          </button>

          <button
            type="button"
            onClick={handleEditClick}
            className={[
              "flex shrink-0 items-center gap-2 rounded-[20px] border px-4 py-2.5 text-sm font-bold shadow-sm transition",
              editing
                ? "border-rose-200 bg-rose-100/90 text-rose-700"
                : "border-white/60 bg-white/55 text-slate-700 hover:bg-white",
            ].join(" ")}
          >
            <Grid2X2 size={18} />
            {editing ? "Done" : "Edit"}
          </button>
        </div>
      </div>
    </header>
  );
};