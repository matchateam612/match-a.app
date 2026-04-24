export type RelationshipIntent =
  | "serious_longterm"
  | "casual_shortterm"
  | "open_to_both";

export type MentalityBranch = "shared" | RelationshipIntent;
export type MentalityQuestionId = string;

export type SeriousPaceOption = "slow_and_intentional" | "steady_and_natural" | "ready_to_commit";
export type CasualFrequencyOption = "once_in_a_while" | "regularly" | "depends_on_chemistry";
export type OpenStyleOption = "lean_serious" | "lean_casual" | "adapt_to_connection";

export type MentalitySingleSelectOption = {
  value: string;
  title: string;
  copy: string;
};

export type MentalityMultiSelectOption = {
  value: string;
  title: string;
  copyInactive: string;
  copyActive: string;
};

export type MentalityDraft = {
  relationshipIntent: RelationshipIntent | "";
  serious: {
    answers: Record<string, string>;
  };
  casual: {
    frequency: CasualFrequencyOption | "";
    boundaries: string[];
  };
  open: {
    style: OpenStyleOption | "";
    needsClarity: string[];
  };
};

export type MentalityProgress = {
  branch: RelationshipIntent | "";
  currentStepId: MentalityQuestionId;
  completedStepIds: MentalityQuestionId[];
};

export type MentalityQuestionDefinition = {
  id: MentalityQuestionId;
  branch: MentalityBranch;
  questionKey: string;
  kind: "single_select" | "multi_select";
  label: string;
  title: string;
  description: string;
  options: MentalitySingleSelectOption[] | MentalityMultiSelectOption[];
  isComplete: (draft: MentalityDraft) => boolean;
};

export type MentalityQuestionGroup = {
  branch: MentalityBranch;
  questions: MentalityQuestionDefinition[];
};
