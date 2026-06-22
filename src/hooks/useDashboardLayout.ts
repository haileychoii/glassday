import { useEffect, useState } from "react";
import type { Layout } from "react-grid-layout";

type Layouts = Record<string, Layout[]>;

const STORAGE_KEY = "glassday-layouts";

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