import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import type { CSSProperties } from "react";
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
import { getCurrentTheme, type ThemeId } from "../../constants/themes";
import {
  OPEN_MEMO_EVENT,
  type OpenMemoEventDetail,
} from "../../constants/widgetNavigation";
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

type TableContextMenuState = {
  x: number;
  y: number;
  editor: "widget" | "window";
};

const getDefaultMemoFont = () => getSavedDefaultMemoFont() || DEFAULT_MEMO_FONT;

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

const resolveMemoPalette = (color?: string | null) =>
  memoPalettes.find(
    (palette) => palette.id === color || palette.legacy.includes(color as never)
  ) ?? memoPalettes[0];

const isDarkMemoTheme = (theme: ThemeId) => {
  return theme === "glass-dark" || theme === "aurora";
};

const getMemoPaletteDotStyle = (color: string | null | undefined, theme: ThemeId) => {
  const palette = resolveMemoPalette(color);
  const darkTheme = isDarkMemoTheme(theme);

  return {
    background: darkTheme ? palette.darkSurface : palette.lightSurface,
    border: darkTheme
      ? `1px solid ${palette.darkBorder}`
      : `1px solid ${palette.lightBorder}`,
    boxShadow: darkTheme
      ? "inset 0 1px 0 rgba(255, 255, 255, 0.08)"
      : "inset 0 1px 0 rgba(255, 255, 255, 0.72)",
  };
};

const fontGroups = getMemoFontGroups();

const fontSizeOptions = Array.from({ length: 25 }, (_, index) => {
  const size = index + 8;
  return `${size}px`;
});

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `memo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createMemoNote = (): MemoNote => {
  const now = Date.now();

  return {
    id: createId(),
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
  {
    id: "default-memo",
    title: "Portfolio Memo",
    html: "Portfolio: Add LCF and ER Grouping project details.",
    fontFamily: getDefaultMemoFont(),
    fontSize: "14px",
    color: defaultMemoColor,
    pinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const htmlToPlainText = (html: string) => {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.innerText;
};

const stripHtml = (html: string) => {
  return htmlToPlainText(html).replace(/\s+/g, " ").trim();
};

const getFirstLineTitle = (html: string) => {
  const plainText = htmlToPlainText(html);

  const firstLine = plainText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine || "";
};

const sanitizeFileName = (name: string) => {
  return name
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
};

const normalizeTxtFileName = (name: string) => {
  const withoutExtension = name.replace(/\.txt$/i, "");
  const cleaned = sanitizeFileName(withoutExtension) || "새 메모";

  return `${cleaned}.txt`;
};

const getSuggestedFileName = (note: MemoNote) => {
  const firstLine = getFirstLineTitle(note.html);
  const baseName = firstLine || note.title || "새 메모";

  return normalizeTxtFileName(baseName);
};

const getDisplayTitle = (note: MemoNote) => {
  return note.title || getFirstLineTitle(note.html) || "새 메모";
};

const normalizeNote = (note: Partial<MemoNote>): MemoNote => {
  const now = Date.now();

  return {
    id: note.id || createId(),
    title: note.title ?? "새 메모",
    html: note.html ?? "",
    fontFamily: note.fontFamily || getDefaultMemoFont(),
    fontSize: note.fontSize || "14px",
    color: note.color || defaultMemoColor,
    pinned: note.pinned ?? false,
    createdAt: note.createdAt ?? now,
    updatedAt: note.updatedAt ?? now,
  };
};

const sortMemos = (notes: MemoNote[]) => {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    return b.updatedAt - a.updatedAt;
  });
};

export const MemoWidget = () => {
  const [theme, setTheme] = useState<ThemeId>(() => getCurrentTheme());
  const [availableFontGroups, setAvailableFontGroups] =
    useState<MemoFontGroup[]>(fontGroups);
  const [editing, setEditing] = useState(false);
  const [memoWindowOpen, setMemoWindowOpen] = useState(false);
  const [isWidgetListOpen, setIsWidgetListOpen] = useState(false);
  const {
    value: isWindowListHidden,
    setValue: setIsWindowListHidden,
  } = useLocalStorage("glassday.memo.windowListHidden.v1", false);
  const {
    value: windowSidebarWidth,
    setValue: setWindowSidebarWidth,
  } = useLocalStorage("glassday.memo.windowSidebarWidth.v1", 280);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveFileName, setSaveFileName] = useState("");
  const [isDraggingWindowSidebar, setIsDraggingWindowSidebar] = useState(false);
  const [tableContextMenu, setTableContextMenu] =
    useState<TableContextMenuState | null>(null);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const windowEditorRef = useRef<HTMLDivElement | null>(null);
  const saveInputRef = useRef<HTMLInputElement | null>(null);
  const floatingBodyRef = useRef<HTMLDivElement | null>(null);

  const { value: notes, setValue: setNotes } = useLocalStorage<MemoNote[]>(
    "glassday.memo.notes.v2",
    defaultNotes
  );

  const { value: selectedNoteId, setValue: setSelectedNoteId } =
    useLocalStorage<string>("glassday.memo.selected.v2", "default-memo");

  const normalizedNotes = useMemo(
    () => notes.map((note) => normalizeNote(note)),
    [notes]
  );

  const sortedNotes = useMemo(
    () => sortMemos(normalizedNotes),
    [normalizedNotes]
  );

  const activeNote =
    normalizedNotes.find((note) => note.id === selectedNoteId) ??
    normalizedNotes[0] ??
    null;

  const activeEditor = memoWindowOpen
    ? windowEditorRef.current
    : editorRef.current;

  useEffect(() => {
    const syncFonts = () => {
      setAvailableFontGroups(getMemoFontGroups());
    };

    window.addEventListener(FONT_CHANGE_EVENT, syncFonts);

    return () => {
      window.removeEventListener(FONT_CHANGE_EVENT, syncFonts);
    };
  }, []);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<ThemeId>;
      setTheme(customEvent.detail ?? getCurrentTheme());
    };

    window.addEventListener("glassday-theme-change", handleThemeChange);

    return () => {
      window.removeEventListener("glassday-theme-change", handleThemeChange);
    };
  }, []);

  useEffect(() => {
    const handleOpenMemoNote = (event: Event) => {
      const customEvent = event as CustomEvent<OpenMemoEventDetail>;
      const noteId = customEvent.detail?.noteId;

      if (!noteId) return;
      if (!normalizedNotes.some((note) => note.id === noteId)) return;

      setSelectedNoteId(noteId);
      setMemoWindowOpen(true);
    };

    window.addEventListener(OPEN_MEMO_EVENT, handleOpenMemoNote);

    return () => {
      window.removeEventListener(OPEN_MEMO_EVENT, handleOpenMemoNote);
    };
  }, [normalizedNotes, setSelectedNoteId]);

  useEffect(() => {
    if (!isDraggingWindowSidebar) {
      return;
    }

    const handleMove = (event: MouseEvent) => {
      const container = floatingBodyRef.current;
      if (!container) {
        return;
      }

      const bounds = container.getBoundingClientRect();
      const nextWidth = Math.min(
        420,
        Math.max(180, event.clientX - bounds.left - 18)
      );
      setWindowSidebarWidth(nextWidth);
    };

    const handleUp = () => {
      setIsDraggingWindowSidebar(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDraggingWindowSidebar, setWindowSidebarWidth]);

  useEffect(() => {
    const shouldNormalize = notes.some((note) => {
      const normalized = normalizeNote(note);

      return (
        note.fontFamily !== normalized.fontFamily ||
        note.fontSize !== normalized.fontSize ||
        note.color !== normalized.color ||
        note.pinned !== normalized.pinned ||
        note.createdAt !== normalized.createdAt ||
        note.updatedAt !== normalized.updatedAt
      );
    });

    if (shouldNormalize) {
      setNotes(notes.map((note) => normalizeNote(note)));
    }
  }, [notes, setNotes]);

  useEffect(() => {
    if (!activeNote && normalizedNotes.length > 0) {
      setSelectedNoteId(normalizedNotes[0].id);
    }
  }, [activeNote, normalizedNotes, setSelectedNoteId]);

  useEffect(() => {
    if (!activeNote) return;

    if (editorRef.current && editorRef.current.innerHTML !== activeNote.html) {
      editorRef.current.innerHTML = activeNote.html;
    }

    if (
      windowEditorRef.current &&
      windowEditorRef.current.innerHTML !== activeNote.html
    ) {
      windowEditorRef.current.innerHTML = activeNote.html;
    }
  }, [activeNote?.id, activeNote?.html, memoWindowOpen]);

  useEffect(() => {
    if (!saveDialogOpen) return;

    requestAnimationFrame(() => {
      saveInputRef.current?.focus();
      saveInputRef.current?.select();
    });
  }, [saveDialogOpen]);

  useEffect(() => {
    if (!tableContextMenu) {
      return;
    }

    const handlePointerDown = () => {
      setTableContextMenu(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTableContextMenu(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [tableContextMenu]);

  const updateActiveNote = (patch: Partial<MemoNote>) => {
    if (!activeNote) return;

    setNotes((prev) =>
      prev.map((note) =>
        note.id === activeNote.id
          ? {
              ...normalizeNote(note),
              ...patch,
              updatedAt: Date.now(),
            }
          : normalizeNote(note)
      )
    );
  };

  const syncFromEditor = (target: HTMLDivElement | null) => {
    if (!target) return;

    updateActiveNote({
      html: target.innerHTML,
    });
  };

  const runCommand = (command: string, value?: string) => {
    if (!editing) return;

    activeEditor?.focus();
    document.execCommand(command, false, value);

    setTimeout(() => {
      syncFromEditor(activeEditor);
    }, 0);
  };

  const applyHighlight = (color = "#fff1a8") => {
    if (!editing) return;

    activeEditor?.focus();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("hiliteColor", false, color);

    setTimeout(() => {
      syncFromEditor(activeEditor);
    }, 0);
  };

  const addNewMemo = () => {
    const newNote = createMemoNote();

    setNotes((prev) => [newNote, ...prev.map((note) => normalizeNote(note))]);
    setSelectedNoteId(newNote.id);
    setEditing(true);
    setMemoWindowOpen(true);
  };

  const deleteMemo = (id: string) => {
    const nextNotes = normalizedNotes.filter((note) => note.id !== id);

    if (nextNotes.length === 0) {
      const replacement = createMemoNote();

      setNotes([replacement]);
      setSelectedNoteId(replacement.id);
      setEditing(true);

      return;
    }

    setNotes(nextNotes);

    if (selectedNoteId === id) {
      setSelectedNoteId(nextNotes[0].id);
    }
  };

  const togglePinnedNote = () => {
    if (!activeNote) return;

    updateActiveNote({
      pinned: !activeNote.pinned,
    });
  };

  const insertTable = () => {
    const tableHtml = `
      <table style="width: 100%; table-layout: fixed;">
        <tbody>
          <tr>
            <td>항목</td>
            <td>내용</td>
          </tr>
          <tr>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <p><br /></p>
    `;

    runCommand("insertHTML", tableHtml);
  };

  const getEditorElement = (editor: "widget" | "window") =>
    editor === "window" ? windowEditorRef.current : editorRef.current;

  const getTableCellFromNode = (node: EventTarget | Node | null) => {
    const baseNode =
      node instanceof HTMLElement
        ? node
        : node instanceof Node
          ? node.parentElement
          : null;

    return baseNode?.closest("td, th") as HTMLTableCellElement | null;
  };

  const getSelectedTableCell = () => {
    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode;
    const baseNode =
      anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement;

    if (!baseNode || !activeEditor?.contains(baseNode)) {
      return null;
    }

    return baseNode.closest("td, th") as HTMLTableCellElement | null;
  };

  const updateTableFromSelection = (
    action: (
      cell: HTMLTableCellElement,
      row: HTMLTableRowElement,
      table: HTMLTableElement
    ) => void
  ) => {
    if (!editing || !activeEditor) return;

    const cell = getSelectedTableCell();
    const row = cell?.parentElement as HTMLTableRowElement | null;
    const table = row?.closest("table") as HTMLTableElement | null;

    if (!cell || !row || !table) return;

    action(cell, row, table);
    syncFromEditor(activeEditor);
    setTableContextMenu(null);
  };

  const insertTableRow = (after = true) => {
    updateTableFromSelection((_, row) => {
      const nextRow = row.cloneNode(true) as HTMLTableRowElement;
      Array.from(nextRow.cells).forEach((nextCell) => {
        nextCell.innerHTML = "<br />";
      });

      if (after) {
        row.insertAdjacentElement("afterend", nextRow);
      } else {
        row.insertAdjacentElement("beforebegin", nextRow);
      }
    });
  };

  const insertTableColumn = (after = true) => {
    updateTableFromSelection((cell, row, table) => {
      const columnIndex = Array.from(row.cells).indexOf(cell);
      const targetIndex = after ? columnIndex + 1 : columnIndex;

      Array.from(table.rows).forEach((tableRow) => {
        const newCell = document.createElement(tableRow.rowIndex === 0 ? "th" : "td");
        newCell.innerHTML = "<br />";

        if (targetIndex >= tableRow.cells.length) {
          tableRow.appendChild(newCell);
        } else {
          tableRow.insertBefore(newCell, tableRow.cells[targetIndex]);
        }
      });
    });
  };

  const deleteTableRow = () => {
    updateTableFromSelection((_, row, table) => {
      if (table.rows.length <= 1) return;
      row.remove();
    });
  };

  const deleteTableColumn = () => {
    updateTableFromSelection((cell, row, table) => {
      if (row.cells.length <= 1) return;
      const columnIndex = Array.from(row.cells).indexOf(cell);

      Array.from(table.rows).forEach((tableRow) => {
        tableRow.cells[columnIndex]?.remove();
      });
    });
  };

  const mergeSelectedCellWithRight = () => {
    updateTableFromSelection((cell, row) => {
      const cells = Array.from(row.cells);
      const columnIndex = cells.indexOf(cell);
      const nextCell = cells[columnIndex + 1];

      if (!nextCell) {
        return;
      }

      const currentSpan = cell.colSpan || 1;
      const nextSpan = nextCell.colSpan || 1;
      const nextHtml = nextCell.innerHTML.trim();
      const currentHtml = cell.innerHTML.trim();

      cell.colSpan = currentSpan + nextSpan;

      if (nextHtml) {
        cell.innerHTML = currentHtml
          ? `${cell.innerHTML}<br />${nextCell.innerHTML}`
          : nextCell.innerHTML;
      }

      nextCell.remove();
    });
  };

  const splitSelectedCell = () => {
    updateTableFromSelection((cell, row) => {
      const span = cell.colSpan || 1;

      if (span <= 1) {
        return;
      }

      const tagName = cell.tagName.toLowerCase();
      cell.colSpan = 1;

      for (let index = 1; index < span; index += 1) {
        const newCell = document.createElement(tagName);
        newCell.innerHTML = "<br />";
        row.insertBefore(newCell, cell.nextSibling);
      }
    });
  };

  const adjustSelectedColumnWidth = (delta: number) => {
    updateTableFromSelection((cell, row, table) => {
      const columnIndex = Array.from(row.cells).indexOf(cell);
      table.style.width = "100%";
      table.style.tableLayout = "fixed";

      Array.from(table.rows).forEach((tableRow) => {
        const targetCell = tableRow.cells[columnIndex];
        if (!targetCell) return;

        const currentWidth =
          Number.parseFloat(targetCell.style.width) ||
          targetCell.getBoundingClientRect().width;
        const nextWidth = Math.max(72, currentWidth + delta);
        targetCell.style.width = `${nextWidth}px`;
      });
    });
  };

  const openSaveDialog = () => {
    if (!activeNote) return;

    setSaveFileName(getSuggestedFileName(activeNote));
    setSaveDialogOpen(true);
  };

  const saveToLocal = () => {
    if (!activeNote) return;

    const fileName = normalizeTxtFileName(saveFileName);
    const plainText = htmlToPlainText(activeNote.html);

    const blob = new Blob([plainText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = fileName;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
    setSaveDialogOpen(false);
  };

  const sendByEmail = () => {
    if (!activeNote) return;

    const fileName = normalizeTxtFileName(saveFileName);
    const plainText = htmlToPlainText(activeNote.html);

    const subject = encodeURIComponent(fileName);
    const body = encodeURIComponent(`[${fileName}]\n\n${plainText}`);

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setSaveDialogOpen(false);
  };

  const saveToGoogleDrive = () => {
    if (!activeNote) return;

    const fileName = normalizeTxtFileName(saveFileName);
    const plainText = htmlToPlainText(activeNote.html);

    const file = new File([plainText], fileName, {
      type: "text/plain;charset=utf-8",
    });

    console.log("Google Drive upload-ready file:", file);

    alert(
      "Google Drive 저장은 Google OAuth 연결 후 활성화할 수 있어. 지금은 UI와 파일 준비 구조만 만들어둔 상태야."
    );
  };

  const handleToolbarMouseDown = (event: ReactMouseEvent) => {
    event.preventDefault();
  };

  const openTableContextMenu = (
    event: ReactMouseEvent<HTMLDivElement>,
    editor: "widget" | "window"
  ) => {
    if (!editing) {
      return;
    }

    const editorElement = getEditorElement(editor);
    const cell = getTableCellFromNode(event.target);

    if (!editorElement || !cell || !editorElement.contains(cell)) {
      setTableContextMenu(null);
      return;
    }

    event.preventDefault();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(cell);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    if (activeEditor !== editorElement) {
      editorElement.focus();
    }

    setTableContextMenu({
      x: event.clientX,
      y: event.clientY,
      editor,
    });
  };

  const handleTableMenuAction = (action: () => void) => {
    const menuEditor = tableContextMenu?.editor;

    if (!menuEditor) {
      return;
    }

    getEditorElement(menuEditor)?.focus();
    action();
  };

  const renderToolbar = () => (
    <div className="memo-toolbar">
      <select
        value={activeNote?.fontFamily ?? getDefaultMemoFont()}
        onChange={(event) =>
          updateActiveNote({
            fontFamily: event.target.value,
          })
        }
        className="memo-select memo-font-select"
        disabled={!editing}
      >
        {availableFontGroups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.fonts.map((font) => (
              <option
                key={font.label}
                value={font.value}
                style={{ fontFamily: font.value }}
              >
                {font.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <select
        value={activeNote?.fontSize ?? "14px"}
        onChange={(event) =>
          updateActiveNote({
            fontSize: event.target.value,
          })
        }
        className="memo-select memo-size-select"
        disabled={!editing}
      >
        {fontSizeOptions.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      <button
        type="button"
        onMouseDown={handleToolbarMouseDown}
        onClick={() => runCommand("bold")}
        className="memo-tool-button"
        disabled={!editing}
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={handleToolbarMouseDown}
        onClick={() => runCommand("italic")}
        className="memo-tool-button"
        disabled={!editing}
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={handleToolbarMouseDown}
        onClick={() => runCommand("underline")}
        className="memo-tool-button"
        disabled={!editing}
        title="Underline"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={handleToolbarMouseDown}
        onClick={() => applyHighlight()}
        className="memo-tool-button"
        disabled={!editing}
        title="Highlight"
      >
        <Highlighter className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={handleToolbarMouseDown}
        onClick={() => runCommand("insertUnorderedList")}
        className="memo-tool-button"
        disabled={!editing}
      >
        <List className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={handleToolbarMouseDown}
        onClick={() => runCommand("insertOrderedList")}
        className="memo-tool-button"
        disabled={!editing}
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={handleToolbarMouseDown}
        onClick={insertTable}
        className="memo-tool-button"
        disabled={!editing}
      >
        <Table2 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={openSaveDialog}
        className="memo-tool-button"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const renderColorPicker = () => (
    <div className="memo-color-area">
      <div className="memo-color-label">
        <Palette className="w-3.5 h-3.5" />
        Paper
      </div>

      <div className="memo-color-picker">
        {memoPalettes.map((palette) => (
          <button
            key={palette.id}
            type="button"
            onClick={() =>
              updateActiveNote({
                color: palette.id,
              })
            }
            className={cn(
              "memo-color-chip",
              resolveMemoPalette(activeNote?.color).id === palette.id && "is-active"
            )}
            style={getMemoPaletteDotStyle(palette.id, theme)}
            title={palette.id}
            disabled={!editing}
          >
            {resolveMemoPalette(activeNote?.color).id === palette.id && (
              <Check className="w-3 h-3" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderNoteList = (windowMode = false) => (
    <div
      className={cn(
        "memo-list-panel",
        !windowMode && "memo-widget-list-popover"
      )}
    >
      <div className="memo-list-header">
        <span className="memo-list-header-spacer" aria-hidden="true" />
        <div className="memo-list-header-actions">
          <button
            type="button"
            onClick={addNewMemo}
            className="memo-mini-button"
            title="New memo"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (windowMode) {
                setIsWindowListHidden(true);
              } else {
                setIsWidgetListOpen(false);
              }
            }}
            className="memo-mini-button memo-list-close"
            title="Hide memo list"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="memo-note-list">
        {sortedNotes.map((note) => {
          const preview = stripHtml(note.html) || "Empty memo";
          const palette = resolveMemoPalette(note.color);
          const noteSurface =
            theme === "glass-dark" || theme === "aurora"
              ? palette.darkSurface
              : palette.lightSurface;
          const noteBorder =
            theme === "glass-dark" || theme === "aurora"
              ? palette.darkBorder
              : palette.lightBorder;
          const noteText =
            theme === "glass-dark" || theme === "aurora"
              ? palette.darkText
              : palette.lightText;

          return (
            <article
              key={note.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedNoteId(note.id);
                if (!windowMode) {
                  setIsWidgetListOpen(false);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setSelectedNoteId(note.id);
                  if (!windowMode) {
                    setIsWidgetListOpen(false);
                  }
                }
              }}
              className={cn(
                "memo-note-item",
                note.id === activeNote?.id && "is-active",
                note.pinned && "is-pinned"
              )}
              style={
                {
                  "--memo-note-surface": noteSurface,
                  "--memo-note-border": noteBorder,
                  "--memo-note-text": noteText,
                } as CSSProperties
              }
            >
              <div
                className="memo-note-color-dot"
                style={getMemoPaletteDotStyle(palette.id, theme)}
              />

              <div className="min-w-0 flex-1 text-left">
                <div className="memo-note-title">
                  {note.pinned && <Pin className="w-3 h-3" />}
                  <span>{getDisplayTitle(note)}</span>
                </div>

                <div className="memo-note-preview">{preview}</div>
              </div>

              {editing && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteMemo(note.id);
                  }}
                  className="memo-note-delete"
                  title="Delete memo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );

  const renderWorkspace = (
    ref: RefObject<HTMLDivElement | null>,
    windowMode = false
  ) => {
    if (!activeNote) {
      return (
        <div className="memo-workspace">
          <div className="memo-title-view">No memo</div>
        </div>
      );
    }

    const palette = resolveMemoPalette(activeNote.color);
    const workspaceStyle = {
      "--memo-paper-color": palette.lightSurface,
      "--memo-paper-surface": palette.lightSurface,
      "--memo-paper-border": palette.lightBorder,
      "--memo-title-font": activeNote.fontFamily,
      "--memo-title-color": palette.lightText,
      "--memo-editor-color": palette.lightText,
      "--memo-dark-paper": palette.darkSurface,
      "--memo-dark-border": palette.darkBorder,
      "--memo-dark-text": palette.darkText,
      "--memo-table-ink": palette.tableInk,
    } as CSSProperties;

    return (
      <div
        className={cn("memo-workspace", windowMode && "is-window-mode")}
        style={workspaceStyle}
      >
        {editing ? (
          <input
            value={activeNote.title}
            onChange={(event) =>
              updateActiveNote({
                title: event.target.value,
              })
            }
            className="memo-title-input"
            spellCheck={false}
            placeholder="Untitled Memo"
            style={{
              fontFamily: activeNote.fontFamily,
            }}
          />
        ) : (
          <div
            className="memo-title-view"
            style={{
              fontFamily: activeNote.fontFamily,
            }}
          >
            {getDisplayTitle(activeNote)}
          </div>
        )}

        {renderToolbar()}

        {windowMode && renderColorPicker()}

        <div
          ref={ref}
          contentEditable={editing}
          suppressContentEditableWarning
          spellCheck={false}
          lang="ko"
          onContextMenu={(event) =>
            openTableContextMenu(event, windowMode ? "window" : "widget")
          }
          onInput={() => syncFromEditor(ref.current)}
          className={cn(
            "memo-editor",
            windowMode && "memo-window-editor",
            editing ? "memo-editor-editing" : "memo-editor-locked"
          )}
          style={{
            fontFamily: activeNote.fontFamily,
            fontSize: activeNote.fontSize,
          }}
        />
      </div>
    );
  };

  const memoWindow = (
    <FloatingWindow
      open={memoWindowOpen}
      title="Memo Window"
      subtitle="Resizable floating memo"
      storageKey="glassday.memo.floatingWindow.rect.v1"
      className="memo-floating-window"
      titlebarClassName="memo-floating-window-titlebar"
      defaultRect={{
        x: 120,
        y: 72,
        w: 1120,
        h: 760,
      }}
      minWidth={720}
      minHeight={480}
      onClose={() => setMemoWindowOpen(false)}
      actions={
        <>
          <button
            type="button"
            onClick={() => setIsWindowListHidden((prev) => !prev)}
            className={cn(
              "glass-button h-8 w-8 flex items-center justify-center",
              !isWindowListHidden && "is-active"
            )}
            title={isWindowListHidden ? "Show memo list" : "Hide memo list"}
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={addNewMemo}
            className="glass-button h-8 px-3 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>

          <button
            type="button"
            onClick={openSaveDialog}
            className="glass-button glass-tint-blue h-8 px-3 text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Save
          </button>

          <button
            type="button"
            onClick={togglePinnedNote}
            className={cn(
              "glass-button h-8 px-3 text-xs flex items-center gap-1.5",
              activeNote?.pinned && "is-active"
            )}
          >
            <Pin className="w-3.5 h-3.5" />
            Note
          </button>

          <button
            type="button"
            onClick={() => setEditing((prev) => !prev)}
            className={cn(
              "glass-button h-8 px-3 text-xs flex items-center gap-1.5",
              editing && "is-active"
            )}
          >
            {editing ? "Done" : "Edit"}
          </button>
        </>
      }
    >
      <div
        ref={floatingBodyRef}
        className={cn(
          "memo-floating-body",
          isWindowListHidden && "is-window-list-hidden"
        )}
        style={
          {
            "--memo-window-sidebar-width": `${windowSidebarWidth}px`,
          } as React.CSSProperties
        }
      >
        {!isWindowListHidden && renderNoteList(true)}
        {!isWindowListHidden && (
          <div
            className={cn(
              "memo-window-resizer",
              isDraggingWindowSidebar && "is-dragging"
            )}
            role="separator"
            aria-orientation="vertical"
            onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => {
              event.preventDefault();
              setIsDraggingWindowSidebar(true);
            }}
          />
        )}
        {renderWorkspace(windowEditorRef, true)}
      </div>
    </FloatingWindow>
  );

  const saveDialog =
    saveDialogOpen && activeNote
      ? createPortal(
          <div className="memo-save-backdrop">
            <div className="memo-save-dialog">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">Save Memo as TXT</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Filename is suggested from the first line. You can edit it
                    before saving.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSaveDialogOpen(false)}
                  className="glass-button h-8 w-8 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4">
                <label className="text-xs text-muted-foreground">
                  File name
                </label>

                <input
                  ref={saveInputRef}
                  value={saveFileName}
                  onChange={(event) => setSaveFileName(event.target.value)}
                  spellCheck={false}
                  className="memo-save-input"
                />
              </div>

              <div className="memo-save-options">
                <button
                  type="button"
                  onClick={saveToLocal}
                  className="memo-save-option glass-tint-blue"
                >
                  <Download className="w-4 h-4" />

                  <div>
                    <div className="font-semibold">Local</div>
                    <div className="text-[11px] text-muted-foreground">
                      Download to this computer
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={saveToGoogleDrive}
                  className="memo-save-option glass-tint-mint"
                >
                  <UploadCloud className="w-4 h-4" />

                  <div>
                    <div className="font-semibold">Google Drive</div>
                    <div className="text-[11px] text-muted-foreground">
                      Save after Google login setup
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={sendByEmail}
                  className="memo-save-option glass-tint-peach"
                >
                  <Send className="w-4 h-4" />

                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-[11px] text-muted-foreground">
                      Open email with memo text
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  const tableContextMenuPortal = tableContextMenu
    ? createPortal(
        <div
          className="memo-table-context-menu"
          style={{
            left: tableContextMenu.x,
            top: tableContextMenu.y,
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="memo-table-context-item"
            onClick={() => handleTableMenuAction(() => insertTableRow(false))}
          >
            <Rows2 className="w-3.5 h-3.5" />
            Add row above
          </button>

          <button
            type="button"
            className="memo-table-context-item"
            onClick={() => handleTableMenuAction(() => insertTableRow(true))}
          >
            <Rows2 className="w-3.5 h-3.5" />
            Add row below
          </button>

          <button
            type="button"
            className="memo-table-context-item"
            onClick={() => handleTableMenuAction(() => insertTableColumn(false))}
          >
            <Plus className="w-3.5 h-3.5" />
            Add column left
          </button>

          <button
            type="button"
            className="memo-table-context-item"
            onClick={() => handleTableMenuAction(() => insertTableColumn(true))}
          >
            <Plus className="w-3.5 h-3.5" />
            Add column right
          </button>

          <button
            type="button"
            className="memo-table-context-item"
            onClick={() => handleTableMenuAction(deleteTableRow)}
          >
            <Minus className="w-3.5 h-3.5" />
            Delete row
          </button>

          <button
            type="button"
            className="memo-table-context-item"
            onClick={() => handleTableMenuAction(deleteTableColumn)}
          >
            <X className="w-3.5 h-3.5" />
            Delete column
          </button>

          <div className="memo-table-context-divider" />

          <button
            type="button"
            className="memo-table-context-item"
            onClick={() => handleTableMenuAction(mergeSelectedCellWithRight)}
          >
            <StretchHorizontal className="w-3.5 h-3.5" />
            Merge with right
          </button>

          <button
            type="button"
            className="memo-table-context-item"
            onClick={() => handleTableMenuAction(splitSelectedCell)}
          >
            <Rows2 className="w-3.5 h-3.5" />
            Split merged cell
          </button>

          <div className="memo-table-context-divider" />

          <button
            type="button"
            className="memo-table-context-item"
            onClick={() =>
              handleTableMenuAction(() => adjustSelectedColumnWidth(-24))
            }
          >
            <StretchHorizontal className="w-3.5 h-3.5" />
            Narrow column
          </button>

          <button
            type="button"
            className="memo-table-context-item"
            onClick={() =>
              handleTableMenuAction(() => adjustSelectedColumnWidth(24))
            }
          >
            <StretchHorizontal className="w-3.5 h-3.5" />
            Widen column
          </button>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <GlassCard
        className="memo-widget"
        title="Memo"
        subtitle={
          editing
            ? "Editing memo library"
            : `${normalizedNotes.length} saved memo${
                normalizedNotes.length > 1 ? "s" : ""
              }`
        }
        icon={<StickyNote className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsWidgetListOpen((prev) => !prev);
              }}
              className={cn(
                "glass-button h-8 w-8 flex items-center justify-center memo-compact-toggle",
                isWidgetListOpen && "is-active"
              )}
              title={isWidgetListOpen ? "Hide memo list" : "Show memo list"}
            >
              <PanelLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={addNewMemo}
              className="glass-button h-8 w-8 flex items-center justify-center"
              title="New memo"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setMemoWindowOpen(true)}
              className="glass-button h-8 w-8 flex items-center justify-center"
              title="Open memo window"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setEditing((prev) => !prev)}
              className={cn(
                "glass-button h-8 px-3 text-xs flex items-center gap-1.5",
                editing && "is-active"
              )}
            >
              {editing ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Pencil className="w-3.5 h-3.5" />
              )}

              {editing ? "Done" : "Edit"}
            </button>
          </div>
        }
      >
        <div
          className="memo-app"
        >
          {isWidgetListOpen && renderNoteList()}
          {renderWorkspace(editorRef)}
        </div>
      </GlassCard>

      {memoWindow}
      {saveDialog}
      {tableContextMenuPortal}
    </>
  );
};
