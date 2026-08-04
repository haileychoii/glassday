/**
 * ============================================================
 * [Figma Mapping] Shared UI / Widget Frame
 * ============================================================
 *
 * 화면 역할:
 * - Dashboard의 모든 기본 Widget이 공유하는 surface, Header, Body 구조다.
 * - 제목 위치와 내부 시작선을 통일하는 코드 측 Design System 기준점이다.
 *
 * 스타일 연결:
 * - Base structure: `src/styles/base.css`
 * - Spacing tokens: `src/styles/spacing-tokens.css`
 * - Theme surface: `src/styles/theme-surfaces.css`, `src/styles/themes/*.css`
 * - Grid shell: `src/styles/dashboard-grid.css`
 *
 * Figma 구조:
 * - Component: Widget Frame
 * - Root: Vertical Auto Layout
 * - Header: Horizontal Auto Layout / Space Between
 * - Body: Fill container
 * - Variants: Theme / Header Actions / Compact container
 * ============================================================
 */
import type { CSSProperties, ReactNode } from "react";

/* Shared widget shell.
   When you mirror widgets into Figma, this component is the source of truth for:
   - header position
   - icon/title/subtitle alignment
   - action area placement
   - body padding start line */
type GlassCardProps = {
  /** 모든 Widget Header의 Primary Text. */
  title: string;
  /** 한 줄 Secondary Text. 좁은 Frame에서는 CSS ellipsis 처리된다. */
  subtitle?: string;
  /** Header 왼쪽 고정 icon slot. Widget마다 glyph만 다르고 Frame 크기는 공통이다. */
  icon?: ReactNode;
  /** Header 아래 Body Frame에 들어가는 widget별 content. */
  children: ReactNode;
  /** Header 우측 button group. */
  actions?: ReactNode;
  className?: string;
  titleStyle?: CSSProperties;
  subtitleStyle?: CSSProperties;
};

/* Figma-facing class aliases intentionally stay duplicated here.
   Existing CSS can target either legacy glass-card names or the clearer
   widget-frame names while we keep the actual widget chrome in one place. */
/**
 * GlassCard
 *
 * Figma Component: `Widget Frame`. legacy class와 Figma-facing alias를 함께
 * 유지하므로 className을 정리할 때 Base/Theme/Widget CSS를 모두 확인해야 한다.
 */
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
      {/* Header row:
          icon + title copy on the left, widget-specific controls on the right */}
      <div className="glass-card-header widget-card-header widget-frame__header">
        <div className="glass-card-title-group widget-card-title-group widget-frame__title-group">
          {icon && (
            <div className="glass-icon-box glass-card-icon widget-card-icon widget-frame__icon">
              {icon}
            </div>
          )}

          <div className="glass-card-copy widget-card-copy widget-frame__copy">
            <h3
              className="glass-card-title widget-card-title widget-frame__title whitespace-nowrap overflow-hidden text-ellipsis"
              style={titleStyle}
            >
              {title}
            </h3>

            {subtitle && (
              <p
                className="glass-card-subtitle widget-card-subtitle widget-frame__subtitle whitespace-nowrap overflow-hidden text-ellipsis"
                style={subtitleStyle}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="glass-card-actions widget-frame__actions">{actions}</div>}
      </div>

      {/* Body:
          every widget starts its own internal layout from this padded area */}
      <div className="glass-card-body widget-frame__body">{children}</div>
    </section>
  );
};
