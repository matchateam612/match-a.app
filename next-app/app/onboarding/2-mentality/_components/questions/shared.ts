import type { MentalityQuestionDefinition } from "../mentality-types";

export const sharedMentalityQuestions: MentalityQuestionDefinition[] = [
  {
    id: "relationship_intent",
    branch: "shared",
    questionKey: "relationshipIntent",
    kind: "single_select",
    label: "Intent",
    title: "What kind of relationship are you looking for?",
    description:
      "This choice determines the rest of this section, so we tailor the follow-up questions to what you actually want.",
    options: [
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
    ],
    isComplete: (draft) => Boolean(draft.relationshipIntent),
  },
];
