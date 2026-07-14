/* Alias file kept on purpose.
   Older imports still point at JournalWidget, but the real implementation
   now lives in DailyJournalWidget so header/layout behavior stays unified. */
export { DailyJournalWidget as JournalWidget } from "./DailyJournalWidget";
