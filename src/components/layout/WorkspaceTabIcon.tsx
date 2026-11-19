
/**
 * ============================================================
 * GLASSDAY — SHARED WORKSPACE ICON
 * 파일: src/components/layout/WorkspaceTabIcon.tsx
 * ============================================================
 *
 * [연결 컴포넌트]
 * - WorkspaceTabsNav.tsx
 * - MobileNavigation.tsx
 *
 * [테마별 아이콘]
 * - Mac Core: Emoji
 * - Pink Diary: 개별 PNG / Memo는 Lucide
 * - Pixel Desk: Windows 95 PNG
 * - 나머지 테마: Lucide
 *
 * 아이콘 표시만 담당하며 Workspace 데이터는 변경하지 않는다.
 * ============================================================
 */

import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  FolderOpen,
  HeartPulse,
  House,
  NotebookPen,
} from "lucide-react";

import type { ThemeId } from "../../constants/themes";

type WorkspaceTabIconProps = {
  tabId: string;
  tabLabel?: string;
  theme: ThemeId;
};


/* 01. 기본 Lucide 아이콘 */

const lucideIcons: Record<string, typeof House> = {
  home: House,
  career: BriefcaseBusiness,
  study: BookOpen,
  memo: NotebookPen,
  diary: NotebookPen,
  life: HeartPulse,
  calendar: CalendarDays,
};


/* 02. Mac Core */

const macEmoji: Record<string, string> = {
  home: "🏠",
  career: "💼",
  study: "📚",
  memo: "📄",
  diary: "📔",
  life: "🌿",
  calendar: "📅",
};


/* 03. Pink Diary

   public/pink-icons/isolated/ 아래의 개별 PNG 사용
*/

const pinkDiaryIcons: Record<string, string> = {
  home: "/pink-icons/isolated/home.png",
  career: "/pink-icons/isolated/career.png",
  study: "/pink-icons/isolated/study.png",
  diary: "/pink-icons/isolated/diary.png",
  life: "/pink-icons/isolated/life.png",
  calendar: "/pink-icons/isolated/calendar.png",
};


/* 04. Pixel Desk */

const pixelIcons: Record<string, string> = {
  home: "home",
  career: "career",
  study: "study",
  memo: "alerts",
  diary: "diary",
  life: "life",
};


/* 05. 아이콘 렌더링 */

export const WorkspaceTabIcon = ({
  tabId,
  tabLabel,
  theme,
}: WorkspaceTabIconProps) => {

  // 사용자가 추가한 Diary 탭도 같은 아이콘을 사용한다.
  const iconId =
    tabLabel?.trim().toLowerCase() === "diary"
      ? "diary"
      : tabId;

  const className =
    `workspace-theme-icon workspace-theme-icon-${theme}`;


  // MAC CORE

  if (theme === "mac-core") {
    return (
      <span className={className} aria-hidden="true">
        {macEmoji[iconId] ?? "✨"}
      </span>
    );
  }


  // PINK DIARY
  // 기존 Memo의 NotebookPen 아이콘을 유지한다.

  if (theme === "retro") {
    if (iconId === "memo") {
      return (
        <NotebookPen
          className={className}
          aria-hidden="true"
        />
      );
    }

    return (
      <img
        src={
          pinkDiaryIcons[iconId] ??
          pinkDiaryIcons.study
        }
        className={
          `${className} pink-diary-tab-icon pink-diary-tab-icon-${tabId}`
        }
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    );
  }


  // PIXEL DESK
  // 지정되지 않은 사용자 Workspace는 기본 폴더 아이콘 사용

  if (theme === "pixel-desk" && pixelIcons[iconId]) {
    return (
      <img
        src={`/pixel-icons/${pixelIcons[iconId]}.png`}
        className={`${className} pixel-tab-icon`}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    );
  }


  // DEFAULT THEME

  const Icon = lucideIcons[iconId] ?? FolderOpen;

  return (
    <Icon
      className={className}
      aria-hidden="true"
    />
  );
};
