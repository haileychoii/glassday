import type { ReactNode } from "react";

import { FloatingWindow } from "../../common/FloatingWindow";

type StudyDetailWindowProps = {
  open: boolean;
  subtitle: string;
  children: ReactNode;
  onClose: () => void;
};

/* Study detail shell
   The dashboard widget owns all planner data and interaction state. This file
   only supplies the movable, resizable Glassday window so the compact widget
   and detail view never create competing storage hooks. / 상세 창은 동일한
   플래너 본문을 감싸기만 하므로 위젯과 데이터가 항상 함께 갱신됩니다. */
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
    minWidth={640}
    minHeight={480}
    className="study10-floating-window"
    onClose={onClose}
  >
    <div className="study10-detail-body">{children}</div>
  </FloatingWindow>
);
