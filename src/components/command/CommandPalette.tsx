/**
 * ============================================================
 * [Overlay] Command Palette
 * ============================================================
 *
 * Role:
 * - Provides keyboard-first access to navigation, themes, settings, edit mode,
 *   Quick Capture, layout mode, and Universal Search results.
 *
 * Connections:
 * - Host: src/App.tsx
 * - Registry: src/constants/widgets.ts, src/constants/themes.ts
 * - Search: src/lib/universalSearch.ts
 * - Navigation: src/constants/widgetNavigation.ts
 * - Style: src/styles/command.css
 *
 * Extension:
 * - Add new commands by appending to the local registry in this component.
 * - Korean: 기능이 늘어나도 단축키 UI는 이 command registry에만 얇게 추가합니다.
 * ============================================================
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  LayoutGrid,
  Monitor,
  Moon,
  NotebookPen,
  Palette,
  Search,
  Settings,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react";

import { applyTheme, themeOptions } from "../../constants/themes";
import { openMemoNote, openWidget } from "../../constants/widgetNavigation";
import { allWidgetIds, widgetRegistry } from "../../constants/widgets";
import { useDashboardData } from "../../context/DashboardDataContext";
import { cn } from "../../lib/utils";
import {
  collectUniversalSearchResults,
  type UniversalSearchResult,
  type UniversalSearchTarget,
} from "../../lib/universalSearch";
import type {
  DashboardLayoutMode,
  DashboardTab,
  WidgetId,
} from "../../types/workspace";

type CommandPaletteProps = {
  open: boolean;
  editMode: boolean;
  layoutMode: DashboardLayoutMode;
  tabs: DashboardTab[];
  activeTabId: string;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenQuickCapture: () => void;
  onToggleEditMode: () => void;
  onSelectTab: (tabId: string) => void;
  onChangeLayoutMode: (mode: DashboardLayoutMode) => void;
};

type PaletteItem = {
  id: string;
  title: string;
  subtitle: string;
  section: string;
  keywords: string[];
  icon: ReactNode;
  run: () => void;
};

const preferredTabsByWidget: Partial<Record<WidgetId, string>> = {
  today: "home",
  alerts: "home",
  calendar: "home",
  career: "career",
  study: "study",
  timer: "study",
  memo: "memo",
  journal: "life",
  health: "life",
  money: "life",
  mood: "life",
};

const themeIcon = (themeId: string): LucideIcon => {
  if (themeId.includes("dark") || themeId === "aurora") return Moon;
  if (themeId.includes("light") || themeId === "pastel") return Sun;
  return Palette;
};

const runSearchTarget = (
  target: UniversalSearchTarget,
  openCareerDetail?: (careerId: string) => void
) => {
  if (target.type === "memo") {
    openWidget({ widgetId: "memo", preferredTabId: "memo" });
    openMemoNote({ noteId: target.noteId });
    return;
  }

  if (target.type === "career") {
    openWidget({ widgetId: "career", preferredTabId: "career" });
    openCareerDetail?.(target.careerId);
    return;
  }

  if (target.type === "widget") {
    openWidget({
      widgetId: target.widgetId,
      preferredTabId: target.preferredTabId,
    });
  }
};

export const CommandPalette = ({
  open,
  editMode,
  layoutMode,
  tabs,
  activeTabId,
  onClose,
  onOpenSettings,
  onOpenQuickCapture,
  onToggleEditMode,
  onSelectTab,
  onChangeLayoutMode,
}: CommandPaletteProps) => {
  const { openCareerDetail } = useDashboardData();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      setQuery("");
      setSelectedIndex(0);
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open]);

  const registryItems = useMemo<PaletteItem[]>(() => {
    const baseItems: PaletteItem[] = [
      {
        id: "quick-capture",
        title: "Quick Capture",
        subtitle: "Capture memo, task, URL, idea, expense, or inbox note",
        section: "Action",
        keywords: ["capture", "quick", "inbox", "memo", "task", "idea"],
        icon: <Zap className="w-4 h-4" />,
        run: onOpenQuickCapture,
      },
      {
        id: "settings",
        title: "Open Settings",
        subtitle: "Theme, sync, backup, reset, and desktop options",
        section: "Action",
        keywords: ["settings", "preferences", "sync", "backup"],
        icon: <Settings className="w-4 h-4" />,
        run: onOpenSettings,
      },
      {
        id: "edit-dashboard",
        title: editMode ? "Finish Editing Dashboard" : "Edit Dashboard",
        subtitle: "Move, resize, add, or remove widgets",
        section: "Dashboard",
        keywords: ["edit", "dashboard", "layout", "widgets"],
        icon: <LayoutGrid className="w-4 h-4" />,
        run: onToggleEditMode,
      },
      {
        id: "layout-wide",
        title: "Use Wide Layout",
        subtitle:
          layoutMode === "wide"
            ? "Current web dashboard layout"
            : "Switch the web dashboard to the wide layout",
        section: "Dashboard",
        keywords: ["layout", "wide", "dashboard"],
        icon: <Monitor className="w-4 h-4" />,
        run: () => onChangeLayoutMode("wide"),
      },
      {
        id: "layout-laptop",
        title: "Use Laptop Layout",
        subtitle:
          layoutMode === "laptop"
            ? "Current dashboard layout"
            : "Switch the web dashboard to the compact laptop layout",
        section: "Dashboard",
        keywords: ["layout", "laptop", "tauri", "desktop"],
        icon: <LayoutGrid className="w-4 h-4" />,
        run: () => onChangeLayoutMode("laptop"),
      },
    ];

    const tabItems = tabs.map<PaletteItem>((tab) => ({
      id: `tab:${tab.id}`,
      title: `Go to ${tab.label}`,
      subtitle: tab.id === activeTabId ? "Current workspace" : "Switch workspace",
      section: "Workspace",
      keywords: ["tab", "workspace", tab.label, tab.id],
      icon: <NotebookPen className="w-4 h-4" />,
      run: () => onSelectTab(tab.id),
    }));

    const widgetItems = allWidgetIds.map<PaletteItem>((widgetId) => {
      const widget = widgetRegistry[widgetId];
      return {
        id: `widget:${widgetId}`,
        title: `Open ${widget.label}`,
        subtitle: widget.description ?? "Open widget",
        section: "Widget",
        keywords: [widgetId, widget.label, widget.description ?? ""],
        icon: <ClipboardList className="w-4 h-4" />,
        run: () =>
          openWidget({
            widgetId,
            preferredTabId: preferredTabsByWidget[widgetId],
          }),
      };
    });

    const themeItems = themeOptions.map<PaletteItem>((theme) => {
      const Icon = themeIcon(theme.id);
      return {
        id: `theme:${theme.id}`,
        title: `Theme: ${theme.label}`,
        subtitle: theme.description,
        section: "Theme",
        keywords: ["theme", theme.id, theme.label, theme.description],
        icon: <Icon className="w-4 h-4" />,
        run: () => applyTheme(theme.id),
      };
    });

    return [...baseItems, ...tabItems, ...widgetItems, ...themeItems];
  }, [
    activeTabId,
    editMode,
    layoutMode,
    onChangeLayoutMode,
    onOpenQuickCapture,
    onOpenSettings,
    onSelectTab,
    onToggleEditMode,
    tabs,
  ]);

  const searchItems = useMemo<PaletteItem[]>(() => {
    return collectUniversalSearchResults(query).map((result: UniversalSearchResult) => ({
      id: `search:${result.id}`,
      title: result.title,
      subtitle: `${result.kind} - ${result.excerpt || "Open related widget"}`,
      section: "Search",
      keywords: [result.kind, result.title, result.excerpt],
      icon: <Search className="w-4 h-4" />,
      run: () => runSearchTarget(result.target, openCareerDetail),
    }));
  }, [openCareerDetail, query]);

  const items = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const commandItems =
      normalizedQuery.length === 0
        ? registryItems
        : registryItems.filter((item) =>
            [item.title, item.subtitle, ...item.keywords]
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery)
          );

    return [...searchItems, ...commandItems].slice(0, 12);
  }, [query, registryItems, searchItems]);

  if (!open) return null;

  const runItem = (item: PaletteItem | undefined) => {
    if (!item) return;

    item.run();
    onClose();
  };

  return (
    <div className="command-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="command-search-row">
          <Search className="w-4 h-4" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onClose();
              }

              if (event.key === "ArrowDown") {
                event.preventDefault();
                setSelectedIndex((index) => Math.min(index + 1, items.length - 1));
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                setSelectedIndex((index) => Math.max(index - 1, 0));
              }

              if (event.key === "Enter") {
                event.preventDefault();
                runItem(items[selectedIndex]);
              }
            }}
            placeholder="Search or run a command..."
            aria-label="Search commands"
          />
          <span className="command-shortcut">Esc</span>
        </header>

        <div className="command-list" role="listbox" aria-label="Commands">
          {items.length > 0 ? (
            items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={cn("command-item", index === selectedIndex && "is-selected")}
                onClick={() => runItem(item)}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <span className="command-item-icon">{item.icon}</span>
                <span className="command-item-copy">
                  <strong>{item.title}</strong>
                  <small>{item.subtitle}</small>
                </span>
                <span className="command-item-section">{item.section}</span>
              </button>
            ))
          ) : (
            <div className="command-empty">
              <Sparkles className="w-4 h-4" />
              <span>No command or dashboard result found.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
