import type { MentalityQuestionDefinition } from "../mentality-types";

export const casualShorttermMentalityQuestions: MentalityQuestionDefinition[] = [
  {
    id: "casual_frequency",
    branch: "casual_shortterm",
    questionKey: "casual.frequency",
    kind: "single_select",
    label: "Shortterm",
    title: "What kind of rhythm feels right for something casual?",
    description: "Frequency matters because casual does not mean the same thing to everyone.",
    options: [
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
    ],
    isComplete: (draft) => Boolean(draft.casual.frequency),
  },
  {
    id: "casual_boundaries",
    branch: "casual_shortterm",
    questionKey: "casual.boundaries",
    kind: "multi_select",
    label: "Shortterm",
    title: "What boundaries make casual dating feel good to you?",
    description: "These preferences help surface respectful, expectation-aligned matches earlier.",
    options: [
      {
        value: "clear expectations",
        title: "clear expectations",
        copyInactive: "Tap to add this boundary.",
        copyActive: "Selected as an early expectation.",
      },
      {
        value: "low pressure",
        title: "low pressure",
        copyInactive: "Tap to add this boundary.",
        copyActive: "Selected as an early expectation.",
      },
      {
        value: "respectful communication",
        title: "respectful communication",
        copyInactive: "Tap to add this boundary.",
        copyActive: "Selected as an early expectation.",
      },
      {
        value: "space for independence",
        title: "space for independence",
        copyInactive: "Tap to add this boundary.",
        copyActive: "Selected as an early expectation.",
      },
    ],
    isComplete: (draft) => draft.casual.boundaries.length > 0,
  },
];
