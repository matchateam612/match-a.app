import type {
  CasualFrequencyOption,
  MentalityDraft,
  OpenStyleOption,
  RelationshipIntent,
  SeriousPaceOption,
} from "./mentality-types";

export const USER_INFO_STORAGE_KEY = "user_info";
export const MENTALITY_STEP_STORAGE_KEY = "user_info.mentality.current_step_id";
export const TOTAL_SECTIONS = 4;

export const initialDraft: MentalityDraft = {
  relationshipIntent: "",
  serious: {
    pace: "",
    priorities: [],
  },
  casual: {
    frequency: "",
    boundaries: [],
  },
  open: {
    style: "",
    needsClarity: [],
  },
};

export const initialProgress = {
  branch: "" as RelationshipIntent | "",
  currentStepId: "relationship_intent",
  completedStepIds: [],
};

export const relationshipIntentOptions: Array<{
  value: RelationshipIntent;
  title: string;
  copy: string;
}> = [
  {
    value: "serious_longterm",
    title: "Serious / longterm",
    copy: "Prioritize commitment, long-horizon compatibility, and intentional pacing.",
  },
  {
    value: "casual_shortterm",
    title: "Casual / shortterm",
    copy: "Focus on lightness, chemistry, and clearly communicated expectations.",
  },
  {
    value: "open_to_both",
    title: "Open to both",
    copy: "Stay flexible and let the right connection shape the path forward.",
  },
];

export const seriousPaceOptions: Array<{
  value: SeriousPaceOption;
  title: string;
  copy: string;
}> = [
  {
    value: "slow_and_intentional",
    title: "Slow and intentional",
    copy: "Build trust gradually before deep commitment.",
  },
  {
    value: "steady_and_natural",
    title: "Steady and natural",
    copy: "Let momentum grow organically with consistent effort.",
  },
  {
    value: "ready_to_commit",
    title: "Ready to commit",
    copy: "You are comfortable moving quickly when alignment is strong.",
  },
];

export const casualFrequencyOptions: Array<{
  value: CasualFrequencyOption;
  title: string;
  copy: string;
}> = [
  {
    value: "once_in_a_while",
    title: "Once in a while",
    copy: "Keep things light and low-pressure.",
  },
  {
    value: "regularly",
    title: "Regularly",
    copy: "Make space for consistent fun and connection.",
  },
  {
    value: "depends_on_chemistry",
    title: "Depends on chemistry",
    copy: "Let frequency flex based on the person and energy.",
  },
];

export const openStyleOptions: Array<{
  value: OpenStyleOption;
  title: string;
  copy: string;
}> = [
  {
    value: "lean_serious",
    title: "Usually lean serious",
    copy: "You are open to both, but often hope it grows into something deeper.",
  },
  {
    value: "lean_casual",
    title: "Usually lean casual",
    copy: "You prefer ease and exploration unless something exceptional emerges.",
  },
  {
    value: "adapt_to_connection",
    title: "Adapt to the connection",
    copy: "You want the app to stay responsive to context rather than labels.",
  },
];

export const seriousPriorityOptions = [
  "emotional maturity",
  "shared values",
  "consistency",
  "good communication",
] as const;

export const casualBoundaryOptions = [
  "clear expectations",
  "low pressure",
  "respectful communication",
  "space for independence",
] as const;

export const openClarityOptions = [
  "state intentions early",
  "check in as feelings change",
  "be explicit about exclusivity",
  "leave room for either outcome",
] as const;
