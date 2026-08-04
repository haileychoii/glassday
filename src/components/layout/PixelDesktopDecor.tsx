/**
 * ============================================================
 * [Figma Mapping] Pixel Desk / Decorative Desktop Icons
 * ============================================================
 *
 * 화면 역할: Pixel Desk theme의 desktop 배경 위에 non-interactive icon을 배치한다.
 * Parent: src/components/layout/AppShell.tsx
 * Style/Theme: src/styles/themes/pixel.css
 *
 * Figma 구조: Absolute-positioned Decoration Layer / Icon Component instances
 * aria-hidden이므로 navigation이나 Widget 기능과 연결되지 않는다.
 * ============================================================
 */
import { FileText, Folder, HardDrive, Settings, StickyNote, Trash2 } from "lucide-react";

const desktopIcons = [
  {
    label: "Disk",
    icon: HardDrive,
    className: "pixel-icon-disk",
  },
  {
    label: "Project",
    icon: Folder,
    className: "pixel-icon-project",
  },
  {
    label: "Memo",
    icon: StickyNote,
    className: "pixel-icon-memo",
  },
  {
    label: "Settings",
    icon: Settings,
    className: "pixel-icon-settings",
  },
  {
    label: "Oddity.txt",
    icon: FileText,
    className: "pixel-icon-file",
  },
  {
    label: "Junk",
    icon: Trash2,
    className: "pixel-icon-trash",
  },
];

/** Pixel Desk에서만 보이는 presentation-only desktop layer. */
export const PixelDesktopDecor = () => {
  return (
    <div className="pixel-desktop-decor" aria-hidden="true">
      {desktopIcons.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.label} className={`pixel-desktop-icon ${item.className}`}>
            <div className="pixel-desktop-icon-box">
              <Icon className="w-5 h-5" />
            </div>
            <div className="pixel-desktop-icon-label">{item.label}</div>
          </div>
        );
      })}
    </div>
  );
};
