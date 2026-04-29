import "server-only";

import { getSupabaseAdminClient } from "./admin";
import type { Database } from "./database.types";
import type { AgentThreadKind, AgentThreadRow, MatchRecord } from "./types";

type AgentThreadInsert = Database["public"]["Tables"]["agent_threads"]["Insert"];
type AgentThreadUpdate = Database["public"]["Tables"]["agent_threads"]["Update"];
type UserMatchesInfoRow = Database["public"]["Tables"]["user_matches_info"]["Row"];

function asAgentThreadRow(
  value: Database["public"]["Tables"]["agent_threads"]["Row"] | null,
): AgentThreadRow | null {
  if (!value) {
    return null;
  }

  return value as AgentThreadRow;
}

function asAgentThreadRows(
  value: Database["public"]["Tables"]["agent_threads"]["Row"][] | null,
): AgentThreadRow[] {
  return (value ?? []) as AgentThreadRow[];
}

export async function listThreadsForUser(
  userId: string,
  kind?: AgentThreadKind,
  options?: {
    includeArchived?: boolean;
    archivedOnly?: boolean;
  },
) {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("agent_threads")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (options?.archivedOnly) {
    query = query.not("archived_at", "is", null);
  } else if (!options?.includeArchived) {
    query = query.is("archived_at", null);
  }

  if (kind) {
    query = query.eq("kind", kind);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return asAgentThreadRows(data);
}

export async function getThreadByIdForUser(userId: string, threadId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("agent_threads")
    .select("*")
    .eq("id", threadId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return asAgentThreadRow(data);
}

export async function getThreadByMatchIdForUser(userId: string, matchId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("agent_threads")
    .select("*")
    .eq("user_id", userId)
    .eq("kind", "match")
    .eq("match_id", matchId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return asAgentThreadRow(data);
}

export async function createGeneralThread(userId: string, title?: string | null) {
  const supabase = getSupabaseAdminClient();
  const payload: AgentThreadInsert = {
    user_id: userId,
    kind: "general",
    title: title ?? null,
  };

  const { data, error } = await supabase
    .from("agent_threads")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as AgentThreadRow;
}

async function getAuthorizedMatch(matchId: string, userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("matches")
    .select("id, user1, user2, match_reason, user1_match_status, user2_match_status")
    .eq("id", matchId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const match = (data as MatchRecord | null) ?? null;

  if (!match) {
    throw new Error("Match not found.");
  }

  if (match.user1 !== userId && match.user2 !== userId) {
    throw new Error("You are not allowed to access that match.");
  }

  return match;
}

function getCounterpartyUserId(match: MatchRecord, userId: string) {
  return match.user1 === userId ? match.user2 : match.user1;
}

function formatRelationshipIntent(intent: UserMatchesInfoRow["relationship_intent"]) {
  if (!intent) {
    return null;
  }

  return intent.replace(/_/g, " ");
}

async function buildMatchThreadTitle(match: MatchRecord, userId: string) {
  const counterpartyUserId = getCounterpartyUserId(match, userId);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_matches_info")
    .select("age, relationship_intent, ethnicity")
    .eq("user_id", counterpartyUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const profile = (data as Pick<UserMatchesInfoRow, "age" | "relationship_intent" | "ethnicity"> | null) ?? null;
  const descriptors = [
    profile?.age ? `${profile.age}` : null,
    formatRelationshipIntent(profile?.relationship_intent ?? null),
    profile?.ethnicity ?? null,
  ].filter(Boolean);

  if (descriptors.length === 0) {
    return "Match chat";
  }

  return `Match: ${descriptors.join(" • ")}`;
}

export async function findOrCreateMatchThread(userId: string, matchId: string) {
  const match = await getAuthorizedMatch(matchId, userId);

  const existingThread = await getThreadByMatchIdForUser(userId, matchId);

  if (existingThread) {
    return existingThread;
  }

  const title = await buildMatchThreadTitle(match, userId);
  const supabase = getSupabaseAdminClient();
  const payload: AgentThreadInsert = {
    user_id: userId,
    kind: "match",
    match_id: matchId,
    title,
  };

  const { data, error } = await supabase
    .from("agent_threads")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as AgentThreadRow;
}

export async function updateThreadForUser(
  userId: string,
  threadId: string,
  patch: AgentThreadUpdate,
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("agent_threads")
    .update(patch)
    .eq("id", threadId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as AgentThreadRow;
}

export async function touchThreadAfterMessage(
  userId: string,
  threadId: string,
  latestMessagePreview: string,
) {
  return updateThreadForUser(userId, threadId, {
    latest_message_preview: latestMessagePreview,
    last_message_at: new Date().toISOString(),
  });
}

export async function getAuthorizedMatchContext(matchId: string, userId: string) {
  const match = await getAuthorizedMatch(matchId, userId);
  const counterpartyUserId = getCounterpartyUserId(match, userId);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_matches_info")
    .select("*")
    .eq("user_id", counterpartyUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    match,
    counterparty: (data as UserMatchesInfoRow | null) ?? null,
    counterpartyUserId,
  };
}
