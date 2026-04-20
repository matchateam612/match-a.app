import type { AgentCriterionDefinition, AgentCriterionState, AgentTranscriptItem } from "./agent-types";

export type CreateRealtimeSessionResponse = {
  client_secret?: {
    value?: string;
  };
  id?: string;
};

export type VoiceTurnRequest = {
  transcript: AgentTranscriptItem[];
  criteriaDefinitions: AgentCriterionDefinition[];
  criteria: AgentCriterionState[];
  interviewerSystemPrompt: string;
  userMessage: string;
};
