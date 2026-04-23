import { NextResponse } from "next/server";

import { logPictureError } from "@/lib/pictures/picture-logging";
import { getProfilePictureSignedUrl } from "@/lib/pictures/picture-server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser } from "@/lib/supabase/server-auth";
import type { Database } from "@/lib/supabase/database.types";
import type { MatchRecord } from "@/lib/supabase/types";

export const runtime = "nodejs";

type UserMatchesInfoRow = Database["public"]["Tables"]["user_matches_info"]["Row"];

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getCounterpartyUserId(match: MatchRecord, currentUserId: string) {
  return match.user1 === currentUserId ? match.user2 : match.user1;
}

function toStatusLabel(match: MatchRecord) {
  if (match.user1_match_status === 1 && match.user2_match_status === 1) {
    return "Mutual";
  }

  if (match.user1_match_status === 1 || match.user2_match_status === 1) {
    return "Pending";
  }

  return null;
}

function formatRelationshipIntent(intent: UserMatchesInfoRow["relationship_intent"]) {
  if (!intent) {
    return null;
  }

  return intent.replace(/_/g, " ");
}

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("id, user1, user2, match_reason, user1_match_status, user2_match_status")
      .or(`user1.eq.${user.id},user2.eq.${user.id}`)
      .order("id", { ascending: false });

    if (matchesError) {
      throw matchesError;
    }

    const matchRows = (matches ?? []) as MatchRecord[];
    const targetUserIds = Array.from(
      new Set(matchRows.map((match) => getCounterpartyUserId(match, user.id))),
    );

    const { data: profiles, error: profilesError } =
      targetUserIds.length > 0
        ? await supabase
            .from("user_matches_info")
            .select(
              "user_id, age, gender_identity, interested_in, ethnicity, relationship_intent, mentality_summary, agent_summary, profile_picture_path, visible_payload, updated_at",
            )
            .in("user_id", targetUserIds)
        : { data: [], error: null };

    if (profilesError) {
      throw profilesError;
    }

    const profilesByUserId = new Map(
      ((profiles ?? []) as UserMatchesInfoRow[]).map((profile) => [
        profile.user_id,
        profile,
      ]),
    );

    const threads = await Promise.all(
      matchRows.map(async (match, index) => {
        const targetUserId = getCounterpartyUserId(match, user.id);
        const profile = profilesByUserId.get(targetUserId) ?? null;
        let profilePictureUrl: string | null = null;

        try {
          profilePictureUrl = (await getProfilePictureSignedUrl(targetUserId)).signedUrl;
        } catch (error) {
          logPictureError("Failed to sign matched thread profile picture.", error, {
            requesterUserId: user.id,
            matchId: match.id,
            targetUserId,
          });
        }

        return {
          id: match.id,
          label: `Match ${index + 1}`,
          targetUserId,
          age: profile?.age ?? null,
          genderIdentity: profile?.gender_identity ?? null,
          interestedIn: profile?.interested_in ?? null,
          ethnicity: profile?.ethnicity ?? null,
          relationshipIntent: formatRelationshipIntent(profile?.relationship_intent ?? null),
          mentalitySummary: profile?.mentality_summary ?? null,
          agentSummary: profile?.agent_summary ?? null,
          matchReason: match.match_reason,
          profilePictureUrl,
          statusLabel: toStatusLabel(match),
          unread: true,
        };
      }),
    );

    return NextResponse.json({ threads });
  } catch (error) {
    logPictureError("Matched thread request failed.", error);

    return jsonError(
      error instanceof Error && error.message
        ? error.message
        : "We couldn't load your matches right now.",
      500,
    );
  }
}
