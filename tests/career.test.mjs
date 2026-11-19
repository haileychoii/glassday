import assert from "node:assert/strict";
import test from "node:test";

import {
  getCareerCardSchedules,
  normalizeCareerPostingUrl,
} from "../src/components/widgets/career/careerCardUtils.ts";

const baseCareer = {
  id: "career-test",
  company: "Test Bank",
  role: "Analyst",
  status: "Preparing",
  location: "",
  workType: "",
  deadline: "",
  applicationStartDate: "",
  applicationStartTime: "09:00",
  applicationEndDate: "",
  applicationEndTime: "23:59",
  postingUrl: "",
  jobDescription: "",
  coverLetterQuestions: [],
  notes: "",
};

test("range schedules use the end date as the actionable deadline", () => {
  const schedules = getCareerCardSchedules(
    {
      ...baseCareer,
      stages: [
        {
          id: "document-window",
          label: "서류 제출",
          status: "doing",
          kind: "document-submit",
          dateMode: "range",
          date: "2026-10-01",
          endDate: "2026-10-30",
        },
      ],
    },
    "2026-10-21"
  );

  assert.equal(schedules[0].date, "2026-10-30");
  assert.equal(schedules[0].dday, 9);
  assert.equal(schedules[0].label, "서류 제출 마감");
});

test("legacy application end date remains visible when stages are empty", () => {
  const schedules = getCareerCardSchedules(
    {
      ...baseCareer,
      applicationEndDate: "2026-10-30",
      stages: [],
    },
    "2026-10-21"
  );

  assert.deepEqual(schedules[0], {
    label: "서류 제출 마감",
    date: "2026-10-30",
    dday: 9,
  });
});

test("posting URLs gain https while unsafe protocols are rejected", () => {
  assert.equal(
    normalizeCareerPostingUrl("jobs.example.com/posting/7"),
    "https://jobs.example.com/posting/7"
  );
  assert.equal(normalizeCareerPostingUrl("javascript:alert(1)"), null);
});
