import type { MentalityQuestionDefinition } from "../mentality-types";

export const seriousLongtermMentalityQuestions: MentalityQuestionDefinition[] = [
  {
    id: "serious_pace",
    branch: "serious_longterm",
    questionKey: "serious.pace",
    kind: "single_select",
    label: "Longterm",
    title: "How do you want a serious connection to unfold?",
    description:
      "Your pacing preference helps us avoid matching you with someone who wants the opposite tempo.",
    options: [
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
    ],
    isComplete: (draft) => Boolean(draft.serious.pace),
  },
  {
    id: "serious_priorities",
    branch: "serious_longterm",
    questionKey: "serious.priorities",
    kind: "multi_select",
    label: "Longterm",
    title: "Which qualities matter most in a longterm match?",
    description: "Pick the signals you want our matching system to prioritize earliest.",
    options: [
      {
        value: "emotional maturity",
        title: "emotional maturity",
        copyInactive: "Tap to prioritize this trait.",
        copyActive: "Selected for longterm matching.",
      },
      {
        value: "shared values",
        title: "shared values",
        copyInactive: "Tap to prioritize this trait.",
        copyActive: "Selected for longterm matching.",
      },
      {
        value: "consistency",
        title: "consistency",
        copyInactive: "Tap to prioritize this trait.",
        copyActive: "Selected for longterm matching.",
      },
      {
        value: "good communication",
        title: "good communication",
        copyInactive: "Tap to prioritize this trait.",
        copyActive: "Selected for longterm matching.",
      },
    ],
    isComplete: (draft) => draft.serious.priorities.length > 0,
  },
];
