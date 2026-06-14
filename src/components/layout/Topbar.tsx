import { useEffect, useState } from "react";
import { Bell, CalendarCheck, Search, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";

type Theme = "pastel" | "glass" | "ios";

const themes: { id: Theme; label: string }[] = [
  { id: "pastel", label: "Pastel" },
  { id: "glass", label: "Glass" },
  { id: "ios", label: "iOS" },
];

export const Topbar = () => {
  const [theme, setTheme] = useState<Theme>("glass");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-pastel", "theme-glass", "theme-ios");
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  const hour = now.getHours();

  const greeting =
    hour < 5
      ? "Still awake"
      : hour < 12
        ? "Good Morning"
        : hour < 18
          ? "Good Afternoon"
          : "Good Evening";

  const dateText = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="h-[78px] px-5 md:px-6 border-b border-white/35 bg-white/10 backdrop-blur-3xl">
      <div className="h-full flex items-center justify-between gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/35 border border-white/45 px-2.5 py-1 text-[11px] text-muted-foreground">
              <Sparkles className="w-3 h-3" />
              {dateText}
            </span>
          </div>

          <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight leading-none">
            {greeting}, <span className="text-primary">Junhee</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div className="hidden xl:flex items-center gap-2 h-11 px-4 rounded-full bg-white/35 border border-white/50 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search your OS..."
              className="w-44 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
          </div>

          <button className="h-11 px-4 rounded-full bg-white/35 border border-white/50 text-sm flex items-center gap-2 hover:bg-white/55 transition backdrop-blur-2xl">
            <CalendarCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Google Calendar</span>
          </button>

          <div className="h-11 px-1.5 rounded-full bg-white/35 border border-white/50 flex items-center backdrop-blur-2xl">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs transition-all",
                  theme === t.id
                    ? "bg-foreground text-background shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button className="w-11 h-11 rounded-full bg-white/35 border border-white/50 flex items-center justify-center hover:bg-white/55 transition backdrop-blur-2xl">
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};