import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bold,
  Download,
  Italic,
  List,
  ListOrdered,
  Lock,
  Maximize2,
  Pencil,
  Plus,
  Send,
  StickyNote,
  Table2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";

type MemoNote = {
  id: string;
  title: string;
  html: string;
  fontFamily: string;
  fontSize: string;
  createdAt: number;
  updatedAt: number;
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `memo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const defaultNotes: MemoNote[] = [
  {
    id: "default-memo",
    title: "Portfolio Memo",
    html: "Portfolio: Add LCF and ER Grouping project details.",
    fontFamily: "Pretendard",
    fontSize: "14px",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const fontOptions = [
  "Pretendard",
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
];

const fontSizeOptions = ["13px", "14px", "15px", "16px", "18px", "20px"];

const htmlToPlainText = (html: string) => {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.innerText;
};

const getFirstLineTitle = (html: string) => {
  const plainText = htmlToPlainText(html);

  const firstLine = plainText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine || "";
};

const stripHtml = (html: string) => {
  return htmlToPlainText(html).replace(/\s+/g, " ").trim();
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

const createMemoNote = (): MemoNote => {
  const now = Date.now();

  return {
    id: createId(),
    title: "새 메모",
    html: "",
    fontFamily: "Pretendard",
    fontSize: "14px",
    createdAt: now,
    updatedAt: now,
  };
};

export const MemoWidget = () => {
  const [editing, setEditing] = useState(false);
  const [maximized, setMaximized] = useState(false);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveFileName, setSaveFileName] = useState("");

  const editorRef = useRef<HTMLDivElement | null>(null);
  const modalEditorRef = useRef<HTMLDivElement | null>(null);
  const saveInputRef = useRef<HTMLInputElement | null>(null);

  const { value: notes, setValue: setNotes } = useLocalStorage<MemoNote[]>(
    "glassday.memo.notes.v1",
    defaultNotes
  );

  const { value: selectedNoteId, setValue: setSelectedNoteId } =
    useLocalStorage<string>("glassday.memo.selected.v1", "default-memo");

  const activeNote =
    notes.find((note) => note.id === selectedNoteId) ?? notes[0] ?? null;

  const activeEditor = maximized ? modalEditorRef.current : editorRef.current;

  useEffect(() => {
    if (!activeNote && notes.length > 0) {
      setSelectedNoteId(notes[0].id);
    }
  }, [activeNote, notes, setSelectedNoteId]);

  useEffect(() => {
    if (!activeNote) return;

    if (editorRef.current && editorRef.current.innerHTML !== activeNote.html) {
      editorRef.current.innerHTML = activeNote.html;
    }

    if (
      modalEditorRef.current &&
      modalEditorRef.current.innerHTML !== activeNote.html
    ) {
      modalEditorRef.current.innerHTML = activeNote.html;
    }
  }, [activeNote?.id, activeNote?.html, maximized]);

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
              ...note,
              ...patch,
              updatedAt: Date.now(),
            }
          : note
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

    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    setEditing(true);
  };

  const deleteMemo = (id: string) => {
    const nextNotes = notes.filter((note) => note.id !== id);

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
    const a = document.createElement("a");

    a.href = url;
    a.download = fileName;

    document.body.appendChild(a);
    a.click();
    a.remove();

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

  const handleToolbarMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  const renderToolbar = () => (
    <div className="memo-toolbar">
      <select
        value={activeNote?.fontFamily ?? "Pretendard"}
        onChange={(e) =>
          updateActiveNote({
            fontFamily: e.target.value,
          })
        }
        className="memo-select"
        disabled={!editing}
      >
        {fontOptions.map((font) => (
          <option key={font} value={font}>
            {font}
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
        className="memo-select"
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

  const renderNoteList = () => (
    <div className="memo-list-panel">
      <div className="memo-list-header">
        <span>Memos</span>

        <button
          type="button"
          onClick={addNewMemo}
          className="memo-mini-button"
          title="New memo"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="memo-note-list">
        {notes.map((note) => {
          const preview = stripHtml(note.html) || "Empty memo";

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
                note.id === activeNote?.id && "is-active"
              )}
            >
              <div className="min-w-0 flex-1 text-left">
                <div className="memo-note-title">{getDisplayTitle(note)}</div>
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
    ref: React.RefObject<HTMLDivElement | null>,
    modal = false
  ) => {
    if (!activeNote) {
      return (
        <div className="memo-workspace">
          <div className="memo-title-view">No memo</div>
        </div>
      );
    }

    return (
      <div className="memo-workspace">
        {editing ? (
          <input
            value={activeNote.title}
            onChange={(e) =>
              updateActiveNote({
                title: e.target.value,
              })
            }
            spellCheck={false}
            className="memo-title-input"
            placeholder="Memo title"
          />
        ) : (
          <div className="memo-title-view">{getDisplayTitle(activeNote)}</div>
        )}

        {renderToolbar()}

        <div
          ref={ref}
          contentEditable={editing}
          suppressContentEditableWarning
          spellCheck={false}
          lang="ko"
          onInput={() => syncFromEditor(ref.current)}
          className={cn(
            "memo-editor",
            modal && "memo-modal-editor",
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

  return (
    <>
      <GlassCard
        title="Memo"
        subtitle={
          editing
            ? "Editing memo library"
            : `${notes.length} saved memo${notes.length > 1 ? "s" : ""}`
        }
        icon={<StickyNote className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-1.5">
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
              onClick={() => setMaximized(true)}
              className="glass-button h-8 w-8 flex items-center justify-center"
              title="Open memo library"
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
        <div className="memo-app">
          {renderNoteList()}
          {renderWorkspace(editorRef)}
        </div>
      </GlassCard>

      {maximized && activeNote && (
        <div className="memo-modal-backdrop">
          <div className="memo-modal-window">
            <div className="memo-modal-header">
              <div>
                <div className="text-sm font-semibold">Memo Library</div>
                <div className="text-xs text-muted-foreground">
                  Saved automatically
                </div>
              </div>

              <div className="flex items-center gap-2">
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
                  onClick={() => setEditing((prev) => !prev)}
                  className={cn(
                    "glass-button h-8 px-3 text-xs flex items-center gap-1.5",
                    editing && "is-active"
                  )}
                >
                  {editing ? "Done" : "Edit"}
                </button>

                <button
                  type="button"
                  onClick={() => setMaximized(false)}
                  className="glass-button h-8 w-8 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="memo-modal-body">
              {renderNoteList()}
              {renderWorkspace(modalEditorRef, true)}
            </div>
          </div>
        </div>
      )}

      {saveDialogOpen &&
  activeNote &&
  createPortal(
    <div className="memo-save-backdrop">
      <div className="memo-save-dialog">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Save Memo as TXT</div>
            <div className="text-xs text-muted-foreground mt-1">
              Filename is suggested from the first line. You can edit it before
              saving.
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
          <label className="text-xs text-muted-foreground">File name</label>

          <input
            ref={saveInputRef}
            value={saveFileName}
            onChange={(e) => setSaveFileName(e.target.value)}
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
  )}

  
    </>
  );
};