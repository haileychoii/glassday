/**
 * [Figma Mapping] Widget Instance Bridge / 화면 위치와 내용의 연결
 *
 * 이 파일은 카드를 그리거나 데이터를 저장하지 않습니다. 화면 이동 때
 * 기존 위젯 DOM을 데스크톱 그리드와 모바일 슬롯 사이에서 옮길 빈 host를
 * 만들고, 입력 중인 커서와 선택 범위를 기억합니다.
 *
 * 연결 흐름:
 * WidgetRenderer → createWidgetHost(widgetId) → WidgetSlot.attach(slot)
 * → 같은 React 위젯 DOM을 새 위치에 append
 *
 * Figma에서는 host 자체를 보이는 Component로 만들지 않습니다. 실제 Frame은
 * 각 Widget TSX/GlassCard이고, host는 Component instance를 배치하는 invisible slot입니다.
 */
import { createContext } from "react";

export type WidgetHost = {
  element: HTMLDivElement;
  attach: (slot: HTMLElement, editMode: boolean) => () => void;
};

export const WidgetHostContext = createContext<Record<string, WidgetHost>>({});

export const createWidgetHost = (id: string): WidgetHost => {
  // dashboard-grid-item은 데스크톱 스타일/선택자를 재사용하고,
  // widget-instance-root는 모바일이 host를 정확히 찾도록 붙이는 식별 이름입니다.
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
      // appendChild는 기존 element를 새 자리로 이동시킵니다. 두 번째 위젯을 복제하지 않습니다.
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
