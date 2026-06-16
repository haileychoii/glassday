import { useEffect, useState } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import type { Layout, Layouts } from "react-grid-layout";

import { defaultLayouts } from "./gridDefaults";

import { TodayFocusWidget } from "../widgets/TodayFocusWidget";
import { CalendarWidget } from "../widgets/CalendarWidget";
import { MemoWidget } from "../widgets/MemoWidget";
import { StudyWidget } from "../widgets/StudyWidget";
import { CareerWidget } from "../widgets/CareerWidget";
import { HealthWidget } from "../widgets/HealthWidget";
import { MoneyWidget } from "../widgets/MoneyWidget";
import { MoodWidget } from "../widgets/MoodWidget";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const STORAGE_KEY = "glassday.dashboard.layouts";

type DashboardGridProps = {
  editMode: boolean;
};

const loadLayouts = (): Layouts => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultLayouts;

    return JSON.parse(saved) as Layouts;
  } catch {
    return defaultLayouts;
  }
};

export const DashboardGrid = ({ editMode }: DashboardGridProps) => {
  const [layouts, setLayouts] = useState<Layouts>(() => loadLayouts());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
  }, [layouts]);

  return (
    <ResponsiveGridLayout
      className={`layout ${editMode ? "is-editing" : "is-viewing"}`}
      layouts={layouts}
      breakpoints={{
        lg: 1200,
        md: 768,
        sm: 0,
      }}
      cols={{
        lg: 12,
        md: 12,
        sm: 4,
      }}
      rowHeight={76}
      margin={[18, 18]}
      containerPadding={[0, 0]}
      draggableHandle=".drag-handle"
      isDraggable={editMode}
      isResizable={editMode}
      compactType="vertical"
      preventCollision={false}
      onLayoutChange={(_: Layout[], allLayouts: Layouts) => {
        if (editMode) {
          setLayouts(allLayouts);
        }
      }}
    >
      <div key="today">
        <TodayFocusWidget />
      </div>

      <div key="calendar">
        <CalendarWidget />
      </div>

      <div key="memo">
        <MemoWidget />
      </div>

      <div key="study">
        <StudyWidget />
      </div>

      <div key="career">
        <CareerWidget />
      </div>

      <div key="health">
        <HealthWidget />
      </div>

      <div key="money">
        <MoneyWidget />
      </div>

      <div key="mood">
        <MoodWidget />
      </div>
    </ResponsiveGridLayout>
  );
};