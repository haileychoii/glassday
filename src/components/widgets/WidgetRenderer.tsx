/**
 * [Figma Mapping] Shared Widget Instances / App -> layout slots
 * Owns one React instance per visible widget, independent of the selected shell.
 * Stable portal targets let WidgetSlot move existing DOM on breakpoint changes:
 * Money drafts, Memo editor DOM and open details keep their local state.
 * 모바일/데스크톱을 두 번 렌더링하지 않고 같은 위젯의 표시 위치만 옮깁니다.
 * Styles: existing widgets/*.css; slot sizing belongs to each layout.
 */
import { useState, type ComponentType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { allWidgetIds } from "../../constants/widgets";
import { WidgetHostContext, createWidgetHost } from "./widgetHostContext";
import { TodayFocusWidget } from "./TodayFocusWidget";
import { AlertCenterWidget } from "./AlertCenterWidget";
import { DailyJournalWidget } from "./DailyJournalWidget";
import { CalendarWidget } from "./CalendarWidget";
import { MemoWidget } from "./MemoWidget";
import { StudyWidget } from "./StudyWidget";
import { TimerWidget } from "./TimerWidget";
import { CareerWidget } from "./CareerWidget";
import { HealthWidget } from "./HealthWidget";
import { MoneyWidget } from "./MoneyWidget";
import { MoodWidget } from "./MoodWidget";

/*
 * Widget ID와 실제 화면 컴포넌트를 연결하는 단일 렌더러 표다.
 * 새 ID를 추가할 때는 src/constants/widgets.ts의 registry, 이 표,
 * src/components/grid/gridDefaults.ts의 기본 배치도 함께 확인한다.
 *
 * This is the ID-to-component map. When adding a widget, update the metadata
 * registry, this renderer, and the default grid layouts together.
 */
const widgetComponents: Record<string, ComponentType> = {
  today: TodayFocusWidget,
  alerts: AlertCenterWidget,
  journal: DailyJournalWidget,
  calendar: CalendarWidget,
  memo: MemoWidget,
  study: StudyWidget,
  timer: TimerWidget,
  career: CareerWidget,
  health: HealthWidget,
  money: MoneyWidget,
  // Legacy saved layouts may still contain `wealth`; keep it as a data-safe alias.
  wealth: MoneyWidget,
  mood: MoodWidget,
};

export const WidgetRenderer = ({ widgetIds, children }: {
  widgetIds: string[];
  children: ReactNode;
}) => {
  /* Hosts are created once so switching desktop/mobile slots moves the same
     widget DOM instead of remounting it and losing unsaved editor state.
     Host attachment is implemented in widgetHostContext.ts and WidgetSlot.tsx. */
  const [hosts] = useState(() => Object.fromEntries(
    [...new Set([...allWidgetIds, ...Object.keys(widgetComponents)])]
      .map((id) => [id, createWidgetHost(id)]),
  ));

  return (
    <WidgetHostContext.Provider value={hosts}>
      {children}
      {widgetIds.map((id) => {
        const Widget = widgetComponents[id];
        return Widget && hosts[id] ? createPortal(<Widget />, hosts[id].element, id) : null;
      })}
      {/* Calendar may open Career details from a workspace without Career.
          상세 전용 host도 breakpoint 전환과 무관하게 한 번만 유지합니다. */}
      {!widgetIds.includes("career") && <CareerWidget detailOnly />}
    </WidgetHostContext.Provider>
  );
};
