import type {
  AgentConversationMode,
  AgentCriterionDefinition,
  AgentCriterionState,
  AgentTranscriptItem,
} from "./agent-types";
import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";

export type SubmitAgentTurnRequest = {
  selectedMode: AgentConversationMode;
  userMessage: string;
  transcript: AgentTranscriptItem[];
  criteriaDefinitions: AgentCriterionDefinition[];
  criteria: AgentCriterionState[];
  interviewerSystemPrompt: string;
};

export type ResolveAgentTurnExtractionResponse = {
  criteria: AgentCriterionState[];
  draftSummary: string;
  status: "collecting" | "confirming" | "complete";
  lastAskedCriterionId: string | null;
  extractorRawOutput: string;
};

export type CreateInitialAgentTurnRequest = {
  selectedMode: AgentConversationMode;
  criteriaDefinitions: AgentCriterionDefinition[];
  criteria: AgentCriterionState[];
  interviewerSystemPrompt: string;
  userInfo: UserInfo;
};

export type SubmitAgentTurnResponse = {
  criteria: AgentCriterionState[];
  assistantMessage: string;
  draftSummary: string;
  status: "collecting" | "confirming" | "complete";
  lastAskedCriterionId: string | null;
  extractorRawOutput: string;
};

export type CreateInitialAgentTurnResponse = {
  criteria: AgentCriterionState[];
  assistantMessage: string;
  draftSummary: string;
  status: "collecting" | "confirming" | "complete";
  lastAskedCriterionId: string | null;
};

export type CreateVoiceTurnContextResponse = {
  instructions: string;
  inputText: string;
  draftSummary: string;
  status: "collecting" | "confirming" | "complete";
  lastAskedCriterionId: string | null;
};

export type CreateInitialVoiceTurnContextRequest = {
  selectedMode: AgentConversationMode;
  criteriaDefinitions: AgentCriterionDefinition[];
  criteria: AgentCriterionState[];
  interviewerSystemPrompt: string;
  userInfo: UserInfo;
};
