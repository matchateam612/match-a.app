import "server-only";

import { getSupabaseAdminClient } from "./admin";
import type { Database } from "./database.types";
import type { MatchRecord, MatchUserActionRow, SharedContactType } from "./types";

type MatchUserActionInsert = Database["public"]["Tables"]["match_user_actions"]["Insert"];
type MatchUserActionUpdate = Database["public"]["Tables"]["match_user_actions"]["Update"];

function asMatchUserActionRow(
  value: Database["public"]["Tables"]["match_user_actions"]["Row"] | null,
) {
  return (value ?? null) as MatchUserActionRow | null;
}

function asMatchUserActionRows(
  value: Database["public"]["Tables"]["match_user_actions"]["Row"][] | null,
) {
  return (value ?? []) as MatchUserActionRow[];
}

export function formatSharedContactType(type: SharedContactType) {
  switch (type) {
    case "phone":
      return "phone";
    case "whatsapp":
      return "WhatsApp";
    case "instagram":
      return "Instagram";
    case "wechat":
      return "WeChat";
    default:
      return type;
  }
}

export async function getAuthorizedMatchForUser(matchId: string, userId: string) {
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

export async function getMatchUserAction(matchId: string, userId: string) {
  await getAuthorizedMatchForUser(matchId, userId);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("match_user_actions")
    .select("*")
    .eq("match_id", matchId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return asMatchUserActionRow(data);
}

export async function listMatchUserActionsForUser(matchIds: string[], userId: string) {
  if (matchIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("match_user_actions")
    .select("*")
    .eq("user_id", userId)
    .in("match_id", matchIds);

  if (error) {
    throw error;
  }

  return asMatchUserActionRows(data);
}

async function upsertMatchUserAction(payload: MatchUserActionInsert) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("match_user_actions")
    .upsert(payload, {
      onConflict: "match_id,user_id",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as MatchUserActionRow;
}

export async function updateMatchUserAction(
  matchId: string,
  userId: string,
  patch: MatchUserActionUpdate,
) {
  await getAuthorizedMatchForUser(matchId, userId);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("match_user_actions")
    .update(patch)
    .eq("match_id", matchId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return asMatchUserActionRow(data);
}

export async function upsertDeclineState(
  matchId: string,
  userId: string,
  args: {
    declined: boolean;
    reason?: string | null;
  },
) {
  await getAuthorizedMatchForUser(matchId, userId);

  const existing = await getMatchUserAction(matchId, userId);

  if (existing) {
    return updateMatchUserAction(matchId, userId, {
      declined: args.declined,
      decline_reason: args.declined ? args.reason?.trim() ?? null : existing.decline_reason,
    });
  }

  return upsertMatchUserAction({
    match_id: matchId,
    user_id: userId,
    declined: args.declined,
    decline_reason: args.declined ? args.reason?.trim() ?? null : null,
  });
}

export async function upsertSharedContact(
  matchId: string,
  userId: string,
  args: {
    type: SharedContactType;
    value: string;
  },
) {
  await getAuthorizedMatchForUser(matchId, userId);

  const existing = await getMatchUserAction(matchId, userId);
  const now = new Date().toISOString();

  if (existing) {
    return updateMatchUserAction(matchId, userId, {
      shared_contact_type: args.type,
      shared_contact_value: args.value.trim(),
      contact_shared_at: existing.contact_shared_at ?? now,
    });
  }

  return upsertMatchUserAction({
    match_id: matchId,
    user_id: userId,
    shared_contact_type: args.type,
    shared_contact_value: args.value.trim(),
    contact_shared_at: now,
  });
}

export async function getMatchUserActionsForBothUsers(matchId: string, userId: string) {
  const match = await getAuthorizedMatchForUser(matchId, userId);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("match_user_actions")
    .select("*")
    .eq("match_id", matchId)
    .in("user_id", [match.user1, match.user2]);

  if (error) {
    throw error;
  }

  const actions = asMatchUserActionRows(data);
  const byUserId = new Map(actions.map((action) => [action.user_id, action]));

  return {
    match,
    currentUserAction: byUserId.get(userId) ?? null,
    otherUserAction: byUserId.get(match.user1 === userId ? match.user2 : match.user1) ?? null,
  };
}
