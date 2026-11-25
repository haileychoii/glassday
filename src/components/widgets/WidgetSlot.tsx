/**
 * [Figma Mapping] Widget Placement / Dashboard Slot
 *
 * 화면에 보이는 카드를 새로 만드는 컴포넌트가 아니라, WidgetRenderer가
 * 이미 만든 위젯 한 벌을 지금 레이아웃의 자리에 붙이는 연결 부품입니다.
 *
 * 사용 위치:
 * - 큰 화면 편집 그리드: DashboardGrid → WidgetSlot
 * - 모바일 목록: MobileDashboard → WidgetSlot(attachToParent)
 *
 * 결과 DOM:
 * - 일반 슬롯: 이 컴포넌트가 받은 자리 안에 widget-instance-root를 붙입니다.
 * - attachToParent: 한 단계 바깥의 mobile-widget-slot에 직접 붙입니다.
 *   그래서 모바일 CSS가 data-widget-id로 카드 전체를 찾을 수 있습니다.
 *
 * 이 파일은 위젯의 데이터, 제목, CSS, 저장 상태를 소유하지 않습니다.
 * 그 내용은 원래 위젯 TSX와 widgetHostContext의 동일한 DOM 인스턴스에 남습니다.
 */
import { useCallback, useContext } from "react";
import { WidgetHostContext } from "./widgetHostContext";

export const WidgetSlot = ({ widgetId, editMode = false, attachToParent = false }: {
  widgetId: string;
  editMode?: boolean;
  /** Mount the shared widget host in the surrounding mobile slot itself. */
  attachToParent?: boolean;
}) => {
  // widgetId는 Registry/Renderer/Grid에서 공통으로 사용하는 위젯의 영구 이름입니다.
  const host = useContext(WidgetHostContext)[widgetId];
  const attach = useCallback((slot: HTMLDivElement | null) => {
    if (!host || !slot) return;
    // 모바일은 부모 슬롯을 직접 스타일링하고, 데스크톱 그리드는 자기 자식으로 배치합니다.
    const target = attachToParent ? slot.parentElement ?? slot : slot;
    return host.attach(target, editMode);
  }, [host, editMode, attachToParent]);

  return host ? <div ref={attach} style={{ display: "contents" }} /> : (
    <div className="glass-card unknown-widget-card">Unknown widget: {widgetId}</div>
  );
};
