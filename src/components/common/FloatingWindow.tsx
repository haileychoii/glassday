import { useEffect, useRef } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";

type FloatingWindowRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type FloatingWindowProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  storageKey: string;
  defaultRect?: FloatingWindowRect;
  minWidth?: number;
  minHeight?: number;
  className?: string;
  titlebarClassName?: string;
  actions?: ReactNode;
  children: ReactNode;
  onClose: () => void;
};

const getSafeRect = (
  rect: FloatingWindowRect,
  minWidth: number,
  minHeight: number
): FloatingWindowRect => {
  const maxX = Math.max(16, window.innerWidth - minWidth);
  const maxY = Math.max(16, window.innerHeight - 120);

  return {
    x: Math.min(Math.max(16, rect.x), maxX),
    y: Math.min(Math.max(16, rect.y), maxY),
    w: Math.max(minWidth, rect.w),
    h: Math.max(minHeight, rect.h),
  };
};

export const FloatingWindow = ({
  open,
  title,
  subtitle,
  storageKey,
  defaultRect = {
    x: 120,
    y: 72,
    w: 980,
    h: 720,
  },
  minWidth = 620,
  minHeight = 420,
  className,
  titlebarClassName,
  actions,
  children,
  onClose,
}: FloatingWindowProps) => {
  const windowRef = useRef<HTMLDivElement | null>(null);
  const titlebarRef = useRef<HTMLDivElement | null>(null);

  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const { value: rect, setValue: setRect } =
    useLocalStorage<FloatingWindowRect>(storageKey, defaultRect);

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!windowRef.current) return;

      if (!windowRef.current.contains(target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!dragRef.current.dragging) return;

      const nextX =
        dragRef.current.initialX + event.clientX - dragRef.current.startX;
      const nextY =
        dragRef.current.initialY + event.clientY - dragRef.current.startY;

      setRect((prev) =>
        getSafeRect(
          {
            ...prev,
            x: nextX,
            y: nextY,
          },
          minWidth,
          minHeight
        )
      );
    };

    const handleMouseUp = () => {
      dragRef.current.dragging = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [open, setRect, minWidth, minHeight]);

  useEffect(() => {
    if (!open || !windowRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const nextWidth = Math.round(entry.contentRect.width);
      const nextHeight = Math.round(entry.contentRect.height);

      setRect((prev) => {
        if (prev.w === nextWidth && prev.h === nextHeight) {
          return prev;
        }

        return {
          ...prev,
          w: Math.max(minWidth, nextWidth),
          h: Math.max(minHeight, nextHeight),
        };
      });
    });

    observer.observe(windowRef.current);

    return () => {
      observer.disconnect();
    };
  }, [open, setRect, minWidth, minHeight]);

  const startDrag = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea")
    ) {
      return;
    }

    dragRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      initialX: rect.x,
      initialY: rect.y,
    };
  };

  if (!open) return null;

  const safeRect =
    typeof window === "undefined"
      ? rect
      : getSafeRect(rect, minWidth, minHeight);

  return createPortal(
    <div className="floating-window-layer">
      <section
        ref={windowRef}
        className={cn("floating-window", className)}
        style={{
          left: safeRect.x,
          top: safeRect.y,
          width: safeRect.w,
          height: safeRect.h,
          minWidth,
          minHeight,
        }}
      >
        <div
          ref={titlebarRef}
          className={cn("floating-window-titlebar", titlebarClassName)}
          onMouseDown={startDrag}
        >
          <div className="floating-window-title-area">
            <div className="floating-window-title">{title}</div>
            {subtitle && (
              <div className="floating-window-subtitle">{subtitle}</div>
            )}
          </div>

          <div className="floating-window-actions">
            {actions}

            <button
              type="button"
              onClick={onClose}
              className="glass-button h-8 w-8 flex items-center justify-center"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="floating-window-body">{children}</div>
      </section>
    </div>,
    document.body
  );
};