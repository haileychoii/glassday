import { useState } from "react";
import { Lock, Pencil, StickyNote } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";

const defaultMemo =
  "Portfolio: Add LCF and ER Grouping project details.";

export const MemoWidget = () => {
  const [editing, setEditing] = useState(false);

  const {
    value: memo,
    setValue: setMemo,
  } = useLocalStorage<string>("glassday.memo", defaultMemo);

  return (
    <GlassCard
      title="Memo"
      subtitle={editing ? "Editing memo" : "Saved locally"}
      icon={<StickyNote className="w-4 h-4" />}
      actions={
        <button
          type="button"
          onClick={() => setEditing((prev) => !prev)}
          className={cn(
            "h-8 px-3 rounded-full text-xs border transition flex items-center gap-1.5",
            editing
              ? "bg-foreground text-background border-foreground"
              : "bg-white/35 border-white/50 text-muted-foreground hover:text-foreground"
          )}
        >
          {editing ? (
            <Lock className="w-3.5 h-3.5" />
          ) : (
            <Pencil className="w-3.5 h-3.5" />
          )}
          {editing ? "Done" : "Edit"}
        </button>
      }
    >
      {editing ? (
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Drop a thought before it disappears..."
          className="w-full h-full min-h-28 resize-none rounded-2xl bg-white/25 border border-white/40 p-4 text-sm outline-none focus:bg-white/40 transition placeholder:text-muted-foreground/70"
        />
      ) : (
        <div className="h-full rounded-2xl bg-white/20 border border-white/35 p-4 text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap overflow-auto">
          {memo || "No memo yet."}
        </div>
      )}
    </GlassCard>
  );
};