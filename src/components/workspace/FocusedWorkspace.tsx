/**
 * ============================================================
 * [Workspace] One-screen primary workspaces / 탭별 한 화면 작업공간
 * ============================================================
 *
 * Parent: src/App.tsx
 * Reused features:
 * - Career: src/components/widgets/CareerWidget.tsx
 * - Study: src/components/widgets/StudyWidget.tsx
 *
 * DashboardGrid remains available for Home Widgets and custom boards. Locked
 * Career/Study tabs mount their existing data-owning components here instead
 * of duplicating state in a new page. / 기존 저장값과 기능을 그대로 쓰면서
 * 여러 위젯을 세로로 쌓아 생기던 페이지 스크롤만 제거한다.
 * ============================================================
 */
import { CareerWidget } from "../widgets/CareerWidget";
import { StudyWidget } from "../widgets/StudyWidget";

export type FocusedWorkspaceId = "career" | "study";

type FocusedWorkspaceProps = {
  workspaceId: FocusedWorkspaceId;
};

export const FocusedWorkspace = ({
  workspaceId,
}: FocusedWorkspaceProps) => {
  return (
    <section
      className={`focused-workspace focused-workspace--${workspaceId}`}
      aria-label={`${workspaceId} workspace`}
    >
      {workspaceId === "career" ? (
        <CareerWidget surface="workspace" />
      ) : (
        <StudyWidget surface="workspace" />
      )}
    </section>
  );
};
