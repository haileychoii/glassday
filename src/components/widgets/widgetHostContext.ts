/**
 * [UI Bridge] Stable widget DOM hosts, shared by desktop/mobile slots.
 * Not application data or storage. / 화면 이동 때만 사용하는 메모리 내 참조입니다.
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
