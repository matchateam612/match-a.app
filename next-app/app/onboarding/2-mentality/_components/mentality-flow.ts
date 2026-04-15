import type { MentalityDraft, RelationshipIntent } from "./mentality-types";

export type MentalityStepId =
  | "relationship_intent"
  | "serious_pace"
  | "serious_priorities"
  | "casual_frequency"
  | "casual_boundaries"
  | "open_style"
  | "open_clarity";

export type MentalityStepDefinition = {
  id: MentalityStepId;
  branch: "shared" | RelationshipIntent;
  title: string;
  description: string;
  isComplete: (draft: MentalityDraft) => boolean;
};

const sharedSteps: MentalityStepDefinition[] = [
  {
    id: "relationship_intent",
    branch: "shared",
    title: "What kind of relationship are you looking for?",
    description:
      "Choose the lane that fits best right now. You can go back and change it, and the follow-up questions will adapt.",
    isComplete: (draft) => Boolean(draft.relationshipIntent),
  },
];

const seriousSteps: MentalityStepDefinition[] = [
  {
    id: "serious_pace",
    branch: "serious_longterm",
    title: "How do you want a serious connection to unfold?",
    description: "This helps us weight pacing and early-stage compatibility.",
    isComplete: (draft) => Boolean(draft.serious.pace),
  },
  {
    id: "serious_priorities",
    branch: "serious_longterm",
    title: "Which qualities matter most in a longterm match?",
    description: "Pick at least one priority to guide your longterm recommendations.",
    isComplete: (draft) => draft.serious.priorities.length > 0,
  },
];

const casualSteps: MentalityStepDefinition[] = [
  {
    id: "casual_frequency",
    branch: "casual_shortterm",
    title: "What kind of rhythm feels right for something casual?",
    description: "We use this to avoid matching people with mismatched expectations.",
    isComplete: (draft) => Boolean(draft.casual.frequency),
  },
  {
    id: "casual_boundaries",
    branch: "casual_shortterm",
    title: "What boundaries make casual dating feel good to you?",
    description: "Pick the expectations you want surfaced early.",
    isComplete: (draft) => draft.casual.boundaries.length > 0,
  },
];

const openSteps: MentalityStepDefinition[] = [
  {
    id: "open_style",
    branch: "open_to_both",
    title: "When you say open to both, what does that usually look like?",
    description: "This helps us avoid flattening your intent into a single label.",
    isComplete: (draft) => Boolean(draft.open.style),
  },
  {
    id: "open_clarity",
    branch: "open_to_both",
    title: "What kind of clarity matters most when things could go either way?",
    description: "Pick the signals you want potential matches to share early.",
    isComplete: (draft) => draft.open.needsClarity.length > 0,
  },
];

export function getMentalityFlow(intent: RelationshipIntent | ""): MentalityStepDefinition[] {
  if (intent === "serious_longterm") {
    return [...sharedSteps, ...seriousSteps];
  }

  if (intent === "casual_shortterm") {
    return [...sharedSteps, ...casualSteps];
  }

  if (intent === "open_to_both") {
    return [...sharedSteps, ...openSteps];
  }

  return sharedSteps;
}

export function getFirstBranchStepId(intent: RelationshipIntent): MentalityStepId {
  if (intent === "serious_longterm") {
    return "serious_pace";
  }

  if (intent === "casual_shortterm") {
    return "casual_frequency";
  }

  return "open_style";
}
