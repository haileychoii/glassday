/**
 * [레이아웃 연결 지점 / Layout attachment point]
 *
 * 하는 일:
 * - DashboardGrid 또는 MobileDashboard가 배치한 자리에 기존 위젯 DOM을 붙인다.
 * - 위젯 자체를 만들거나 사용자 데이터를 저장하지 않는다.
 *
 * 연결 파일:
 * - src/components/widgets/WidgetRenderer.tsx가 위젯별 host를 생성한다.
 * - src/components/widgets/widgetHostContext.ts의 attach가 DOM 이동과 포커스를 처리한다.
 * - src/components/grid/DashboardGrid.tsx 및 src/components/mobile/MobileDashboard.tsx가 이 slot을 배치한다.
 *
 * English: This component only attaches the existing widget host to a layout slot.
 * Keeping it separate prevents desktop/mobile layout changes from remounting widgets.
 */
import { useCallback, useContext } from "react";
import { WidgetHostContext } from "./widgetHostContext";

export const WidgetSlot = ({ widgetId, editMode = false }: {
  widgetId: string;
  editMode?: boolean;
}) => {
  const host = useContext(WidgetHostContext)[widgetId];

  // React ref lifecycle handles attach/detach when a responsive layout moves this slot.
  const attach = useCallback((slot: HTMLDivElement | null) => {
    if (!host || !slot) return;
    return host.attach(slot, editMode);
  }, [host, editMode]);

  // `display: contents` avoids adding a visual box around the widget itself.
  return host ? <div ref={attach} style={{ display: "contents" }} /> : (
    <div className="glass-card unknown-widget-card">Unknown widget: {widgetId}</div>
  );
};
