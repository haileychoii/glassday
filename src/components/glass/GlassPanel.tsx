import type { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

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
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 pointer-events-none" />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};