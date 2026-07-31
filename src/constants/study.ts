import type { StudySubject } from "../types/study";

export const defaultStudySubjects: StudySubject[] = [
  {
    id: "actuarial",
    label: "Actuarial Review",
    shortLabel: "Actuarial",
    color: "#78A7D8",
    dailyGoalMinutes: 90,
  },
  {
    id: "soa-fm",
    label: "SOA FM",
    shortLabel: "FM",
    color: "#8C89D6",
    dailyGoalMinutes: 60,
  },
  {
    id: "ncs",
    label: "NCS",
    shortLabel: "NCS",
    color: "#E2A86F",
    dailyGoalMinutes: 60,
  },
  {
    id: "essay",
    label: "Essay / 논술",
    shortLabel: "Essay",
    color: "#D78DA9",
    dailyGoalMinutes: 40,
  },
  {
    id: "english",
    label: "English Speaking",
    shortLabel: "English",
    color: "#79B892",
    dailyGoalMinutes: 30,
  },
];
