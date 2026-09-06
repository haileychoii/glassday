/**
 * [Layout Slot] Attaches the single shared WidgetRenderer instance.
 * Connection: DashboardGrid / MobileDashboard -> WidgetHostContext.
 * No widget state or storage writes. / 레이아웃 교체 시 입력 DOM도 유지합니다.
 */
import { useCallback, useContext } from "react";
import { WidgetHostContext } from "./widgetHostContext";

export const WidgetSlot = ({ widgetId, editMode = false }: {
  widgetId: string;
  editMode?: boolean;
}) => {
  const host = useContext(WidgetHostContext)[widgetId];
  const attach = useCallback((slot: HTMLDivElement | null) => {
    if (!host || !slot) return;
    return host.attach(slot, editMode);
  }, [host, editMode]);

  return host ? <div ref={attach} style={{ display: "contents" }} /> : (
    <div className="glass-card unknown-widget-card">Unknown widget: {widgetId}</div>
  );
};
