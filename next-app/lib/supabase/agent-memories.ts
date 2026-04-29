import "server-only";

import { getSupabaseAdminClient } from "./admin";
import type { Database, Json } from "./database.types";
import type { AgentMemoryRow, AgentMemoryStatus } from "./types";

type AgentMemoryInsert = Database["public"]["Tables"]["agent_memories"]["Insert"];
type AgentMemoryUpdate = Database["public"]["Tables"]["agent_memories"]["Update"];

function asAgentMemoryRows(
  value: Database["public"]["Tables"]["agent_memories"]["Row"][] | null,
): AgentMemoryRow[] {
  return (value ?? []) as AgentMemoryRow[];
}

function asAgentMemoryRow(
  value: Database["public"]["Tables"]["agent_memories"]["Row"] | null,
): AgentMemoryRow | null {
  if (!value) {
    return null;
  }

  return value as AgentMemoryRow;
}

function toJsonValue(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? {})) as Json;
}

export async function listMemoriesForUser(
  userId: string,
  status: AgentMemoryStatus | "all" = "active",
) {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("agent_memories")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return asAgentMemoryRows(data);
}

export async function createMemory(args: {
  userId: string;
  kind: string;
  content: string;
  sourceThreadId?: string | null;
  sourceMessageId?: string | null;
  confidence?: number | null;
  status?: AgentMemoryStatus;
  metadata?: Record<string, unknown> | null;
}) {
  const supabase = getSupabaseAdminClient();
  const payload: AgentMemoryInsert = {
    user_id: args.userId,
    kind: args.kind,
    content: args.content,
    source_thread_id: args.sourceThreadId ?? null,
    source_message_id: args.sourceMessageId ?? null,
    confidence: args.confidence ?? null,
    status: args.status ?? "active",
    metadata: toJsonValue(args.metadata ?? {}),
  };

  const { data, error } = await supabase
    .from("agent_memories")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as AgentMemoryRow;
}

export async function updateMemoryForUser(
  userId: string,
  memoryId: string,
  patch: AgentMemoryUpdate,
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("agent_memories")
    .update(patch)
    .eq("id", memoryId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return asAgentMemoryRow(data);
}

export async function deleteMemoryForUser(userId: string, memoryId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("agent_memories")
    .delete()
    .eq("id", memoryId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
