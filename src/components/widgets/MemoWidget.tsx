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

type MemoFontGroup = {
  label: string;
  fonts: MemoFontOption[];
};

type MemoWindowPosition = {
  x: number;
  y: number;
};

const defaultMemoFont =
  "Pretendard, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif";

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
};

export const MemoWidget = () => {
  const [editing, setEditing] = useState(false);
  const [memoWindowOpen, setMemoWindowOpen] = useState(false);
  const [windowPinned, setWindowPinned] = useState(false);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveFileName, setSaveFileName] = useState("");

  const editorRef = useRef<HTMLDivElement | null>(null);
  const windowEditorRef = useRef<HTMLDivElement | null>(null);
  const saveInputRef = useRef<HTMLInputElement | null>(null);

  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const { value: notes, setValue: setNotes } = useLocalStorage<MemoNote[]>(
    "glassday.memo.notes.v2",
    defaultNotes
  );

  const { value: selectedNoteId, setValue: setSelectedNoteId } =
    useLocalStorage<string>("glassday.memo.selected.v2", "default-memo");

  const { value: memoWindowPosition, setValue: setMemoWindowPosition } =
    useLocalStorage<MemoWindowPosition>("glassday.memo.window.position.v1", {
      x: 120,
      y: 72,
    });

  const normalizedNotes = useMemo(
    () => notes.map((note) => normalizeNote(note)),
    [notes]
  );

  const sortedNotes = useMemo(() => sortMemos(normalizedNotes), [normalizedNotes]);

  const activeNote =
    normalizedNotes.find((note) => note.id === selectedNoteId) ??
    normalizedNotes[0] ??
    null;

  const activeEditor = memoWindowOpen
    ? windowEditorRef.current
    : editorRef.current;

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

    requestAnimationFrame(() => {
      saveInputRef.current?.focus();
      saveInputRef.current?.select();
    });
  }, [saveDialogOpen]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragRef.current.dragging) return;

      const nextX =
        dragRef.current.initialX + event.clientX - dragRef.current.startX;
      const nextY =
        dragRef.current.initialY + event.clientY - dragRef.current.startY;

      const maxX = Math.max(16, window.innerWidth - 520);
      const maxY = Math.max(16, window.innerHeight - 240);

      setMemoWindowPosition({
        x: Math.min(Math.max(16, nextX), maxX),
        y: Math.min(Math.max(16, nextY), maxY),
      });
    };

    const handleMouseUp = () => {
      dragRef.current.dragging = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setMemoWindowPosition]);

  const updateActiveNote = (patch: Partial<MemoNote>) => {
    if (!activeNote) return;

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

    if (nextNotes.length === 0) {
      const replacement = createMemoNote();
      setNotes([replacement]);
      setSelectedNoteId(replacement.id);
      setEditing(true);
      return;
    }

    setNotes(nextNotes);

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

    a.href = url;
    a.download = fileName;

    document.body.appendChild(a);
    a.click();
    a.remove();

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

  const startWindowDrag = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    if (target.closest("button") || target.closest("select") || target.closest("input")) {
      return;
    }

    dragRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      initialX: memoWindowPosition.x,
      initialY: memoWindowPosition.y,
    };
  };

  const closeMemoWindow = () => {
    setMemoWindowOpen(false);
  };

  const renderToolbar = () => (
    <div className="memo-toolbar">
      <select
        value={activeNote?.fontFamily ?? defaultMemoFont}
        onChange={(e) =>
          updateActiveNote({
            fontFamily: e.target.value,
          })
        }
        className="memo-select memo-font-select"
        disabled={!editing}
      >
        {fontGroups.map((group) => (
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
          </select>

      <select
        value={activeNote?.fontSize ?? "14px"}
        onChange={(e) =>
          updateActiveNote({
            fontSize: e.target.value,
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
            <article
              key={note.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedNoteId(note.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setSelectedNoteId(note.id);
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
            updateNote(activeNote.id, {
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

  // const memoWindow = memoWindowOpen
  // ? createPortal(
  //     <div className="memo-window-layer">
  //         <div
  //           className="memo-window"
  //           style={{
  //             left: memoWindowPosition.x,
  //             top: memoWindowPosition.y,
  //           }}
  //         >
  //           <div className="memo-window-titlebar" onMouseDown={startWindowDrag}>
  //             <div>
  //               <div className="text-sm font-semibold">Memo Window</div>
  //               <div className="text-xs text-muted-foreground">
  //                 {windowPinned ? "Floating memo is pinned" : "Floating memo window"}
  //               </div>
  //             </div>

  //             <div className="flex items-center gap-2">
  //               <button
  //                 type="button"
  //                 onClick={addNewMemo}
  //                 className="glass-button h-8 px-3 text-xs flex items-center gap-1.5"
  //               >
  //                 <Plus className="w-3.5 h-3.5" />
  //                 New
  //               </button>

  //               <button
  //                 type="button"
  //                 onClick={openSaveDialog}
  //                 className="glass-button glass-tint-blue h-8 px-3 text-xs flex items-center gap-1.5"
  //               >
  //                 <Download className="w-3.5 h-3.5" />
  //                 Save
  //               </button>

  //               <button
  //                 type="button"
  //                 onClick={() => setWindowPinned((prev) => !prev)}
  //                 className={cn(
  //                   "glass-button h-8 px-3 text-xs flex items-center gap-1.5",
  //                   windowPinned && "is-active"
  //                 )}
  //               >
  //                 <Pin className="w-3.5 h-3.5" />
  //                 Pin
  //               </button>

  //               <button
  //                 type="button"
  //                 onClick={togglePinnedNote}
  //                 className={cn(
  //                   "glass-button h-8 px-3 text-xs flex items-center gap-1.5",
  //                   activeNote?.pinned && "is-active"
  //                 )}
  //               >
  //                 <Pin className="w-3.5 h-3.5" />
  //                 Note
  //               </button>

  //               <button
  //                 type="button"
  //                 onClick={() => setEditing((prev) => !prev)}
  //                 className={cn(
  //                   "glass-button h-8 px-3 text-xs flex items-center gap-1.5",
  //                   editing && "is-active"
  //                 )}
  //               >
  //                 {editing ? "Done" : "Edit"}
  //               </button>

  //               <button
  //                 type="button"
  //                 onClick={closeMemoWindow}
  //                 className="glass-button h-8 w-8 flex items-center justify-center"
  //               >
  //                 <X className="w-4 h-4" />
  //               </button>
  //             </div>
  //           </div>

  //           <div className="memo-window-body">
  //             {renderNoteList()}
  //             {renderWorkspace(windowEditorRef, true)}
  //           </div>
  //         </div>
  //       </div>,
  //       document.body
  //     )
  //   : null;

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
                  onChange={(e) => setSaveFileName(e.target.value)}
                  spellCheck={false}
                  className="memo-save-input"
                />
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
        <div className="memo-app">
          {renderNoteList()}
          {renderWorkspace(editorRef)}
        </div>
      </GlassCard>

      {memoWindow}
      {saveDialog}
    </>
  );
};

export default MemoWidget;