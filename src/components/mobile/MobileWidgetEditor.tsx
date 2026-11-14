
/**
 * ============================================================
 * GLASSDAY — MOBILE WIDGET EDITOR
 * 저장: src/components/mobile/MobileWidgetEditor.tsx
 *
 * 연결:
 * App.tsx
 *  └─ useMobileWidgetLayout(activeTab)
 *      └─ MobileWidgetEditor.tsx
 *
 * 기능:
 * 1. 위젯 표시/숨김
 * 2. 모바일 위젯 순서 위/아래 이동
 * 3. 전체 폭 / 절반 폭 선택
 * 4. 자동 높이 / 사용자 지정 높이
 * 5. 모바일 전용 위젯 추가 및 제거
 * 6. 현재 워크스페이스 설정 초기화
 *
 * 저장:
 * - 직접 localStorage에 접근하지 않는다.
 * - 모든 변경은 useMobileWidgetLayout으로 전달.
 *
 * 스타일:
 * - Tailwind + 기존 Glassday 테마 변수 사용.
 * - PC DashboardGrid에 영향을 주지 않는다.
 * ============================================================
 */

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { useState } from "react";

import { widgetRegistry } from "../../constants/widgets";

import {
  MOBILE_WIDGET_MIN_HEIGHT,
  MOBILE_WIDGET_MAX_HEIGHT,
  MOBILE_WIDGET_HEIGHT_STEP,
} from "../../hooks/useMobileWidgetLayout";

import type {
  MobileWidgetLayoutController,
  MobileWidgetWidth,
} from "../../hooks/useMobileWidgetLayout";

/* 01. PROPS */

type MobileWidgetEditorProps = {
  layout: MobileWidgetLayoutController;
  onClose: () => void;
};

/* 02. SHARED BUTTON CLASSES */

const iconButtonClass =
  "inline-flex h-9 w-9 shrink-0 items-center " +
  "justify-center rounded-lg border border-border " +
  "bg-secondary text-foreground " +
  "disabled:cursor-not-allowed disabled:opacity-35";

const controlClass =
  "min-h-10 w-full min-w-0 rounded-lg " +
  "border border-border bg-background px-3 " +
  "text-sm text-foreground";

/* 03. MAIN EDITOR */

export const MobileWidgetEditor = ({
  layout,
  onClose,
}: MobileWidgetEditorProps) => {

  /**
   * 새로 추가할 위젯 ID.
   * 저장 데이터가 아닌 편집 화면의 임시 선택값.
   */
  const [newWidgetId, setNewWidgetId] = useState("");

  const addSelectedWidget = () => {
    if (!newWidgetId) return;

    layout.addWidget(newWidgetId);
    setNewWidgetId("");
  };

  return (
    <section
      className="flex min-w-0 flex-col gap-3 px-3 pb-8 pt-3 text-foreground"
      aria-label="모바일 위젯 편집"
    >

      {/* ==================================================
          01. EDITOR HEADER
          현재 워크스페이스 편집 중임을 표시.
         ================================================== */}

      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 text-lg font-bold">
            위젯 편집
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            모바일 화면에만 적용돼.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-10 shrink-0 items-center
                     justify-center rounded-xl bg-primary
                     px-4 text-sm font-semibold text-primary-foreground"
        >
          완료
        </button>
      </header>

      {/* ==================================================
          02. INSTRUCTIONS
         ================================================== */}

      <p className="m-0 text-xs leading-relaxed text-muted-foreground">
        화살표로 순서를 변경하고, 눈 모양 버튼으로
        표시 여부를 선택해. 위젯별 가로·세로 크기도
        조절할 수 있어.
      </p>

      {/* ==================================================
          03. WIDGET LIST
          Hook에서 전달받은 순서를 그대로 표시한다.
         ================================================== */}

      {layout.items.map((item, index) => (
        <section
          key={item.id}
          className={[
            "min-w-0 rounded-2xl border border-border",
            "bg-card p-3",
            item.visible ? "" : "opacity-65",
          ].join(" ")}
          aria-label={`${item.label} 위젯 설정`}
        >

          {/* 위젯 이름 + 순서 변경 + 숨김 */}
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="m-0 truncate text-sm font-bold">
                {item.label}
              </h3>

              <p className="mt-1 truncate text-xs text-muted-foreground">
                {item.isMobileOnly
                  ? "모바일에서만 추가됨"
                  : item.description || "기본 위젯"}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                layout.moveWidget(item.id, -1)
              }
              disabled={index === 0}
              className={iconButtonClass}
              aria-label={`${item.label} 위로 이동`}
              title="위로 이동"
            >
              <ArrowUp size={16} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() =>
                layout.moveWidget(item.id, 1)
              }
              disabled={
                index === layout.items.length - 1
              }
              className={iconButtonClass}
              aria-label={`${item.label} 아래로 이동`}
              title="아래로 이동"
            >
              <ArrowDown size={16} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() =>
                layout.setWidgetVisible(
                  item.id,
                  !item.visible
                )
              }
              className={iconButtonClass}
              aria-label={
                item.visible
                  ? `${item.label} 모바일에서 숨기기`
                  : `${item.label} 모바일에서 표시`
              }
              title={
                item.visible
                  ? "숨기기"
                  : "표시하기"
              }
              aria-pressed={item.visible}
            >
              {item.visible ? (
                <Eye size={16} aria-hidden="true" />
              ) : (
                <EyeOff size={16} aria-hidden="true" />
              )}
            </button>
          </div>

          {/* ================================================
              04. WIDTH / HEIGHT CONTROLS
             ================================================ */}

          <div className="mt-3 grid grid-cols-2 gap-2">

            {/* 가로 크기 */}
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-xs font-medium">
                가로 크기
              </span>

              <select
                className={controlClass}
                value={item.width}
                disabled={!item.canUseHalf}
                onChange={(event) =>
                  layout.setWidth(
                    item.id,
                    event.target.value as MobileWidgetWidth
                  )
                }
              >
                <option value="full">전체 폭</option>

                {item.canUseHalf && (
                  <option value="half">절반 폭</option>
                )}
              </select>
            </label>

            {/* 세로 크기 방식 */}
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-xs font-medium">
                세로 크기
              </span>

              <select
                className={controlClass}
                value={
                  item.height === null
                    ? "auto"
                    : "custom"
                }
                onChange={(event) => {
                  const custom =
                    event.target.value === "custom";

                  layout.setHeight(
                    item.id,
                    custom ? 360 : null
                  );
                }}
              >
                <option value="auto">자동</option>
                <option value="custom">직접 지정</option>
              </select>
            </label>
          </div>

          {/* ================================================
              05. HEIGHT SLIDER
              직접 지정한 위젯에만 표시.
             ================================================ */}

          {item.height !== null && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`mobile-widget-height-${item.id}`}
                  className="text-xs font-medium"
                >
                  위젯 높이
                </label>

                <span className="text-xs font-semibold tabular-nums">
                  {item.height}px
                </span>
              </div>

              <input
                id={`mobile-widget-height-${item.id}`}
                type="range"
                min={MOBILE_WIDGET_MIN_HEIGHT}
                max={MOBILE_WIDGET_MAX_HEIGHT}
                step={MOBILE_WIDGET_HEIGHT_STEP}
                value={item.height}
                onChange={(event) =>
                  layout.setHeight(
                    item.id,
                    Number(event.target.value)
                  )
                }
                className="w-full accent-primary"
                aria-label={`${item.label} 높이 조절`}
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MOBILE_WIDGET_MIN_HEIGHT}px</span>
                <span>{MOBILE_WIDGET_MAX_HEIGHT}px</span>
              </div>
            </div>
          )}

          {/* ================================================
              06. MOBILE-ONLY REMOVE
              기본 PC 위젯은 여기서 삭제하지 않는다.
             ================================================ */}

          {item.isMobileOnly && (
            <button
              type="button"
              onClick={() =>
                layout.removeMobileWidget(item.id)
              }
              className="mt-3 inline-flex min-h-9 items-center
                         gap-2 rounded-lg px-2 text-xs
                         font-medium text-destructive"
            >
              <Trash2 size={15} aria-hidden="true" />
              모바일에서 제거
            </button>
          )}

        </section>
      ))}

      {/* ==================================================
          07. ADD NEW WIDGET
          등록된 위젯 목록(widgetRegistry)에서 선택.
          PC 워크스페이스에는 추가하지 않는다.
         ================================================== */}

      <section className="rounded-2xl border border-border bg-card p-3">
        <h3 className="m-0 text-sm font-bold">
          위젯 추가
        </h3>

        <p className="mt-1 text-xs text-muted-foreground">
          현재 모바일 워크스페이스에만 추가돼.
        </p>

        {layout.availableToAdd.length > 0 ? (
          <div className="mt-3 flex min-w-0 gap-2">
            <select
              value={newWidgetId}
              onChange={(event) =>
                setNewWidgetId(event.target.value)
              }
              className={`${controlClass} flex-1`}
              aria-label="추가할 위젯 선택"
            >
              <option value="">
                위젯을 선택해
              </option>

              {layout.availableToAdd.map((id) => (
                <option key={id} value={id}>
                  {widgetRegistry[id]?.label ?? id}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={!newWidgetId}
              onClick={addSelectedWidget}
              className="inline-flex min-h-10 shrink-0
                         items-center gap-1 rounded-lg bg-primary
                         px-3 text-sm font-semibold
                         text-primary-foreground
                         disabled:opacity-40"
            >
              <Plus size={16} aria-hidden="true" />
              추가
            </button>
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            추가할 수 있는 위젯이 없어.
            숨겨진 위젯은 위 목록에서 다시 켤 수 있어.
          </p>
        )}
      </section>

      {/* ==================================================
          08. RESET CURRENT WORKSPACE
          PC 설정 / 다른 모바일 탭에는 영향 없음.
         ================================================== */}

      <button
        type="button"
        onClick={() => {
          if (
            window.confirm(
              "이 워크스페이스의 모바일 위젯 배치를 초기화할까?"
            )
          ) {
            layout.resetTab();
          }
        }}
        className="inline-flex min-h-11 items-center
                   justify-center gap-2 rounded-xl
                   border border-border bg-secondary
                   px-3 text-sm font-medium"
      >
        <RotateCcw size={16} aria-hidden="true" />
        이 탭의 모바일 배치 초기화
      </button>

    </section>
  );
};
