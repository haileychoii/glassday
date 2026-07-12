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
      <div className="glass-card-header widget-card-header">
        <div className="glass-card-title-group widget-card-title-group min-w-0 flex-1">
          {icon && (
            <div className="glass-icon-box glass-card-icon widget-card-icon">
              {icon}
            </div>
          )}

          <div className="glass-card-copy widget-card-copy min-w-0 flex-1">
            <h3
              className="glass-card-title whitespace-nowrap overflow-hidden text-ellipsis"
              style={titleStyle}
            >
              {title}
            </h3>

            {subtitle && (
              <p
                className="glass-card-subtitle whitespace-nowrap overflow-hidden text-ellipsis"
                style={subtitleStyle}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="glass-card-actions">{actions}</div>}
      </div>

      <div className="glass-card-body">{children}</div>
    </section>
  );
};
