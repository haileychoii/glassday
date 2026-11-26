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
import {
  TbBookFilled,
  TbBriefcaseFilled,
  TbFileTextFilled,
  TbHeartFilled,
  TbHomeFilled,
} from "react-icons/tb";
import type { ThemeId } from "../../constants/themes";

type WorkspaceTabIconProps = {
  tabId: string;
  /** Emoji stored on a custom workspace; known emoji reuse the themed built-in glyph. */
  icon?: string;
  theme: ThemeId;
  mobile?: boolean;
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

const macMobileEmoji: Record<string, string> = {
  home: "🏠",
  career: "💼",
  study: "📚",
  memo: "📝",
  life: "❤️",
};

const pinkDiaryIcons: Record<string, string> = {
  home: "/pink-icons/isolated/home.png",
  career: "/pink-icons/isolated/career.png",
  study: "/pink-icons/isolated/study.png",
  memo: "/pink-icons/isolated/diary.png",
  diary: "/pink-icons/isolated/diary.png",
  life: "/pink-icons/isolated/life.png",
  calendar: "/pink-icons/isolated/calendar.png",
};

const glassMobileIcons = {
  home: TbHomeFilled,
  career: TbBriefcaseFilled,
  study: TbBookFilled,
  memo: TbFileTextFilled,
  life: TbHeartFilled,
};

const iconTabIds: Record<string, string> = {
  "🏠": "home",
  "💼": "career",
  "📚": "study",
  "📔": "memo",
  "🌿": "life",
};

export const WorkspaceTabIcon = ({
  tabId,
  icon,
  theme,
  mobile = false,
}: WorkspaceTabIconProps) => {
  const className = `workspace-theme-icon workspace-theme-icon-${theme}`;
  // Custom tabs select one of the same five icon identities used by built-in tabs.
  const resolvedTabId = lucideIcons[tabId]
    ? tabId
    : iconTabIds[icon ?? ""] ?? tabId;

  if (mobile && (theme === "glass-light" || theme === "glass-dark")) {
    const Icon =
      glassMobileIcons[resolvedTabId as keyof typeof glassMobileIcons] ??
      TbHomeFilled;
    return <Icon className={`${className} workspace-theme-icon-filled`} aria-hidden="true" />;
  }

  if (theme === "mac-core") {
    const emoji = mobile ? macMobileEmoji[resolvedTabId] : macEmoji[resolvedTabId];
    return (
      <span
        className={`${className}${mobile ? " workspace-theme-icon-ios-emoji" : ""}`}
        aria-hidden="true"
      >
        {emoji ?? "✨"}
      </span>
    );
  }

  if (theme === "retro") {
    return (
      <img
        src={pinkDiaryIcons[resolvedTabId] ?? pinkDiaryIcons.diary}
        className={`${className} pink-diary-tab-icon pink-diary-tab-icon-${resolvedTabId}`}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    );
  }

  if (theme === "pixel-desk") {
    return (
      <img
        src={`/pixel-icons/${resolvedTabId === "memo" ? "diary" : resolvedTabId}.png`}
        className={`${className} pixel-tab-icon`}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    );
  }

  const Icon = lucideIcons[resolvedTabId] ?? FolderOpen;
  return <Icon className={className} aria-hidden="true" />;
};
