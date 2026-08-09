/**
 * ============================================================
 * [Figma Mapping] Overlay / Floating Window
 * ============================================================
 *
 * 화면 역할:
 * - Dashboard 위에 독립적으로 이동·resize 가능한 detail window shell을 제공한다.
 * - `createPortal(document.body)`를 사용하므로 Dashboard Grid의 overflow와 stacking
 *   context에 잘리지 않는다.
 *
 * 사용 컴포넌트:
 * - CalendarWidget, MemoWidget, MoneyWidget, TimerWidget
 * - StudyDetailWindow를 통한 StudyWidget
 *
 * 저장 연결:
 * - 호출자가 전달한 `storageKey`로 x/y/w/h를 `useLocalStorage`에 저장한다.
 * - 각 Window는 서로 다른 key를 사용하므로 위치와 크기가 독립적이다.
 *
 * 스타일 연결:
 * - `src/styles/overlays.css`
 * - Floating surface의 Theme override는 `src/styles/themes/*.css`
 *
 * Figma 구조:
 * - Overlay Layer
 *   - Floating Window / Vertical Auto Layout
 *     - Title Bar / Horizontal Auto Layout / Space Between
 *     - Body / Fill container / Scroll policy는 child가 결정
 * ============================================================
 */
import { useEffect, useRef, useState } from "react";
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
  /** false이면 Portal 자체를 렌더링하지 않는다. */
  open: boolean;
  /** Title Bar의 Primary Text. */
  title: string;
  subtitle?: string;
  /** 이 Window의 위치와 크기를 저장하는 고유 localStorage key. */
  storageKey: string;
  defaultRect?: FloatingWindowRect;
  minWidth?: number;
  minHeight?: number;
  className?: string;
  titlebarClassName?: string;
  /** Title Bar 우측에 Close 앞쪽으로 삽입되는 widget 전용 action. */
  actions?: ReactNode;
  /** Window Body. 내부 scroll 구조는 각 feature CSS가 소유한다. */
  children: ReactNode;
  onClose: () => void;
};

const getSafeRect = (
  rect: FloatingWindowRect,
  minWidth: number,
  minHeight: number
): FloatingWindowRect => {
  const viewportInset = 12;
  const availableWidth = Math.max(240, window.innerWidth - viewportInset * 2);
  const availableHeight = Math.max(220, window.innerHeight - viewportInset * 2);
  const effectiveMinWidth = Math.min(minWidth, availableWidth);
  const effectiveMinHeight = Math.min(minHeight, availableHeight);
  const safeWidth = Math.min(
    Math.max(effectiveMinWidth, rect.w),
    availableWidth
  );
  const safeHeight = Math.min(
    Math.max(effectiveMinHeight, rect.h),
    availableHeight
  );
  const maxX = Math.max(viewportInset, window.innerWidth - safeWidth - viewportInset);
  const maxY = Math.max(viewportInset, window.innerHeight - safeHeight - viewportInset);

  return {
    x: Math.min(Math.max(viewportInset, rect.x), maxX),
    y: Math.min(Math.max(viewportInset, rect.y), maxY),
    w: safeWidth,
    h: safeHeight,
  };
};

/**
 * FloatingWindow
 *
 * Figma Component: `Floating Window`.
 * Close는 외부 click과 Close button 모두 지원하며, drag는 Title Bar의 form/control
 * 바깥에서만 시작된다. ResizeObserver가 CSS resize 결과를 저장 rect에 반영한다.
 */
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
  const [, setViewportRevision] = useState(0);

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

    let animationFrame = 0;
    const refreshViewportClamp = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        /*
         * Responsive window shell: saved desktop geometry stays untouched,
         * while a viewport resize immediately recalculates the temporary safe
         * rectangle. 브라우저가 좁아져도 창이 화면 밖에 남지 않게 한다.
         */
        setViewportRevision((revision) => revision + 1);
      });
    };

    window.addEventListener("resize", refreshViewportClamp);

    return () => {
      window.removeEventListener("resize", refreshViewportClamp);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [open]);

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
      const isViewportConstrained =
        window.innerWidth - 24 < minWidth || window.innerHeight - 24 < minHeight;

      /* A desktop-sized saved window is rendered smaller on phones, but that
         temporary viewport clamp must not overwrite its persisted desktop rect.
         모바일 표시용 축소 크기와 사용자가 직접 resize한 저장 크기를 구분합니다. */
      if (isViewportConstrained) return;

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
    /* Figma Overlay Layer: modal backdrop가 아니므로 Dashboard를 blur/block하지 않는다. */
    <div className="floating-window-layer">
      <section
        ref={windowRef}
        className={cn("floating-window", className)}
        role="dialog"
        aria-modal="false"
        aria-label={title}
        style={{
          left: safeRect.x,
          top: safeRect.y,
          width: safeRect.w,
          height: safeRect.h,
          minWidth: Math.min(minWidth, safeRect.w),
          minHeight: Math.min(minHeight, safeRect.h),
        }}
      >
        {/* Figma Frame: Floating Window Title Bar / drag handle / Space Between */}
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
              aria-label={`Close ${title}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Figma Frame: Floating Window Body / feature가 자체 Scroll Container를 정의 */}
        <div className="floating-window-body">{children}</div>
      </section>
    </div>,
    document.body
  );
};
