import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  Bold,
  Check,
  Download,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Lock,
  Maximize2,
  Minus,
  Palette,
  PanelLeft,
  Pencil,
  Pin,
  Plus,
  Rows2,
  Send,
  StretchHorizontal,
  StickyNote,
  Table2,
  Trash2,
  Underline,
  UploadCloud,
  X,
} from "lucide-react";

import { GlassCard } from "../glass/GlassCard";
import {
  DEFAULT_MEMO_FONT,
  FONT_CHANGE_EVENT,
  getMemoFontGroups,
  getSavedDefaultMemoFont,
  type FontGroup as MemoFontGroup,
} from "../../constants/fonts";
import {
  getCurrentTheme,
  type ThemeId,
} from "../../constants/themes";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";
import { FloatingWindow } from "../common/FloatingWindow";

type MemoNote = {
  id: string;
  title: string;
  html: string;
  fontFamily: string;
  fontSize: string;
  color: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
};

type EditorMode = "widget" | "window";

type TableContextMenuState = {
  x: number;
  y: number;
  editor: EditorMode;
};

type SavedSelection = {
  range: Range;
  editor: EditorMode;
};

const HIGHLIGHT_COLOR = "#fff1a8";

const LEGACY_DEFAULT_TITLE = "Portfolio Memo";

const LEGACY_DEFAULT_HTML =
  "Portfolio: Add LCF and ER Grouping project details.";

const getDefaultMemoFont = () =>
  getSavedDefaultMemoFont() || DEFAULT_MEMO_FONT;

const defaultMemoColor = "plum-night";

const memoPalettes = [
  {
    id: "plum-night",
    lightSurface:
      "linear-gradient(180deg, rgba(246, 238, 247, 0.96), rgba(234, 224, 239, 0.88))",
    lightBorder: "rgba(212, 190, 222, 0.62)",
    lightText: "rgba(61, 45, 74, 0.92)",
    darkSurface:
      "linear-gradient(180deg, rgba(88, 72, 109, 0.9), rgba(67, 55, 90, 0.84))",
    darkBorder: "rgba(226, 213, 246, 0.28)",
    darkText: "rgba(248, 245, 255, 0.94)",
    tableInk: "rgba(244, 239, 255, 0.88)",
    swatch: "linear-gradient(135deg, #8f78ae, #5f4d7d)",
    legacy: ["#FFF7CF"],
  },
  {
    id: "rose-dusk",
    lightSurface:
      "linear-gradient(180deg, rgba(248, 236, 240, 0.96), rgba(238, 221, 228, 0.88))",
    lightBorder: "rgba(225, 190, 204, 0.62)",
    lightText: "rgba(76, 44, 57, 0.92)",
    darkSurface:
      "linear-gradient(180deg, rgba(103, 70, 86, 0.9), rgba(77, 53, 68, 0.84))",
    darkBorder: "rgba(244, 214, 225, 0.26)",
    darkText: "rgba(255, 244, 248, 0.94)",
    tableInk: "rgba(255, 239, 245, 0.88)",
    swatch: "linear-gradient(135deg, #b58ca0, #7a596a)",
    legacy: ["#FFE1E1"],
  },
  {
    id: "mauve-cloud",
    lightSurface:
      "linear-gradient(180deg, rgba(246, 235, 244, 0.96), rgba(233, 220, 234, 0.88))",
    lightBorder: "rgba(216, 190, 220, 0.62)",
    lightText: "rgba(70, 46, 76, 0.92)",
    darkSurface:
      "linear-gradient(180deg, rgba(93, 71, 103, 0.9), rgba(69, 54, 80, 0.84))",
    darkBorder: "rgba(231, 214, 240, 0.26)",
    darkText: "rgba(251, 244, 255, 0.94)",
    tableInk: "rgba(245, 236, 252, 0.88)",
    swatch: "linear-gradient(135deg, #b58bb5, #6d587b)",
    legacy: ["#FFE6F2"],
  },
  {
    id: "violet-mist",
    lightSurface:
      "linear-gradient(180deg, rgba(239, 235, 248, 0.96), rgba(226, 219, 241, 0.88))",
    lightBorder: "rgba(197, 189, 228, 0.62)",
    lightText: "rgba(58, 47, 82, 0.92)",
    darkSurface:
      "linear-gradient(180deg, rgba(79, 71, 112, 0.9), rgba(60, 54, 88, 0.84))",
    darkBorder: "rgba(219, 215, 247, 0.26)",
    darkText: "rgba(245, 245, 255, 0.94)",
    tableInk: "rgba(236, 239, 255, 0.88)",
    swatch: "linear-gradient(135deg, #9a91c8, #595684)",
    legacy: ["#E9D8FF"],
  },
  {
    id: "indigo-fog",
    lightSurface:
      "linear-gradient(180deg, rgba(235, 239, 250, 0.96), rgba(220, 228, 244, 0.88))",
    lightBorder: "rgba(188, 197, 229, 0.62)",
    lightText: "rgba(45, 52, 82, 0.92)",
    darkSurface:
      "linear-gradient(180deg, rgba(67, 76, 112, 0.9), rgba(52, 60, 86, 0.84))",
    darkBorder: "rgba(212, 222, 248, 0.26)",
    darkText: "rgba(244, 248, 255, 0.94)",
    tableInk: "rgba(234, 243, 255, 0.88)",
    swatch: "linear-gradient(135deg, #86a0d1, #536180)",
    legacy: ["#DDE7FF"],
  },
  {
    id: "storm-blue",
    lightSurface:
      "linear-gradient(180deg, rgba(233, 241, 248, 0.96), rgba(219, 231, 240, 0.88))",
    lightBorder: "rgba(186, 203, 219, 0.62)",
    lightText: "rgba(41, 58, 70, 0.92)",
    darkSurface:
      "linear-gradient(180deg, rgba(59, 81, 97, 0.9), rgba(47, 64, 78, 0.84))",
    darkBorder: "rgba(210, 229, 239, 0.24)",
    darkText: "rgba(242, 250, 255, 0.94)",
    tableInk: "rgba(232, 244, 250, 0.88)",
    swatch: "linear-gradient(135deg, #89b1c2, #486373)",
    legacy: ["#DDF4FF"],
  },
  {
    id: "sage-night",
    lightSurface:
      "linear-gradient(180deg, rgba(236, 246, 241, 0.96), rgba(221, 236, 229, 0.88))",
    lightBorder: "rgba(190, 216, 204, 0.62)",
    lightText: "rgba(42, 66, 55, 0.92)",
    darkSurface:
      "linear-gradient(180deg, rgba(63, 91, 82, 0.9), rgba(49, 71, 64, 0.84))",
    darkBorder: "rgba(210, 233, 223, 0.24)",
    darkText: "rgba(242, 252, 247, 0.94)",
    tableInk: "rgba(232, 246, 239, 0.88)",
    swatch: "linear-gradient(135deg, #8eb9a8, #4f6d62)",
    legacy: ["#DDF8EA"],
  },
  {
    id: "olive-haze",
    lightSurface:
      "linear-gradient(180deg, rgba(243, 246, 235, 0.96), rgba(230, 236, 219, 0.88))",
    lightBorder: "rgba(209, 217, 186, 0.62)",
    lightText: "rgba(68, 74, 42, 0.92)",
    darkSurface:
      "linear-gradient(180deg, rgba(88, 93, 60, 0.9), rgba(67, 70, 48, 0.84))",
    darkBorder: "rgba(230, 234, 205, 0.24)",
    darkText: "rgba(251, 252, 242, 0.94)",
    tableInk: "rgba(243, 245, 228, 0.88)",
    swatch: "linear-gradient(135deg, #b1bc83, #676d46)",
    legacy: ["#EAF7D8"],
  },
  {
    id: "cocoa-dust",
    lightSurface:
      "linear-gradient(180deg, rgba(247, 239, 231, 0.96), rgba(237, 226, 214, 0.88))",
    lightBorder: "rgba(225, 202, 181, 0.62)",
    lightText: "rgba(78, 56, 42, 0.92)",
    darkSurface:
      "linear-gradient(180deg, rgba(102, 78, 64, 0.9), rgba(78, 60, 49, 0.84))",
    darkBorder: "rgba(240, 220, 205, 0.24)",
    darkText: "rgba(255, 248, 244, 0.94)",
    tableInk: "rgba(248, 237, 229, 0.88)",
    swatch: "linear-gradient(135deg, #c7a58f, #7a5d4d)",
    legacy: ["#F4E7D3"],
  },
  {
    id: "graphite-lilac",
    lightSurface:
      "linear-gradient(180deg, rgba(241, 241, 245, 0.96), rgba(228, 229, 236, 0.88))",
    lightBorder: "rgba(202, 204, 220, 0.62)",
    lightText: "rgba(59, 60, 74, 0.92)",
    darkSurface:
      "linear-gradient(180deg, rgba(78, 80, 100, 0.9), rgba(61, 63, 80, 0.84))",
    darkBorder: "rgba(223, 226, 243, 0.24)",
    darkText: "rgba(244, 246, 255, 0.94)",
    tableInk: "rgba(235, 239, 248, 0.88)",
    swatch: "linear-gradient(135deg, #9fa3ba, #5f6378)",
    legacy: ["#F2F2F2"],
  },
  {
    id: "moon-ivory",
    lightSurface:
      "linear-gradient(180deg, rgba(252, 252, 251, 0.96), rgba(243, 243, 240, 0.88))",
    lightBorder: "rgba(223, 223, 216, 0.62)",
    lightText: "rgba(72, 72, 67, 0.92)",
    darkSurface:
      "linear-gradient(180deg, rgba(96, 94, 86, 0.9), rgba(72, 70, 64, 0.84))",
    darkBorder: "rgba(239, 238, 228, 0.22)",
    darkText: "rgba(255, 255, 248, 0.94)",
    tableInk: "rgba(248, 248, 238, 0.88)",
    swatch: "linear-gradient(135deg, #d8d0bc, #767061)",
    legacy: ["#FFFFFF"],
  },
  {
    id: "mist-sky",
    lightSurface:
      "linear-gradient(180deg, rgba(238, 242, 250, 0.96), rgba(225, 231, 244, 0.88))",
    lightBorder: "rgba(191, 202, 227, 0.62)",
    lightText: "rgba(50, 58, 82, 0.92)",
    darkSurface:
      "linear-gradient(180deg, rgba(74, 87, 109, 0.9), rgba(57, 68, 84, 0.84))",
    darkBorder: "rgba(217, 227, 247, 0.24)",
    darkText: "rgba(244, 248, 255, 0.94)",
    tableInk: "rgba(236, 242, 252, 0.88)",
    swatch: "linear-gradient(135deg, #9caeca, #59687d)",
    legacy: ["#EEF2FF"],
  },
] as const;

const resolveMemoPalette = (
  color?: string | null
) =>
  memoPalettes.find(
    (palette) =>
      palette.id === color ||
      palette.legacy.includes(color as never)
  ) ?? memoPalettes[0];

const isDarkMemoTheme = (
  theme: ThemeId
) => theme === "glass-dark";

const getMemoPaletteDotStyle = (
  color: string | null | undefined,
  theme: ThemeId
) => {
  const palette = resolveMemoPalette(color);
  const darkTheme = isDarkMemoTheme(theme);

  return {
    background: darkTheme
      ? palette.darkSurface
      : palette.lightSurface,

    border: darkTheme
      ? `1px solid ${palette.darkBorder}`
      : `1px solid ${palette.lightBorder}`,

    boxShadow: darkTheme
      ? "inset 0 1px 0 rgba(255, 255, 255, 0.08)"
      : "inset 0 1px 0 rgba(255, 255, 255, 0.72)",
  };
};

const fontGroups = getMemoFontGroups();

const fontSizeOptions = Array.from(
  { length: 25 },
  (_, index) => `${index + 8}px`
);

const createId = () => {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return `memo-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
};

const createMemoNote = (
  id?: string
): MemoNote => {
  const now = Date.now();

  return {
    id: id ?? createId(),
    title: "새 메모",
    html: "",
    fontFamily: getDefaultMemoFont(),
    fontSize: "14px",
    color: defaultMemoColor,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
};

const defaultNotes: MemoNote[] = [
  createMemoNote("default-memo"),
];

const htmlToPlainText = (html: string) => {
  const temp = document.createElement("div");
  temp.innerHTML = html;

  return temp.innerText;
};

const stripHtml = (html: string) =>
  htmlToPlainText(html)
    .replace(/\s+/g, " ")
    .trim();

const getFirstLineTitle = (
  html: string
) => {
  const plainText = htmlToPlainText(html);

  const firstLine = plainText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine || "";
};

const sanitizeFileName = (
  name: string
) =>
  name
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

const normalizeTxtFileName = (
  name: string
) => {
  const withoutExtension =
    name.replace(/\.txt$/i, "");

  const cleaned =
    sanitizeFileName(withoutExtension) ||
    "새 메모";

  return `${cleaned}.txt`;
};

const getSuggestedFileName = (
  note: MemoNote
) => {
  const firstLine =
    getFirstLineTitle(note.html);

  const baseName =
    firstLine ||
    note.title ||
    "새 메모";

  return normalizeTxtFileName(baseName);
};

const getDisplayTitle = (
  note: MemoNote
) =>
  note.title ||
  getFirstLineTitle(note.html) ||
  "새 메모";

const normalizeNote = (
  note: Partial<MemoNote>
): MemoNote => {
  const now = Date.now();

  return {
    id: note.id || createId(),
    title: note.title ?? "새 메모",
    html: note.html ?? "",
    fontFamily:
      note.fontFamily ||
      getDefaultMemoFont(),
    fontSize: note.fontSize || "14px",
    color:
      note.color || defaultMemoColor,
    pinned: note.pinned ?? false,
    createdAt:
      note.createdAt ?? now,
    updatedAt:
      note.updatedAt ?? now,
  };
};

const sortMemos = (
  notes: MemoNote[]
) =>
  [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    return b.updatedAt - a.updatedAt;
  });

const compactColor = (
  value: string
) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "");

export const MemoWidget = () => {
  const [theme, setTheme] =
    useState<ThemeId>(
      () => getCurrentTheme()
    );

  const [
    availableFontGroups,
    setAvailableFontGroups,
  ] = useState<MemoFontGroup[]>(
    fontGroups
  );

  const [editing, setEditing] =
    useState(false);

  const [
    memoWindowOpen,
    setMemoWindowOpen,
  ] = useState(false);

  const [
    isCompactWidget,
    setIsCompactWidget,
  ] = useState(false);

  const [
    isCompactWindow,
    setIsCompactWindow,
  ] = useState(false);

  const [
    isCompactListOpen,
    setIsCompactListOpen,
  ] = useState(false);

  const [
    isWindowCompactListOpen,
    setIsWindowCompactListOpen,
  ] = useState(false);

  const {
    value: isListHidden,
    setValue: setIsListHidden,
  } = useLocalStorage(
    "glassday.memo.listHidden.v1",
    false
  );

  const {
    value: isWindowListHidden,
    setValue: setIsWindowListHidden,
  } = useLocalStorage(
    "glassday.memo.windowListHidden.v1",
    false
  );

  const {
    value: windowSidebarWidth,
    setValue: setWindowSidebarWidth,
  } = useLocalStorage(
    "glassday.memo.windowSidebarWidth.v1",
    280
  );

  const [
    saveDialogOpen,
    setSaveDialogOpen,
  ] = useState(false);

  const [
    saveFileName,
    setSaveFileName,
  ] = useState("");

  const [
    isDraggingWindowSidebar,
    setIsDraggingWindowSidebar,
  ] = useState(false);

  const [
    tableContextMenu,
    setTableContextMenu,
  ] =
    useState<TableContextMenuState | null>(
      null
    );

  const editorRef =
    useRef<HTMLDivElement | null>(null);

  const windowEditorRef =
    useRef<HTMLDivElement | null>(null);

  const saveInputRef =
    useRef<HTMLInputElement | null>(null);

  const floatingBodyRef =
    useRef<HTMLDivElement | null>(null);

  const memoAppRef =
    useRef<HTMLDivElement | null>(null);

  const savedSelectionRef =
    useRef<SavedSelection | null>(null);

  const migratedLegacyDefaultRef =
    useRef(false);

  const {
    value: notes,
    setValue: setNotes,
  } = useLocalStorage<MemoNote[]>(
    "glassday.memo.notes.v2",
    defaultNotes
  );

  const {
    value: selectedNoteId,
    setValue: setSelectedNoteId,
  } = useLocalStorage<string>(
    "glassday.memo.selected.v2",
    "default-memo"
  );

  const normalizedNotes = useMemo(
    () =>
      notes.map((note) =>
        normalizeNote(note)
      ),
    [notes]
  );

  const sortedNotes = useMemo(
    () => sortMemos(normalizedNotes),
    [normalizedNotes]
  );

  const activeNote =
    normalizedNotes.find(
      (note) =>
        note.id === selectedNoteId
    ) ??
    normalizedNotes[0] ??
    null;

  const getEditorElement = (
    editor: EditorMode
  ) =>
    editor === "window"
      ? windowEditorRef.current
      : editorRef.current;

  const getActiveEditorMode =
    (): EditorMode =>
      memoWindowOpen
        ? "window"
        : "widget";

  const getActiveEditorElement = () =>
    getEditorElement(
      getActiveEditorMode()
    );

  const saveSelection = (
    editorMode: EditorMode
  ) => {
    const editor =
      getEditorElement(editorMode);

    const selection =
      window.getSelection();

    if (
      !editor ||
      !selection ||
      selection.rangeCount === 0
    ) {
      return false;
    }

    const range =
      selection.getRangeAt(0);

    if (
      !editor.contains(
        range.commonAncestorContainer
      )
    ) {
      return false;
    }

    savedSelectionRef.current = {
      range: range.cloneRange(),
      editor: editorMode,
    };

    return true;
  };

  const restoreSelection = (
    editorMode: EditorMode
  ) => {
    const editor =
      getEditorElement(editorMode);

    const saved =
      savedSelectionRef.current;

    if (
      !editor ||
      !saved ||
      saved.editor !== editorMode
    ) {
      return false;
    }

    try {
      if (
        !editor.contains(
          saved.range
            .commonAncestorContainer
        )
      ) {
        return false;
      }

      const selection =
        window.getSelection();

      if (!selection) {
        return false;
      }

      selection.removeAllRanges();
      selection.addRange(saved.range);

      return true;
    } catch {
      return false;
    }
  };

  const hasTextSelection = (
    editorMode: EditorMode
  ) => {
    const editor =
      getEditorElement(editorMode);

    const selection =
      window.getSelection();

    if (
      !editor ||
      !selection ||
      selection.rangeCount === 0 ||
      selection.isCollapsed
    ) {
      return false;
    }

    const range =
      selection.getRangeAt(0);

    return editor.contains(
      range.commonAncestorContainer
    );
  };

  useEffect(() => {
    const syncFonts = () => {
      setAvailableFontGroups(
        getMemoFontGroups()
      );
    };

    window.addEventListener(
      FONT_CHANGE_EVENT,
      syncFonts
    );

    return () => {
      window.removeEventListener(
        FONT_CHANGE_EVENT,
        syncFonts
      );
    };
  }, []);

  useEffect(() => {
    const handleThemeChange = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<ThemeId>;

      setTheme(
        customEvent.detail ??
          getCurrentTheme()
      );
    };

    window.addEventListener(
      "glassday-theme-change",
      handleThemeChange
    );

    return () => {
      window.removeEventListener(
        "glassday-theme-change",
        handleThemeChange
      );
    };
  }, []);

  useEffect(() => {
    if (
      migratedLegacyDefaultRef.current
    ) {
      return;
    }

    migratedLegacyDefaultRef.current =
      true;

    const shouldReplaceLegacyDefault =
      notes.length === 1 &&
      notes[0]?.id === "default-memo" &&
      notes[0]?.title ===
        LEGACY_DEFAULT_TITLE &&
      notes[0]?.html ===
        LEGACY_DEFAULT_HTML;

    if (!shouldReplaceLegacyDefault) {
      return;
    }

    const replacement =
      createMemoNote("default-memo");

    setNotes([replacement]);

    setSelectedNoteId(
      replacement.id
    );
  }, [
    notes,
    setNotes,
    setSelectedNoteId,
  ]);

  useEffect(() => {
    const target = memoAppRef.current;

    if (
      !target ||
      typeof ResizeObserver ===
        "undefined"
    ) {
      return;
    }

    const updateSize = () => {
      const compact =
        target.getBoundingClientRect()
          .width <= 560;

      setIsCompactWidget(compact);

      if (!compact) {
        setIsCompactListOpen(false);
      }
    };

    updateSize();

    const observer =
      new ResizeObserver(updateSize);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!memoWindowOpen) {
      setIsWindowCompactListOpen(false);
      return;
    }

    const target =
      floatingBodyRef.current;

    if (
      !target ||
      typeof ResizeObserver ===
        "undefined"
    ) {
      return;
    }

    const updateSize = () => {
      const compact =
        target.getBoundingClientRect()
          .width <= 760;

      setIsCompactWindow(compact);

      if (!compact) {
        setIsWindowCompactListOpen(
          false
        );
      }
    };

    updateSize();

    const observer =
      new ResizeObserver(updateSize);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [memoWindowOpen]);

  useEffect(() => {
    if (!isDraggingWindowSidebar) {
      return;
    }

    const handleMove = (
      event: MouseEvent
    ) => {
      const container =
        floatingBodyRef.current;

      if (!container) {
        return;
      }

      const bounds =
        container.getBoundingClientRect();

      const nextWidth = Math.min(
        420,
        Math.max(
          180,
          event.clientX -
            bounds.left -
            18
        )
      );

      setWindowSidebarWidth(nextWidth);
    };

    const handleUp = () => {
      setIsDraggingWindowSidebar(false);
    };

    window.addEventListener(
      "mousemove",
      handleMove
    );

    window.addEventListener(
      "mouseup",
      handleUp
    );

    return () => {
      window.removeEventListener(
        "mousemove",
        handleMove
      );

      window.removeEventListener(
        "mouseup",
        handleUp
      );
    };
  }, [
    isDraggingWindowSidebar,
    setWindowSidebarWidth,
  ]);

  useEffect(() => {
    const shouldNormalize =
      notes.some((note) => {
        const normalized =
          normalizeNote(note);

        return (
          note.fontFamily !==
            normalized.fontFamily ||
          note.fontSize !==
            normalized.fontSize ||
          note.color !==
            normalized.color ||
          note.pinned !==
            normalized.pinned ||
          note.createdAt !==
            normalized.createdAt ||
          note.updatedAt !==
            normalized.updatedAt
        );
      });

    if (shouldNormalize) {
      setNotes(
        notes.map((note) =>
          normalizeNote(note)
        )
      );
    }
  }, [notes, setNotes]);

  useEffect(() => {
    if (
      !activeNote &&
      normalizedNotes.length > 0
    ) {
      setSelectedNoteId(
       ) };
