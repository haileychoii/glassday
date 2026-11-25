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
import { HabitTrackerWidget } from "./HabitTrackerWidget";
import { MoneyWidget } from "./MoneyWidget";
import { MoodWidget } from "./MoodWidget";

/*
 * [Figma Mapping] Widget Name → React Component
 *
 * `widgetId`를 실제 화면 컴포넌트로 바꾸는 목록입니다. 새 위젯이
 * 선택 목록에는 보이지만 화면에 그려지지 않으면 이 표의 연결 여부를
 * 확인하세요. 이름은 widgetRegistry, DashboardGrid, 저장 layout의 i와
 * 동일해야 합니다. `wealth`는 예전에 저장된 배치를 읽기 위한 호환 별칭입니다.
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
  habitTracker: HabitTrackerWidget,
  money: MoneyWidget,
  wealth: MoneyWidget,
  mood: MoodWidget,
};

export const WidgetRenderer = ({ widgetIds, children }: {
  widgetIds: string[];
  children: ReactNode;
}) => {
  // Host는 최초 한 번만 만들고 화면 모드가 바뀌어도 그대로 재사용합니다.
  // React 위젯을 매번 다시 만들면 입력 중인 값, 펼친 창, Timer 상태가 초기화될 수 있습니다.
  const [hosts] = useState(() => Object.fromEntries(
    [...new Set([...allWidgetIds, ...Object.keys(widgetComponents)])]
      .map((id) => [id, createWidgetHost(id)]),
  ));

  return (
    <WidgetHostContext.Provider value={hosts}>
      {children}
      {/* 보이는 각 위젯을 host 안에 한 번만 렌더링합니다. 화면 위치 변경은 WidgetSlot이 맡습니다. */}
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
