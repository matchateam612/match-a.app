import { getSupabaseBrowserClient } from "./client";
import type { MatchRecord } from "./types";

export async function listMatchesForUser(userId: string) {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("matches")
    .select("id, user1, user2, match_reason, user1_match_status, user2_match_status")
    .or(`user1.eq.${userId},user2.eq.${userId}`);

  if (error) {
    throw error;
  }

  return (data ?? []) as MatchRecord[];
}
