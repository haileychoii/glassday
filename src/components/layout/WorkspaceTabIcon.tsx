/**
 * Workspace tab icon shared by the desktop/Tauri and mobile-web navigation.
 * 데스크톱(Tauri)과 모바일 웹이 테마별 동일 아이콘 규칙을 사용하도록 연결합니다.
 *
 * Pixel Desk uses public pixel artwork, Mac Core and Pink Retro use emoji,
 * and the remaining themes use Lucide icons. This component changes no tab data.
 */
import {
  BookOpen,
  BriefcaseBusiness,
  FolderOpen,
  HeartPulse,
  House,
  NotebookPen,
} from "lucide-react";
import type { ThemeId } from "../../constants/themes";

type WorkspaceTabIconProps = {
  tabId: string;
  theme: ThemeId;
};

const lucideIcons: Record<string, typeof House> = {
  home: House,
  career: BriefcaseBusiness,
  study: BookOpen,
  memo: NotebookPen,
  life: HeartPulse,
};

const macEmoji: Record<string, string> = {
  home: "🏠",
  career: "💼",
  study: "📚",
  memo: "📝",
  life: "🌿",
};

export const WorkspaceTabIcon = ({ tabId, theme }: WorkspaceTabIconProps) => {
  const className = `workspace-theme-icon workspace-theme-icon-${theme}`;

  if (theme === "mac-core") {
    return <span className={className} aria-hidden="true">{macEmoji[tabId] ?? "✨"}</span>;
  }

  if (theme === "retro") {
    return (
      <span
        className={`${className} pink-diary-tab-icon pink-diary-tab-icon-${tabId}`}
        aria-hidden="true"
      />
    );
  }

  if (theme === "pixel-desk") {
    return (
      <img
        src={`/pixel-icons/${tabId === "memo" ? "diary" : tabId}.png`}
        className={`${className} pixel-tab-icon`}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    );
  }

  const Icon = lucideIcons[tabId] ?? FolderOpen;
  return <Icon className={className} aria-hidden="true" />;
};
