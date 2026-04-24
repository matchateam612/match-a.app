import type { MentalityQuestionDefinition } from "../mentality-types";

export const openToBothMentalityQuestions: MentalityQuestionDefinition[] = [
  {
    id: "open_style",
    branch: "open_to_both",
    questionKey: "open.style",
    kind: "single_select",
    label: "Open to both",
    title: "When you say open to both, what does that usually look like?",
    description:
      "This lets us preserve nuance instead of flattening you into a single intent bucket.",
    options: [
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
    ],
    isComplete: (draft) => Boolean(draft.open.style),
  },
  {
    id: "open_clarity",
    branch: "open_to_both",
    questionKey: "open.needsClarity",
    kind: "multi_select",
    label: "Open to both",
    title: "What kind of clarity matters most when things could go either way?",
    description:
      "Pick the communication signals you want surfaced before ambiguity turns into mismatch.",
    options: [
      {
        value: "state intentions early",
        title: "state intentions early",
        copyInactive: "Tap to add this expectation.",
        copyActive: "Selected as a preferred signal.",
      },
      {
        value: "check in as feelings change",
        title: "check in as feelings change",
        copyInactive: "Tap to add this expectation.",
        copyActive: "Selected as a preferred signal.",
      },
      {
        value: "be explicit about exclusivity",
        title: "be explicit about exclusivity",
        copyInactive: "Tap to add this expectation.",
        copyActive: "Selected as a preferred signal.",
      },
      {
        value: "leave room for either outcome",
        title: "leave room for either outcome",
        copyInactive: "Tap to add this expectation.",
        copyActive: "Selected as a preferred signal.",
      },
    ],
    isComplete: (draft) => draft.open.needsClarity.length > 0,
  },
];
