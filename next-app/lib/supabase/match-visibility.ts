import "server-only";

import { getSupabaseAdminClient } from "./admin";
import type { MatchRecord } from "./types";

async function getMatchById(matchId: string): Promise<MatchRecord | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("matches")
    .select("id, user1, user2, match_reason, user1_match_status, user2_match_status")
    .eq("id", matchId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as MatchRecord | null) ?? null;
}

function isMatchParticipant(match: MatchRecord, userId: string) {
  return match.user1 === userId || match.user2 === userId;
}

function getCounterpartyUserId(match: MatchRecord, userId: string) {
  return match.user1 === userId ? match.user2 : match.user1;
}

export async function getAuthorizedMatchedProfilePictureUserId(
  matchId: string,
  requesterUserId: string,
) {
  const match = await getMatchById(matchId);

  if (!match) {
    throw new Error("Match not found.");
  }

  if (!isMatchParticipant(match, requesterUserId)) {
    throw new Error("You are not allowed to view that profile picture.");
  }

  return getCounterpartyUserId(match, requesterUserId);
}

export async function getAuthorizedMatchedGalleryUserId(
  matchId: string,
  requesterUserId: string,
) {
  const match = await getMatchById(matchId);

  if (!match) {
    throw new Error("Match not found.");
  }

  if (!isMatchParticipant(match, requesterUserId)) {
    throw new Error("You are not allowed to view that gallery.");
  }

  if (match.user1_match_status !== 1 || match.user2_match_status !== 1) {
    throw new Error("Only mutual matches can view private gallery photos.");
  }

  return getCounterpartyUserId(match, requesterUserId);
}
