import type {
  MentalityDraft,
  MentalityProgress,
  RelationshipIntent,
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

export const initialProgress: MentalityProgress = {
  branch: "" as RelationshipIntent | "",
  currentStepId: "relationship_intent",
  completedStepIds: [],
};
