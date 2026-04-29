export type MatchStatus = 0 | 1;
export type AgentThreadKind = "general" | "match";
export type AgentMessageRole = "user" | "assistant" | "system";
export type AgentMessageStatus = "pending" | "completed" | "failed";
export type AgentMemoryStatus = "active" | "discarded" | "superseded";

export type MatchRecord = {
  id: string;
  user1: string;
  user2: string;
  match_reason: string | null;
  user1_match_status: MatchStatus;
  user2_match_status: MatchStatus;
};

export type AgentThreadRow = {
  id: string;
  user_id: string;
  kind: AgentThreadKind;
  match_id: string | null;
  title: string | null;
  latest_message_preview: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  archived_at: string | null;
  summary: string | null;
  summary_updated_at: string | null;
  metadata: unknown;
};

export type AgentMessageRow = {
  id: string;
  thread_id: string;
  user_id: string;
  role: AgentMessageRole;
  content: string;
  status: AgentMessageStatus;
  created_at: string;
  metadata: unknown;
};

export type AgentMemoryRow = {
  id: string;
  user_id: string;
  source_thread_id: string | null;
  source_message_id: string | null;
  kind: string;
  content: string;
  confidence: number | null;
  status: AgentMemoryStatus;
  created_at: string;
  updated_at: string;
  metadata: unknown;
};

export type EmailPasswordAuthPayload = {
  email: string;
  password: string;
};
