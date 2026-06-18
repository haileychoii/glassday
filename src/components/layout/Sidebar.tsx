import {
  CalendarDays,
  CircleDollarSign,
  GraduationCap,
  HeartPulse,
  Home,
  Settings,
  Target,
  BriefcaseBusiness,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { label: "Dashboard", icon: Home, active: true, tint: "glass-tint-lavender" },
  { label: "Calendar", icon: CalendarDays, tint: "glass-tint-blue" },
  { label: "Goals", icon: Target, tint: "glass-tint-mint" },
  { label: "Study", icon: GraduationCap, tint: "glass-tint-lavender" },
  { label: "Career", icon: BriefcaseBusiness, tint: "glass-tint-blue" },
  { label: "Wealth", icon: CircleDollarSign, tint: "glass-tint-peach" },
  { label: "Health", icon: HeartPulse, tint: "glass-tint-pink" },
  { label: "Settings", icon: Settings, tint: "" },
];

export const Sidebar = () => {
  return (
    <aside className="hidden lg:flex w-[240px] shrink-0 flex-col border-r border-white/30 bg-white/[0.065] backdrop-blur-3xl relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[-80px] top-[40px] w-[180px] h-[180px] rounded-full bg-sky-200/20 blur-[60px]" />
        <div className="absolute right-[-90px] top-[260px] w-[180px] h-[180px] rounded-full bg-violet-200/18 blur-[64px]" />
        <div className="absolute left-[-70px] bottom-[70px] w-[160px] h-[160px] rounded-full bg-pink-100/18 blur-[60px]" />
      </div>

      <div className="relative z-10 h-[86px] flex items-center px-5 border-b border-white/25">
        <div className="flex items-center gap-3 min-w-0">
          <div className="glass-icon-box">
            <Sparkles className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="text-xl font-semibold tracking-tight liquid-text">
              Glassday
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Junhee OS
            </div>
          </div>
        </div>
      </div>

      <nav className="relative z-10 flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              type="button"
              className={cn(
                "sidebar-nav-button",
                item.active && "is-active",
                item.active && item.tint
              )}
            >
              <span
                className={cn(
                  "sidebar-nav-icon",
                  item.active && "is-active"
                )}
              >
                <Icon className="w-4 h-4" />
              </span>

              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="relative z-10 p-4">
        <div className="sidebar-mode-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Today Mode</div>
              <div className="text-xs text-muted-foreground mt-1">
                Apply · Study · Reset
              </div>
            </div>

            <div className="w-9 h-9 rounded-2xl glass-subtle flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-foreground/65" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-1.5">
            <button type="button" className="sidebar-mode-pill is-active">
              Apply
            </button>
            <button type="button" className="sidebar-mode-pill">
              Study
            </button>
            <button type="button" className="sidebar-mode-pill">
              Rest
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};