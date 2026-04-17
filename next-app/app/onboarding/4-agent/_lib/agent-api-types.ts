import type {
  AgentConversationMode,
  AgentCriterionDefinition,
  AgentCriterionState,
  AgentTranscriptItem,
} from "./agent-types";

export type SubmitAgentTurnRequest = {
  selectedMode: AgentConversationMode;
  userMessage: string;
  transcript: AgentTranscriptItem[];
  criteriaDefinitions: AgentCriterionDefinition[];
  criteria: AgentCriterionState[];
  interviewerSystemPrompt: string;
};

export type SubmitAgentTurnResponse = {
  criteria: AgentCriterionState[];
  assistantMessage: string;
  draftSummary: string;
  status: "collecting" | "confirming" | "complete";
  lastAskedCriterionId: string | null;
  extractorRawOutput: string;
};
