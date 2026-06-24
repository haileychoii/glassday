type ThemeId = "pastel" | "cloud" | "night" | "glass" | "mac-core" | "pixel-desk";
type ModeId = "apply" | "study" | "rest";

type TopbarProps = {
  theme?: string;
  activeTheme?: string;
  currentTheme?: string;
  setTheme?: (theme: string) => void;
  setActiveTheme?: (theme: string) => void;
  setCurrentTheme?: (theme: string) => void;
  onThemeChange?: (theme: string) => void;
  onThemeSelect?: (theme: string) => void;

  mode?: string;
  activeMode?: string;
  currentMode?: string;
  setMode?: (mode: string) => void;
  setActiveMode?: (mode: string) => void;
  onModeChange?: (mode: string) => void;
  onModeSelect?: (mode: string) => void;

  isEditMode?: boolean;
  editMode?: boolean;
  onToggleEdit?: () => void;
  toggleEditMode?: () => void;

  onOpenSettings?: () => void;
  openSettings?: () => void;

  userName?: string;
  name?: string;
};

const themes: { id: ThemeId; label: string }[] = [
  { id: "pastel", label: "Pastel" },
  { id: "cloud", label: "Cloud" },
  { id: "night", label: "Night" },
  { id: "glass", label: "Glass" },
  { id: "mac-core", label: "Mac Core" },
  { id: "pixel-desk", label: "Pixel Desk" },
];

const modes: { id: ModeId; label: string }[] = [
  { id: "apply", label: "Apply" },
  { id: "study", label: "Study" },
  { id: "rest", label: "Rest" },
];

const normalizeTheme = (value: unknown) => {
  const next = String(value ?? "glass");

  if (next === "ios") return "mac-core";
  if (next === "mac") return "mac-core";
  if (next === "pixel") return "pixel-desk";

  return next;
};

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
  setActiveTheme,
  setCurrentTheme,
  onThemeChange,
  onThemeSelect,

  mode,
  activeMode,
  currentMode,
  setMode,
  setActiveMode,
  onModeChange,
  onModeSelect,

  isEditMode,
  editMode,
  onToggleEdit,
  toggleEditMode,

  onOpenSettings,
  openSettings,

  userName,
  name,
}: TopbarProps) => {
  const selectedTheme = normalizeTheme(activeTheme ?? currentTheme ?? theme ?? "glass");
  const selectedMode = String(activeMode ?? currentMode ?? mode ?? "apply");
  const editing = Boolean(isEditMode ?? editMode);
  const displayName = String(userName ?? name ?? "Junhee");

  const changeTheme = (nextTheme: ThemeId) => {
    setTheme?.(nextTheme);
    setActiveTheme?.(nextTheme);
    setCurrentTheme?.(nextTheme);
    onThemeChange?.(nextTheme);
    onThemeSelect?.(nextTheme);
  };

  const changeMode = (nextMode: ModeId) => {
    setMode?.(nextMode);
    setActiveMode?.(nextMode);
    onModeChange?.(nextMode);
    onModeSelect?.(nextMode);
  };

  const toggleEdit = () => {
    onToggleEdit?.();
    toggleEditMode?.();
  };

  const openSettingPanel = () => {
    onOpenSettings?.();
    openSettings?.();
  };

  return (
    <header className="topbar mb-5 w-full rounded-[26px] border border-white/50 bg-white/55 px-4 py-3 shadow-sm backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-[160px] shrink-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
            Glassday
          </p>

          <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {displayName}
          </h1>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 overflow-x-auto">
          <div className="flex shrink-0 items-center gap-2 rounded-[22px] border border-white/55 bg-white/45 p-1.5">
            {modes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => changeMode(item.id)}
                className={[
                  "rounded-[18px] px-3.5 py-2 text-sm font-bold transition",
                  selectedMode === item.id
                    ? "bg-slate-950 text-white shadow-md"
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-950",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-[22px] border border-white/55 bg-white/45 p-1.5">
            {themes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => changeTheme(item.id)}
                className={[
                  "rounded-[18px] px-3.5 py-2 text-sm font-bold transition",
                  selectedTheme === item.id
                    ? "bg-white text-slate-950 shadow-md"
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-950",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={openSettingPanel}
            className="shrink-0 rounded-[20px] border border-white/60 bg-white/55 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-white"
          >
            Settings
          </button>

          <button
            type="button"
            onClick={toggleEdit}
            className={[
              "shrink-0 rounded-[20px] border px-4 py-2.5 text-sm font-bold shadow-sm transition",
              editing
                ? "border-rose-200 bg-rose-100 text-rose-700"
                : "border-white/60 bg-white/55 text-slate-700 hover:bg-white",
            ].join(" ")}
          >
            {editing ? "Done" : "Edit"}
          </button>
        </div>
      </div>
    </header>
  );
};