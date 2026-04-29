import "server-only";

import { getSupabaseAdminClient } from "./admin";
import type { Database, Json } from "./database.types";
import type {
  AgentMessageRole,
  AgentMessageRow,
  AgentMessageStatus,
} from "./types";

type AgentMessageInsert = Database["public"]["Tables"]["agent_messages"]["Insert"];

function asAgentMessageRows(
  value: Database["public"]["Tables"]["agent_messages"]["Row"][] | null,
): AgentMessageRow[] {
  return (value ?? []) as AgentMessageRow[];
}

function asAgentMessageRow(
  value: Database["public"]["Tables"]["agent_messages"]["Row"] | null,
): AgentMessageRow | null {
  if (!value) {
    return null;
  }

  return value as AgentMessageRow;
}

function toJsonValue(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? {})) as Json;
}

export async function listMessagesForThread(userId: string, threadId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("agent_messages")
    .select("*")
    .eq("user_id", userId)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return asAgentMessageRows(data);
}

export async function createMessage(args: {
  threadId: string;
  userId: string;
  role: AgentMessageRole;
  content: string;
  status?: AgentMessageStatus;
  metadata?: Record<string, unknown> | null;
}) {
  const supabase = getSupabaseAdminClient();
  const payload: AgentMessageInsert = {
    thread_id: args.threadId,
    user_id: args.userId,
    role: args.role,
    content: args.content,
    status: args.status ?? "completed",
    metadata: toJsonValue(args.metadata ?? {}),
  };

  const { data, error } = await supabase
    .from("agent_messages")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as AgentMessageRow;
}

export async function createUserMessage(
  threadId: string,
  userId: string,
  content: string,
  metadata?: Record<string, unknown> | null,
) {
  return createMessage({
    threadId,
    userId,
    role: "user",
    content,
    metadata,
  });
}

export async function createAssistantMessage(
  threadId: string,
  userId: string,
  content: string,
  metadata?: Record<string, unknown> | null,
) {
  return createMessage({
    threadId,
    userId,
    role: "assistant",
    content,
    metadata,
  });
}

export async function markMessageStatus(
  userId: string,
  messageId: string,
  status: AgentMessageStatus,
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("agent_messages")
    .update({ status })
    .eq("id", messageId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return asAgentMessageRow(data);
}
