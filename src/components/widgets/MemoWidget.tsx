import { useEffect, useState } from "react";
import { StickyNote } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";

const STORAGE_KEY = "glassday.memo";

export const MemoWidget = () => {
  const [memo, setMemo] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) setMemo(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, memo);
  }, [memo]);

  return (
    <GlassCard
      title="Memo"
      subtitle="Saved locally"
      icon={<StickyNote className="w-4 h-4" />}
    >
      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="Drop a thought before it disappears..."
        className="w-full h-full min-h-28 resize-none rounded-2xl bg-white/30 border border-white/45 p-4 text-sm outline-none focus:bg-white/45 transition placeholder:text-muted-foreground/70"
      />
    </GlassCard>
  );
};