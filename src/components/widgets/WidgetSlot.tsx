/**
 * [Layout Slot] Attaches the single shared WidgetRenderer instance.
 * Connection: DashboardGrid / MobileDashboard -> WidgetHostContext.
 * No widget state or storage writes. / 레이아웃 교체 시 입력 DOM도 유지합니다.
 */
import { useCallback, useContext } from "react";
import { WidgetHostContext } from "./widgetHostContext";

export const WidgetSlot = ({ widgetId, editMode = false, attachToParent = false }: {
  widgetId: string;
  editMode?: boolean;
  /** Mount the shared widget host in the surrounding mobile slot itself. */
  attachToParent?: boolean;
}) => {
  const host = useContext(WidgetHostContext)[widgetId];
  const attach = useCallback((slot: HTMLDivElement | null) => {
    if (!host || !slot) return;
    const target = attachToParent ? slot.parentElement ?? slot : slot;
    return host.attach(target, editMode);
  }, [host, editMode, attachToParent]);

  return host ? <div ref={attach} style={{ display: "contents" }} /> : (
    <div className="glass-card unknown-widget-card">Unknown widget: {widgetId}</div>
  );
};
