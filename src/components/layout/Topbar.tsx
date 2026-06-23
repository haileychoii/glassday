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

  return (
    <header className="topbar sticky top-0 z-40 mx-auto mb-5 w-full rounded-[28px] border border-white/35 bg-white/45 px-5 py-4 shadow-[0_18px_60px_rgba(80,90,120,0.14)] backdrop-blur-2xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Glassday
          </p>

          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-slate-900">
            {getGreeting()}, {displayName}
          </h1>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2 rounded-[22px] border border-white/45 bg-white/40 p-1.5 shadow-inner backdrop-blur-xl">
            {modes.map((item) => {
              const active = selectedMode === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleModeClick(item.id)}
                  className={[
                    "rounded-[18px] px-3.5 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-[22px] border border-white/45 bg-white/40 p-1.5 shadow-inner backdrop-blur-xl">
            {themes.map((item) => {
              const active = selectedTheme === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleThemeClick(item.id)}
                  className={[
                    "rounded-[18px] px-3.5 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-white text-slate-950 shadow-md"
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleEditClick}
            className={[
              "rounded-[20px] border px-4 py-2.5 text-sm font-bold shadow-sm transition",
              editing
                ? "border-rose-200 bg-rose-100/80 text-rose-700 hover:bg-rose-100"
                : "border-white/50 bg-white/60 text-slate-800 hover:bg-white",
            ].join(" ")}
          >
            {editing ? "Done" : "Edit Layout"}
          </button>
        </div>
      </div>
    </header>
  );
};