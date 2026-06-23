import {
  Bold,
  Download,
  Italic,
  List,
  ListOrdered,
  Lock,
  Maximize2,
  Pin,
  Plus,
  Save,
  StickyNote,
  Table,
  Trash2,
  Unlock,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";

type MemoColor =
  | "#b7f7d0"
  | "#fff1a8"
  | "#f7a8c9"
  | "#a9e9ff"
  | "#cbb8ff"
  | "#ffbf91"
  | "#d9f99d"
  | "#fbcfe8";

type MemoNote = {
  id: string;
  title: string;
  content: string;
  color: MemoColor;
  pinned: boolean;
  locked: boolean;
  updatedAt: string;
};

const MEMO_STORAGE_KEY = "glassday.memo.notes.v2";

const MEMO_COLORS: MemoColor[] = [
  "#b7f7d0",
  "#fff1a8",
  "#f7a8c9",
  "#a9e9ff",
  "#cbb8ff",
  "#ffbf91",
  "#d9f99d",
  "#fbcfe8",
];

const FONT_OPTIONS = [
  "Pretendard",
  "NeoDunggeunmo",
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
];

const SIZE_OPTIONS = ["12px", "14px", "16px", "18px", "20px", "24px"];

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `memo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const nowIso = () => new Date().toISOString();

const stripHtml = (html: string) => {
  if (!html) return "";

  const div = document.createElement("div");
  div.innerHTML = html;

  return div.textContent?.trim() ?? "";
};

const sanitizeFileName = (value: string) => {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 60);
};

const createNote = (index = 0): MemoNote => {
  return {
    id: createId(),
    title: "새 메모",
    content: "",
    color: MEMO_COLORS[index % MEMO_COLORS.length],
    pinned: false,
    locked: false,
    updatedAt: nowIso(),
  };
};

const getDefaultNotes = (): MemoNote[] => [
  {
    id: "memo-default-1",
    title: "새 메모",
    content: "",
    color: "#b7f7d0",
    pinned: true,
    locked: false,
    updatedAt: nowIso(),
  },
  {
    id: "memo-default-2",
    title: "Portfolio Memo",
    content: "Portfolio: Add LCF and ER Grouping project details.",
    color: "#fff1a8",
    pinned: false,
    locked: false,
    updatedAt: nowIso(),
  },
];

const normalizeNote = (note: Partial<MemoNote>, index: number): MemoNote => {
  const color =
    note.color && MEMO_COLORS.includes(note.color)
      ? note.color
      : MEMO_COLORS[index % MEMO_COLORS.length];

  return {
    id: note.id || createId(),
    title: note.title || "새 메모",
    content: note.content || "",
    color,
    pinned: Boolean(note.pinned),
    locked: Boolean(note.locked),
    updatedAt: note.updatedAt || nowIso(),
  };
};

const loadNotes = (): MemoNote[] => {
  if (typeof window === "undefined") return getDefaultNotes();

  try {
    const raw = window.localStorage.getItem(MEMO_STORAGE_KEY);
    if (!raw) return getDefaultNotes();

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return getDefaultNotes();

    const normalized = parsed.map((note, index) => normalizeNote(note, index));
    return normalized.length > 0 ? normalized : getDefaultNotes();
  } catch {
    return getDefaultNotes();
  }
};

const classNames = (
  ...values: Array<string | false | null | undefined>
) => values.filter(Boolean).join(" ");

export const MemoWidget = () => {
  const [notes, setNotes] = useState<MemoNote[]>(() => loadNotes());
  const [selectedId, setSelectedId] = useState<string>(() => {
    const loaded = loadNotes();
    return loaded[0]?.id ?? "";
  });

  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [fontFamily, setFontFamily] = useState("Pretendard");
  const [fontSize, setFontSize] = useState("14px");
  const [savedPulse, setSavedPulse] = useState(false);

  const editorRef = useRef<HTMLDivElement | null>(null);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  }, [notes]);

  const selectedNote = useMemo(() => {
    return notes.find((note) => note.id === selectedId) ?? notes[0] ?? null;
  }, [notes, selectedId]);

  useEffect(() => {
    window.localStorage.setItem(MEMO_STORAGE_KEY, JSON.stringify(notes));

    window.dispatchEvent(
      new CustomEvent("glassday:memo-updated", {
        detail: { notes },
      })
    );
  }, [notes]);

  useEffect(() => {
    if (!selectedNote || !editorRef.current) return;

    editorRef.current.innerHTML = selectedNote.content || "";
  }, [selectedNote?.id, isWindowOpen]);

  useEffect(() => {
    if (!isWindowOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsWindowOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isWindowOpen]);

  const flashSaved = () => {
    setSavedPulse(true);
    window.setTimeout(() => setSavedPulse(false), 900);
  };

  const updateNote = (noteId: string, patch: Partial<MemoNote>) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId
          ? {
              ...note,
              ...patch,
              updatedAt: nowIso(),
            }
          : note
      )
    );
  };

  const updateSelectedNote = (patch: Partial<MemoNote>) => {
    if (!selectedNote) return;
    updateNote(selectedNote.id, patch);
  };

  const addNote = () => {
    const next = createNote(notes.length);

    setNotes((prev) => [next, ...prev]);
    setSelectedId(next.id);
    setIsWindowOpen(true);
  };

  const deleteNote = (noteId: string) => {
    setNotes((prev) => {
      const next = prev.filter((note) => note.id !== noteId);

      if (selectedId === noteId) {
        setSelectedId(next[0]?.id ?? "");
      }

      return next.length > 0 ? next : [createNote(0)];
    });
  };

  const handleEditorInput = () => {
    if (!selectedNote || !editorRef.current) return;

    updateNote(selectedNote.id, {
      content: editorRef.current.innerHTML,
    });
  };

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const runCommand = (command: string, value?: string) => {
    if (!selectedNote || selectedNote.locked) return;

    focusEditor();
    document.execCommand(command, false, value);

    if (editorRef.current) {
      updateSelectedNote({
        content: editorRef.current.innerHTML,
      });
    }
  };

  const wrapSelection = (style: string) => {
    if (!selectedNote || selectedNote.locked) return;

    focusEditor();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const text = selection.toString();

    if (!text) {
      document.execCommand("insertHTML", false, `<span style="${style}"></span>`);
    } else {
      document.execCommand(
        "insertHTML",
        false,
        `<span style="${style}">${text}</span>`
      );
    }

    if (editorRef.current) {
      updateSelectedNote({
        content: editorRef.current.innerHTML,
      });
    }
  };

  const insertTable = () => {
    if (!selectedNote || selectedNote.locked) return;

    const tableHtml = `
      <table>
        <tbody>
          <tr>
            <th>Item</th>
            <th>Memo</th>
          </tr>
          <tr>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    `;

    runCommand("insertHTML", tableHtml);
  };

  const downloadNote = () => {
    if (!selectedNote) return;

    const title = sanitizeFileName(selectedNote.title || "memo");
    const body = stripHtml(selectedNote.content);
    const blob = new Blob([`${selectedNote.title}\n\n${body}`], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${title || "memo"}.txt`;
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (selectedNote && editorRef.current) {
      updateSelectedNote({
        content: editorRef.current.innerHTML,
      });
    }

    window.localStorage.setItem(MEMO_STORAGE_KEY, JSON.stringify(notes));
    flashSaved();
  };

  const handleToolbarMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const previewText = (note: MemoNote) => {
    const text = stripHtml(note.content);

    if (!text) return "Empty memo";
    return text.length > 54 ? `${text.slice(0, 54)}...` : text;
  };

  const renderNoteList = () => (
    <aside className="memo-list-panel">
      <div className="memo-list-header">
        <span>Memos</span>

        <button
          type="button"
          className="memo-mini-button"
          onClick={addNote}
          title="New memo"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="memo-note-list">
        {sortedNotes.map((note) => {
          const noteStyle =
            {
              "--memo-color": note.color,
            } as CSSProperties;

          return (
            <button
              key={note.id}
              type="button"
              onClick={() => setSelectedId(note.id)}
              className={classNames(
                "memo-note-item",
                selectedNote?.id === note.id && "is-active"
              )}
              style={noteStyle}
            >
              <span
                className="memo-note-color-chip"
                style={{ backgroundColor: note.color }}
                aria-hidden="true"
              />

              <span className="memo-note-text">
                <span className="memo-note-title">
                  {note.pinned && <Pin className="w-3 h-3" />}
                  {note.title || "Untitled"}
                </span>
                <span className="memo-note-preview">{previewText(note)}</span>
              </span>

              <span
                role="button"
                tabIndex={0}
                className="memo-note-delete"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteNote(note.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    deleteNote(note.id);
                  }
                }}
                title="Delete memo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );

  const renderColorPalette = () => {
    if (!selectedNote) return null;

    return (
      <div className="memo-color-palette" aria-label="Memo color palette">
        {MEMO_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={classNames(
              "memo-color-swatch",
              selectedNote.color === color && "is-active"
            )}
            style={{ backgroundColor: color }}
            onClick={() => updateSelectedNote({ color })}
            title={color}
          />
        ))}
      </div>
    );
  };

  const renderToolbar = () => {
    const disabled = !selectedNote || selectedNote.locked;

    return (
      <>
        <div
          className="memo-toolbar"
          onMouseDown={handleToolbarMouseDown}
        >
          <select
            className="memo-select"
            value={fontFamily}
            disabled={disabled}
            onChange={(event) => {
              const value = event.target.value;
              setFontFamily(value);
              runCommand("fontName", value);
            }}
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>

          <select
            className="memo-select"
            value={fontSize}
            disabled={disabled}
            onChange={(event) => {
              const value = event.target.value;
              setFontSize(value);
              wrapSelection(`font-size: ${value};`);
            }}
          >
            {SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="memo-tool-button"
            disabled={disabled}
            onClick={() => runCommand("bold")}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            className="memo-tool-button"
            disabled={disabled}
            onClick={() => runCommand("italic")}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            className="memo-tool-button"
            disabled={disabled}
            onClick={() => runCommand("insertUnorderedList")}
            title="Bullet list"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            className="memo-tool-button"
            disabled={disabled}
            onClick={() => runCommand("insertOrderedList")}
            title="Numbered list"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            className="memo-tool-button"
            disabled={disabled}
            onClick={insertTable}
            title="Insert table"
          >
            <Table className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            className="memo-tool-button"
            onClick={downloadNote}
            title="Download memo"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        {renderColorPalette()}
      </>
    );
  };

  const renderWorkspace = (windowMode = false) => {
    if (!selectedNote) {
      return (
        <div className="memo-workspace">
          <div className="memo-empty-state">
            <StickyNote className="w-5 h-5" />
            <span>새 메모를 만들어줘.</span>
          </div>
        </div>
      );
    }

    return (
      <section
        className={classNames(
          "memo-workspace",
          windowMode && "is-window-mode"
        )}
      >
        <div className="memo-workspace-header">
          <input
            className="memo-title-input"
            value={selectedNote.title}
            onChange={(event) =>
              updateSelectedNote({
                title: event.target.value,
              })
            }
            placeholder="Memo title"
          />

          <div className="memo-workspace-actions">
            <button
              type="button"
              className="memo-tool-button"
              onClick={() =>
                updateSelectedNote({
                  pinned: !selectedNote.pinned,
                })
              }
              title={selectedNote.pinned ? "Unpin" : "Pin"}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              className="memo-tool-button"
              onClick={() =>
                updateSelectedNote({
                  locked: !selectedNote.locked,
                })
              }
              title={selectedNote.locked ? "Unlock" : "Lock"}
            >
              {selectedNote.locked ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Unlock className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {renderToolbar()}

        <div className="memo-editor-shell">
          <div className="memo-editor-label">
            <StickyNote className="w-3.5 h-3.5" />
            <span>Paper</span>
          </div>

          <div
            ref={editorRef}
            className={classNames(
              "memo-editor",
              selectedNote.locked
                ? "memo-editor-locked"
                : "memo-editor-editing"
            )}
            contentEditable={!selectedNote.locked}
            suppressContentEditableWarning
            onInput={handleEditorInput}
            onBlur={handleEditorInput}
            data-placeholder="여기에 메모를 작성해..."
            style={{
              fontFamily,
              fontSize,
            }}
          />
        </div>
      </section>
    );
  };

  return (
    <>
      <section className="glass-card memo-widget">
        <div className="memo-widget-header">
          <div className="memo-widget-title-wrap">
            <div className="glass-card-icon">
              <StickyNote className="w-4 h-4" />
            </div>

            <div>
              <h3>Pinned Memo</h3>
              <p>
                {notes.length} memo{notes.length > 1 ? "s" : ""} · autosaved
              </p>
            </div>
          </div>

          <div className="memo-widget-actions">
            <button
              type="button"
              className="memo-mini-button"
              onClick={addNote}
              title="New memo"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              className="memo-mini-button"
              onClick={() => setIsWindowOpen(true)}
              title="Open memo window"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="memo-app">
          {renderNoteList()}
          {renderWorkspace(false)}
        </div>
      </section>

      {isWindowOpen && (
        <div className="memo-window-backdrop">
          <div className="memo-window-layer">
            <section className="memo-window">
              <div className="memo-window-titlebar">
                <div className="memo-window-title">
                  <strong>Memo Window</strong>
                  <span>Resizable floating memo</span>
                </div>

                <div className="memo-window-actions">
                  <button
                    type="button"
                    className="memo-window-action"
                    onClick={addNote}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New
                  </button>

                  <button
                    type="button"
                    className="memo-window-action"
                    onClick={handleSave}
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savedPulse ? "Saved" : "Save"}
                  </button>

                  <button
                    type="button"
                    className="memo-window-action"
                    onClick={() =>
                      selectedNote &&
                      updateSelectedNote({
                        pinned: !selectedNote.pinned,
                      })
                    }
                  >
                    <Pin className="w-3.5 h-3.5" />
                    Note
                  </button>

                  <button
                    type="button"
                    className="memo-window-action"
                    onClick={() => setIsWindowOpen(false)}
                  >
                    Done
                  </button>

                  <button
                    type="button"
                    className="memo-window-close"
                    onClick={() => setIsWindowOpen(false)}
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="memo-window-body">
                <div className="memo-modal-body">
                  {renderNoteList()}
                  {renderWorkspace(true)}
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
};

export default MemoWidget;