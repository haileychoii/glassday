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
    <section className={`glass-card widget-frame h-full ${className}`}>
      <div className="glass-card-header widget-card-header widget-frame__header">
        <div className="glass-card-title-group widget-card-title-group widget-frame__title-group">
          {icon && (
            <div className="glass-icon-box glass-card-icon widget-card-icon widget-frame__icon">
              {icon}
            </div>
          )}

          <div className="glass-card-copy widget-card-copy widget-frame__copy">
            <h3
              className="glass-card-title widget-frame__title whitespace-nowrap overflow-hidden text-ellipsis"
              style={titleStyle}
            >
              {title}
            </h3>

            {subtitle && (
              <p
                className="glass-card-subtitle widget-frame__subtitle whitespace-nowrap overflow-hidden text-ellipsis"
                style={subtitleStyle}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="glass-card-actions widget-frame__actions">{actions}</div>}
      </div>

      <div className="glass-card-body widget-frame__body">{children}</div>
    </section>
  );
};
