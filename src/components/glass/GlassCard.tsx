import type { ReactNode } from "react";
import { Grip, Maximize2, MoreHorizontal } from "lucide-react";

type GlassCardProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const GlassCard = ({
  title,
  subtitle,
  icon,
  children,
  className = "",
}: GlassCardProps) => {
  return (
    <section className={`glass-card h-full overflow-hidden ${className}`}>
      <div className="drag-handle flex items-start justify-between gap-3 px-5 pt-5 pb-3 cursor-move">
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <div className="w-9 h-9 rounded-2xl bg-white/45 border border-white/50 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}

          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground shrink-0">
          <Grip className="w-3.5 h-3.5" />
          <Maximize2 className="w-3.5 h-3.5" />
          <MoreHorizontal className="w-4 h-4" />
        </div>
      </div>

      <div className="px-5 pb-5 h-[calc(100%-72px)] overflow-auto">
        {children}
      </div>
    </section>
  );
};