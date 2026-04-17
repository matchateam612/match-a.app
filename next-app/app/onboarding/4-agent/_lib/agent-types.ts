export type AgentConversationMode = "text" | "voice";

export type AgentCriterionDefinition = {
  id: string;
  label: string;
  description: string;
  required?: boolean;
  placeholderSummary?: string;
};

export type AgentCriterionStatus = "missing" | "tentative" | "confirmed";

export type AgentCriterionState = {
  id: string;
  label: string;
  description: string;
  required: boolean;
  summary: string | null;
  structuredValue: unknown;
  confidence: number;
  status: AgentCriterionStatus;
  source: "explicit" | "inferred" | "unknown";
  evidence: string[];
  needsConfirmation: boolean;
  updatedAt: string | null;
};

export type AgentTranscriptItem = {
  id: string;
  role: "assistant" | "user" | "system";
  modality: "text" | "voice";
  text: string;
  createdAt: string;
};

export type AgentConversationStatus = "collecting" | "confirming" | "complete";

export type AgentOnboardingState = {
  sessionId: string;
  selectedMode: AgentConversationMode | null;
  turnCount: number;
  status: AgentConversationStatus;
  lastAskedCriterionId: string | null;
  criteria: AgentCriterionState[];
  transcript: AgentTranscriptItem[];
  finalSummary: string | null;
  completedAt: string | null;
};

export type AgentPromptSettings = {
  interviewerSystemPrompt: string;
};
