export type RelationshipIntent =
  | "serious_longterm"
  | "casual_shortterm"
  | "open_to_both";

export type SeriousPaceOption = "slow_and_intentional" | "steady_and_natural" | "ready_to_commit";
export type CasualFrequencyOption = "once_in_a_while" | "regularly" | "depends_on_chemistry";
export type OpenStyleOption = "lean_serious" | "lean_casual" | "adapt_to_connection";

export type MentalityDraft = {
  relationshipIntent: RelationshipIntent | "";
  serious: {
    pace: SeriousPaceOption | "";
    priorities: string[];
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
  currentStepId: string;
  completedStepIds: string[];
};
