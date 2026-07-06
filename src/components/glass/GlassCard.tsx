import type { ReactNode } from "react";

type GlassCardProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export const GlassCard = ({
  title,
  subtitle,
  icon,
  children,
  actions,
  className = "",
}: GlassCardProps) => {
  return (
    <section className={`glass-card h-full overflow-hidden ${className}`}>
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex flex-1 items-start gap-3 min-w-0">
          {icon && (
            <div className="glass-icon-box">
              {icon}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="glass-card-title text-sm font-semibold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {title}
            </h3>

            {subtitle && (
              <p className="glass-card-subtitle text-xs text-muted-foreground mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      <div className="px-5 pb-5 h-[calc(100%-72px)] overflow-auto">
        {children}
      </div>
    </section>
  );
};
