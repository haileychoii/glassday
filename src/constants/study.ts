import type { StudySubject } from "../types/study";

export const defaultStudySubjects: StudySubject[] = [
  {
    id: "actuarial",
    label: "Actuarial Review",
    shortLabel: "Actuarial",
    color: "#DCEBFF",
    dailyGoalMinutes: 90,
  },
  {
    id: "soa-fm",
    label: "SOA FM",
    shortLabel: "FM",
    color: "#E3E5FF",
    dailyGoalMinutes: 60,
  },
  {
    id: "ncs",
    label: "NCS",
    shortLabel: "NCS",
    color: "#FFEBD8",
    dailyGoalMinutes: 60,
  },
  {
    id: "essay",
    label: "Essay / 논술",
    shortLabel: "Essay",
    color: "#FFE3F1",
    dailyGoalMinutes: 40,
  },
  {
    id: "english",
    label: "English Speaking",
    shortLabel: "English",
    color: "#DDF7EA",
    dailyGoalMinutes: 30,
  },
];