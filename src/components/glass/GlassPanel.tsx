/**
 * ============================================================
 * [Figma Mapping] Shared UI / Glass Panel
 * ============================================================
 *
 * 화면 역할:
 * - Widget보다 큰 section 또는 feature 내부 panel에 사용하는 단순 surface wrapper다.
 * - 상태와 저장을 갖지 않으며 `className`을 통해 feature CSS를 결합한다.
 *
 * 스타일 연결:
 * - `glass-panel` primitive는 `src/styles/base.css`와 Theme CSS가 정의한다.
 * - 현재 gradient overlay는 이 컴포넌트 내부 presentation layer다.
 *
 * Figma 구조:
 * - Component: Glass Panel
 * - Root Frame + decorative glass overlay + content layer
 * ============================================================
 */
import type { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

/** children을 공통 glass surface에 감싸는 presentation-only Component. */
export const GlassPanel = ({
  children,
  className = "",
}: GlassPanelProps) => {
  return (
    <div
      className={`
        glass-panel
        relative
        overflow-hidden
        rounded-[2rem]
        border
        border-white/30
        backdrop-blur-3xl
        ${className}
      `}
    >
      {/* Decorative Layer: interaction을 받지 않는 glass highlight overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 pointer-events-none" />

      {/* Figma Frame: Panel Content / 실제 child가 layout direction을 결정한다. */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
