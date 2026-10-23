/**
 * Calendar ordering regression checks.
 * English: verifies the same utilities consumed by CalendarWidget and
 * WeekTimeline, without touching the user's localStorage.
 * Korean: 실제 화면이 사용하는 정렬 함수를 직접 검증하며 사용자 저장값은 읽지 않는다.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  normalizeCalendarPriority,
  sortAllDayEvents,
  sortEvents,
} from "../src/components/widgets/calendar/calendarUtils.ts";

const createEvent = (patch = {}) => ({
  id: patch.id ?? "event",
  title: patch.title ?? "Event",
  startDate: patch.startDate ?? "2026-10-20",
  startTime: patch.startTime ?? "09:00",
  endDate: patch.endDate ?? "2026-10-21",
  endTime: patch.endTime ?? "10:00",
  location: "",
  notes: "",
  source: "manual",
  ...patch,
});

test("legacy calendar events default to Normal priority", () => {
  assert.equal(normalizeCalendarPriority(undefined), "medium");
  assert.equal(normalizeCalendarPriority("urgent"), "medium");
});

test("week ordering places higher-priority events first", () => {
  const ordered = sortEvents([
    createEvent({ id: "low", priority: "low" }),
    createEvent({ id: "high", priority: "high" }),
    createEvent({ id: "normal" }),
  ]);

  assert.deepEqual(
    ordered.map((event) => event.id),
    ["high", "normal", "low"]
  );
});

test("all-day ordering uses the closest deadline inside one priority", () => {
  const ordered = sortAllDayEvents([
    createEvent({ id: "later", priority: "high", endDate: "2026-10-29" }),
    createEvent({ id: "normal-sooner", priority: "medium", endDate: "2026-10-22" }),
    createEvent({ id: "sooner", priority: "high", endDate: "2026-10-23" }),
  ]);

  assert.deepEqual(
    ordered.map((event) => event.id),
    ["sooner", "later", "normal-sooner"]
  );
});
