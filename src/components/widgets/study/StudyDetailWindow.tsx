/**
 * [Figma Mapping] Study / Floating Detail Shell
 * Parent: src/components/widgets/StudyWidget.tsx
 * Shell: src/components/common/FloatingWindow.tsx
 * 이 component는 planner state를 만들지 않고 Widget이 전달한 동일한 children을 감싼다.
 * Figma 구조: Floating Title Bar + Scrollable Expanded Planner Body.
 */
import type { ReactNode } from "react";

import { FloatingWindow } from "../../common/FloatingWindow";

type StudyDetailWindowProps = {
  /** Floating Window의 Open/Closed Variant. */
  open: boolean;
  /** 선택 날짜와 총 공부 시간을 Title Bar의 Secondary Text로 표시한다. */
  subtitle: string;
  /** StudyWidget이 widget mode와 공유하는 planner tree. */
  children: ReactNode;
  /** FloatingWindow close action을 StudyWidget state로 전달한다. */
  onClose: () => void;
};

/** Widget과 별도 storage를 만들지 않는 movable/resizable Study detail shell. */
export const StudyDetailWindow = ({
  open,
  subtitle,
  children,
  onClose,
}: StudyDetailWindowProps) => (
  <FloatingWindow
    open={open}
    title="Study Planner"
    subtitle={subtitle}
    storageKey="glassday.study.detailWindow.rect.v2"
    defaultRect={{
      x: 120,
      y: 56,
      w: 1120,
      h: 780,
    }}
    minWidth={280}
    minHeight={360}
    className="study10-floating-window"
    onClose={onClose}
  >
    <div className="study10-detail-body">{children}</div>
  </FloatingWindow>
);
