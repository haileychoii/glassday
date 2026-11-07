/**
 * ============================================================
 * [Diary] Responsive free-layout canvas / 반응형 자유 배치 캔버스
 * ============================================================
 * Parent: src/components/diary/DiaryWorkspace.tsx
 * Child: src/components/diary/DiaryItem.tsx
 *
 * Items are stored in a 1000 x 700 logical coordinate system from
 * src/types/diary.ts, then rendered as percentages. / 창 크기가 달라져도
 * 사진과 글의 상대 위치가 유지되도록 저장 좌표를 비율로 변환한다.
 * ============================================================
 */
import { useMemo, useRef } from "react";

import type { DiaryItem as DiaryItemModel } from "../../types/diary";
import { DiaryItem } from "./DiaryItem";

type DiaryPageProps = {
  items: DiaryItemModel[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string | null) => void;
  onChangeItem: (itemId: string, patch: Partial<DiaryItemModel>) => void;
  onBringToFront: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
};

export const DiaryPage = ({
  items,
  selectedItemId,
  onSelectItem,
  onChangeItem,
  onBringToFront,
  onRemoveItem,
}: DiaryPageProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const orderedItems = useMemo(
    () => [...items].sort((left, right) => left.zIndex - right.zIndex),
    [items]
  );

  return (
    <div className="diary-page-frame">
      <div
        ref={canvasRef}
        className="diary-page-canvas"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            onSelectItem(null);
          }
        }}
        aria-label="Diary page"
      >
        {orderedItems.map((item) => (
          <DiaryItem
            key={item.id}
            item={item}
            selected={selectedItemId === item.id}
            canvasRef={canvasRef}
            onSelect={onSelectItem}
            onChange={onChangeItem}
            onBringToFront={onBringToFront}
            onRemove={onRemoveItem}
          />
        ))}
      </div>
    </div>
  );
};
