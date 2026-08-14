/**
 * ============================================================
 * [Overlay] Quick Capture
 * ============================================================
 *
 * Role:
 * - Opens a small capture surface from keyboard shortcuts or commands.
 * - Sends captures to the lightweight persistence adapter.
 *
 * Connections:
 * - Host: src/App.tsx
 * - Persistence: src/lib/quickCapture.ts
 * - Style: src/styles/command.css
 *
 * UX:
 * - Default capture goes to Inbox.
 * - Memo and Task reuse existing widget storage instead of creating a new model.
 * - Korean: 어디서든 빠르게 적고, 나중에 분류할 수 있게 하는 작은 입력창입니다.
 * ============================================================
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ClipboardList,
  Lightbulb,
  Link,
  NotebookPen,
  ReceiptText,
  Send,
  StickyNote,
  X,
} from "lucide-react";

import {
  captureQuickEntry,
  inferQuickCaptureKind,
  type QuickCaptureKind,
} from "../../lib/quickCapture";
import { cn } from "../../lib/utils";

type QuickCaptureProps = {
  open: boolean;
  onClose: () => void;
  onCaptured?: (message: string) => void;
};

const captureTypes: Array<{
  id: QuickCaptureKind;
  label: string;
  description: string;
  icon: typeof StickyNote;
}> = [
  {
    id: "inbox",
    label: "Inbox",
    description: "Decide later",
    icon: StickyNote,
  },
  {
    id: "memo",
    label: "Memo",
    description: "Create note",
    icon: NotebookPen,
  },
  {
    id: "task",
    label: "Task",
    description: "Today Focus",
    icon: ClipboardList,
  },
  {
    id: "idea",
    label: "Idea",
    description: "Inbox idea",
    icon: Lightbulb,
  },
  {
    id: "url",
    label: "URL",
    description: "Save link",
    icon: Link,
  },
  {
    id: "expense",
    label: "Expense",
    description: "Inbox expense",
    icon: ReceiptText,
  },
];

const defaultCaptureType = captureTypes[0];

const resultLabels: Record<string, string> = {
  inbox: "Captured to Inbox.",
  memo: "Created a memo.",
  "today-task": "Added to Today Focus.",
};

export const QuickCapture = ({
  open,
  onClose,
  onCaptured,
}: QuickCaptureProps) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<QuickCaptureKind>("inbox");
  const [status, setStatus] = useState("");

  const selectedType = useMemo(
    () => captureTypes.find((type) => type.id === kind) ?? defaultCaptureType,
    [kind]
  );

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      setStatus("");
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = () => {
    const result = captureQuickEntry({ kind, text });

    if (!result) {
      setStatus("Write something first.");
      return;
    }

    const message = resultLabels[result.routedTo] ?? "Captured.";
    setText("");
    setKind("inbox");
    setStatus(message);
    onCaptured?.(message);
    onClose();
  };

  const handleTextChange = (nextText: string) => {
    setText(nextText);

    if (kind === "inbox") {
      const inferred = inferQuickCaptureKind(nextText);
      if (inferred !== "inbox") {
        setKind(inferred);
      }
    }
  };

  const SelectedIcon = selectedType.icon;

  return (
    <div className="command-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="quick-capture-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Quick Capture"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="quick-capture-header">
          <div className="command-title-group">
            <span className="command-icon-box">
              <SelectedIcon className="w-4 h-4" />
            </span>
            <div>
              <h2>Quick Capture</h2>
              <p>Inbox first. Sort later.</p>
            </div>
          </div>

          <button
            type="button"
            className="command-icon-button"
            onClick={onClose}
            aria-label="Close Quick Capture"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="quick-capture-type-row" role="listbox" aria-label="Capture type">
          {captureTypes.map((type) => {
            const Icon = type.icon;
            const active = type.id === kind;

            return (
              <button
                key={type.id}
                type="button"
                className={cn("quick-capture-type", active && "is-active")}
                onClick={() => setKind(type.id)}
                aria-pressed={active}
                title={type.description}
              >
                {active ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>

        <textarea
          ref={inputRef}
          value={text}
          onChange={(event) => handleTextChange(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          className="quick-capture-input"
          placeholder="내일 AXA 지원서 제출, 점심 12,000원, 나중에 볼 URL..."
          rows={5}
        />

        <footer className="quick-capture-footer">
          <span className="command-hint">
            Ctrl/Cmd + Enter to capture
          </span>

          <div className="quick-capture-actions">
            {status && <span className="quick-capture-status">{status}</span>}
            <button
              type="button"
              className="glass-button quick-capture-submit"
              onClick={submit}
            >
              <Send className="w-4 h-4" />
              <span>Capture</span>
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};
