import {
  CalendarDays,
  CircleDollarSign,
  GraduationCap,
  HeartPulse,
  Home,
  Settings,
  Target,
  BriefcaseBusiness,
} from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { label: "Dashboard", icon: Home, active: true },
  { label: "Calendar", icon: CalendarDays },
  { label: "Goals", icon: Target },
  { label: "Study", icon: GraduationCap },
  { label: "Career", icon: BriefcaseBusiness },
  { label: "Wealth", icon: CircleDollarSign },
  { label: "Health", icon: HeartPulse },
  { label: "Settings", icon: Settings },
];

export const Sidebar = () => {
  return (
    <aside className="hidden lg:flex w-[240px] shrink-0 flex-col border-r border-white/35 bg-white/20 backdrop-blur-2xl">
      <div className="h-[86px] flex items-center px-6 border-b border-white/30">
        <div>
          <div className="text-xl font-semibold tracking-tight">Glassday</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Junhee OS
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all",
                item.active
                  ? "bg-foreground text-background shadow-soft"
                  : "text-foreground/65 hover:text-foreground hover:bg-white/35"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="rounded-3xl p-4 bg-white/35 border border-white/45">
          <div className="text-sm font-medium">Today Mode</div>
          <div className="text-xs text-muted-foreground mt-1">
            Apply · Study · Reset
          </div>
        </div>
      </div>
    </aside>
  );
};
