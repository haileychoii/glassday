/**
 * The reusable versions of the original thin-line workspace navigation icons.
 * Keep one map so the picker preview and the actual tab render the same glyph.
 */
import {
  BookOpen,
  BriefcaseBusiness,
  HeartPulse,
  House,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";

const outlineIcons: Record<string, LucideIcon> = {
  "outline:home": House,
  "outline:career": BriefcaseBusiness,
  "outline:study": BookOpen,
  "outline:memo": NotebookPen,
  "outline:life": HeartPulse,
};

export const getWorkspaceOutlineIcon = (value?: string): LucideIcon | undefined =>
  value ? outlineIcons[value] : undefined;
