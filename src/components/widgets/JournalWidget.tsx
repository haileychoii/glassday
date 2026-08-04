/**
 * ============================================================
 * [Compatibility Alias] JournalWidget -> DailyJournalWidget
 * ============================================================
 *
 * 현재 실제 UI/Style/Data 구현은 src/components/widgets/DailyJournalWidget.tsx에 있다.
 * 이전 import 경로 호환을 위해 export 이름만 유지하며 별도 Figma Component가 아니다.
 * Header/Layout을 수정할 때 이 파일이 아니라 DailyJournalWidget과 journal.css를 확인한다.
 * ============================================================
 */
export { DailyJournalWidget as JournalWidget } from "./DailyJournalWidget";
