/**
 * [위젯 DOM 이동 브리지 / Widget DOM bridge]
 *
 * 연결 순서:
 * - WidgetRenderer.tsx에서 widget ID마다 host를 한 번 만든다.
 * - WidgetSlot.tsx가 현재 레이아웃 위치에 host.element를 붙인다.
 * - 화면 크기나 탭 구성이 바뀌면 기존 DOM을 떼었다가 새 slot에 붙인다.
 *
 * 이 파일은 React 위젯 상태나 localStorage를 소유하지 않는다. DOM을 옮길 때
 * 브라우저가 잃을 수 있는 포커스와 contenteditable 선택 범위만 임시 보관한다.
 *
 * This in-memory bridge preserves the mounted widget DOM, input focus, and text
 * selection across layout changes. Durable app data remains in widget contexts/hooks.
 */
import { createContext } from "react";

export type WidgetHost = {
  element: HTMLDivElement;
  attach: (slot: HTMLElement, editMode: boolean) => () => void;
};

export const WidgetHostContext = createContext<Record<string, WidgetHost>>({});

export const createWidgetHost = (id: string): WidgetHost => {
  const element = document.createElement("div");
  element.className = "dashboard-grid-item widget-instance-root";
  // Only the outer desktop grid item owns edit dimming. Preserve existing
  // direct-child theme selectors without dimming the nested host twice.
  element.style.opacity = "1";
  element.style.filter = "none";
  element.dataset.widgetInstance = id;
  // These references exist only during a detach/attach cycle; they are not persisted.
  let focused: HTMLElement | null = null;
  let selection: Range | null = null;

  return {
    element,
    attach(slot, editMode) {
      element.classList.toggle("is-editing", editMode);
      slot.appendChild(element);
      if (focused?.isConnected) {
        focused.focus({ preventScroll: true });
        if (selection && focused.isContentEditable) {
          const current = window.getSelection();
          current?.removeAllRanges();
          current?.addRange(selection);
        }
        focused = null;
        selection = null;
      }
      return () => {
        // Browser focus/selection can disappear when DOM is detached, even
        // though React state survives. / 입력 커서도 새 슬롯에서 복원합니다.
        const active = document.activeElement;
        if (active instanceof HTMLElement && element.contains(active)) {
          focused = active;
          const current = window.getSelection();
          selection = active.isContentEditable && current?.rangeCount
            ? current.getRangeAt(0).cloneRange() : null;
        }
        element.remove();
      };
    },
  };
};
