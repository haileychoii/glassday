import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import { createPortal } from "react-dom";
import {
  Bold,
  Check,
  Download,
  Italic,
  List,
  ListOrdered,
  Lock,
  Maximize2,
  Palette,
  PanelLeft,
  Pencil,
  Pin,
  Plus,
  Send,
  StickyNote,
  Table2,
  Trash2,
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

const getDefaultMemoFont = () => getSavedDefaultMemoFont() || DEFAULT_MEMO_FONT;

const defaultMemoColor = "#FFF7CF";

const memoColors = [
  "#FFF7CF",
  "#FFE1E1",
  "#FFE6F2",
  "#E9D8FF",
  "#DDE7FF",
  "#DDF4FF",
  "#DDF8EA",
  "#EAF7D8",
  "#F4E7D3",
  "#F2F2F2",
  "#FFFFFF",
  "#EEF2FF",
];

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
  const [availableFontGroups, setAvailableFontGroups] =
    useState<MemoFontGroup[]>(fontGroups);
  const [editing, setEditing] = useState(false);
  const [memoWindowOpen, setMemoWindowOpen] = useState(false);
  const [isCompactListOpen, setIsCompactListOpen] = useState(false);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveFileName, setSaveFileName] = useState("");

  const editorRef = useRef<HTMLDivElement | null>(null);
  const windowEditorRef = useRef<HTMLDivElement | null>(null);
  const saveInputRef = useRef<HTMLInputElement | null>(null);

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
      <table>
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
        {memoColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() =>
              updateActiveNote({
                color,
              })
            }
            className={cn(
              "memo-color-chip",
              activeNote?.color === color && "is-active"
            )}
            style={{ backgroundColor: color }}
            title={color}
            disabled={!editing}
          >
            {activeNote?.color === color && <Check className="w-3 h-3" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderNoteList = () => (
    <div className={cn("memo-list-panel", isCompactListOpen && "is-compact-open")}>
      <div className="memo-list-header">
        <span>Memos</span>
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
            onClick={() => setIsCompactListOpen(false)}
            className="memo-mini-button memo-list-close"
            title="Close memo list"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="memo-note-list">
        {sortedNotes.map((note) => {
          const preview = stripHtml(note.html) || "Empty memo";

          return (
            <article
              key={note.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedNoteId(note.id);
                setIsCompactListOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setSelectedNoteId(note.id);
                  setIsCompactListOpen(false);
                }
              }}
              className={cn(
                "memo-note-item",
                note.id === activeNote?.id && "is-active",
                note.pinned && "is-pinned"
              )}
            >
              <div
                className="memo-note-color-dot"
                style={{ backgroundColor: note.color || defaultMemoColor }}
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

    return (
      <div className={cn("memo-workspace", windowMode && "is-window-mode")}>
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
          />
        ) : (
          <div className="memo-title-view">{getDisplayTitle(activeNote)}</div>
        )}

        {renderToolbar()}

        {windowMode && renderColorPicker()}

        <div
          ref={ref}
          contentEditable={editing}
          suppressContentEditableWarning
          spellCheck={false}
          lang="ko"
          onInput={() => syncFromEditor(ref.current)}
          className={cn(
            "memo-editor",
            windowMode && "memo-window-editor",
            editing ? "memo-editor-editing" : "memo-editor-locked"
          )}
          style={{
            fontFamily: activeNote.fontFamily,
            fontSize: activeNote.fontSize,
            background: activeNote.color || defaultMemoColor,
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
      <div className="memo-floating-body">
        {renderNoteList()}
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
              onClick={() => setIsCompactListOpen((prev) => !prev)}
              className={cn(
                "glass-button h-8 w-8 flex items-center justify-center memo-compact-toggle",
                isCompactListOpen && "is-active"
              )}
              title={isCompactListOpen ? "Hide memo list" : "Show memo list"}
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
          className={cn("memo-app", isCompactListOpen && "is-compact-list-open")}
        >
          {renderNoteList()}
          {renderWorkspace(editorRef)}
        </div>
      </GlassCard>

      {memoWindow}
      {saveDialog}
    </>
  );
};
