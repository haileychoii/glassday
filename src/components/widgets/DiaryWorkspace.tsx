/**
 * GLASSDAY - DIARY WORKSPACE
 *
 * EN: A focused diary canvas that reuses the existing Journal and Memo widgets.
 * KO: 기존 Journal/Memo 위젯을 재사용해 Diary 탭을 한 화면 작업공간으로 만든다.
 *
 * Related files:
 * - DailyJournalWidget.tsx: date-based journal data and editing
 * - MemoWidget.tsx: memo editor and note storage
 * - WidgetSlot.tsx: keeps one shared widget instance alive
 * - diary-workspace.css: this workspace's placement and visual treatment
 *
 * This component owns placement only. Existing widgets still own their data
 * and storage, so moving into Diary does not duplicate or reset user content.
 */
import { CalendarDays, NotebookPen, Sparkles } from "lucide-react";

import { WidgetSlot } from "./WidgetSlot";

/** Diary uses one main journal column and one quick-capture memo column. */
export const DiaryWorkspace = () => {
  return (
    <section className="diary-workspace" aria-label="Diary workspace">
      <header className="diary-workspace__header">
        <div className="diary-workspace__heading">
          <span className="diary-workspace__eyebrow">
            <Sparkles aria-hidden="true" /> Diary workspace
          </span>
          <h2>오늘을 기록하고 배치해</h2>
          <p>일기와 메모를 한 화면에서 정리해 보세요.</p>
        </div>

        <div className="diary-workspace__status" aria-label="Diary tools">
          <span>
            <CalendarDays aria-hidden="true" /> 날짜별 기록
          </span>
          <span>
            <NotebookPen aria-hidden="true" /> 빠른 메모
          </span>
        </div>
      </header>

      <div className="diary-workspace__canvas">
        <section
          className="diary-workspace__slot diary-workspace__slot--journal"
          aria-label="Daily journal"
        >
          <WidgetSlot widgetId="journal" />
        </section>

        <aside className="diary-workspace__side" aria-label="Diary side tools">
          <section className="diary-workspace__slot diary-workspace__slot--memo">
            <WidgetSlot widgetId="memo" />
          </section>

          <div className="diary-workspace__tip">
            <strong>작게 기록해도 괜찮아요</strong>
            <span>메모는 나중에 일기 소재로 다시 꺼내 쓸 수 있어요.</span>
          </div>
        </aside>
      </div>
    </section>
  );
};

