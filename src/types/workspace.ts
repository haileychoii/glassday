import type { Layout } from "react-grid-layout";

export type Layouts = Record<string, Layout[]>;

export type WorkspaceId = "home" | "career" | "study" | "memo" | "life";

export type DashboardTab = {
  id: WorkspaceId;
  label: string;
  icon: string;
  layouts: Layouts;
  widgetIds: string[];
};