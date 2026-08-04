/**
 * ============================================================
 * [Legacy Hook] Previous Single-layout Grid Persistence
 * ============================================================
 *
 * 현재 연결 상태:
 * - 현재 DashboardGrid에서는 import하지 않는 legacy Hook이다.
 * - 실제 Wide/Laptop별 layout 저장은 src/hooks/useDashboardTabs.ts가 담당한다.
 *
 * 유지 이유:
 * - 이전 저장 구조를 확인하거나 migration을 추적할 때 참고할 수 있어 삭제하지 않는다.
 * - 새 Grid 기능은 이 Hook이 아니라 useDashboardTabs와
 *   src/components/grid/gridDefaults.ts를 기준으로 수정한다.
 *
 * Storage: glassday-layouts (현재 glassday. prefix 규칙과 다른 옛 key)
 * ============================================================
 */
import { useEffect, useState } from "react";
import type { Layout } from "react-grid-layout";

type Layouts = Record<string, Layout[]>;

const STORAGE_KEY = "glassday-layouts";

/** 현재 사용되지 않는 단일 layout persistence API. */
export const useDashboardLayout = (
  defaultLayouts: Layouts
) => {
  const [layouts, setLayouts] = useState<Layouts>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return defaultLayouts;

      return JSON.parse(saved);
    } catch {
      return defaultLayouts;
    }
  });

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(layouts)
    );
  }, [layouts]);

  const resetLayouts = () => {
    setLayouts(defaultLayouts);

    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    layouts,
    setLayouts,
    resetLayouts,
  };
};
