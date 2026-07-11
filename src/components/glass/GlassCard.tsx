import type { CSSProperties, ReactNode } from "react";

type GlassCardProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  titleStyle?: CSSProperties;
  subtitleStyle?: CSSProperties;
};

export const GlassCard = ({
  title,
  subtitle,
  icon,
  children,
  actions,
  className = "",
  titleStyle,
  subtitleStyle,
}: GlassCardProps) => {
  return (
    <section className={`glass-card h-full overflow-hidden ${className}`}>
      <div className="glass-card-header widget-card-header relative z-[2]">
        <div className="glass-card-title-group widget-card-title-group flex flex-1 items-start min-w-0">
          {icon && (
            <div className="glass-icon-box glass-card-icon widget-card-icon">
              {icon}
            </div>
          )}

          <div
            className="glass-card-copy widget-card-copy min-w-0 flex-1"
            style={{ opacity: 1, visibility: "visible" }}
          >
            <h3
              className="glass-card-title text-sm font-semibold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis"
              style={{ opacity: 1, visibility: "visible", ...titleStyle }}
            >
              {title}
            </h3>

            {subtitle && (
              <p
                className="glass-card-subtitle text-xs text-muted-foreground mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis"
                style={{ opacity: 1, visibility: "visible", ...subtitleStyle }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="glass-card-actions">{actions}</div>}
      </div>

      <div className="glass-card-body h-[calc(100%-72px)] relative z-[1]">
        {children}
      </div>
    </section>
  );
};
