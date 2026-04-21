import type { MatchRecord } from "@/lib/supabase/types";

import type { RippleCard } from "./ripple-types";

function toStatusLabel(match: MatchRecord) {
  if (match.user1_match_status === 1 && match.user2_match_status === 1) {
    return "Mutual";
  }

  if (match.user1_match_status === 1 || match.user2_match_status === 1) {
    return "Pending";
  }

  return null;
}

export function mapMatchesToRippleCards(matches: MatchRecord[], currentUserId: string): RippleCard[] {
  return matches.map((match) => ({
    id: match.id,
    label: "Potential Ripple",
    match_reason: match.match_reason,
    statusLabel: toStatusLabel(match),
    profilePictureUrl: null,
    targetUserId: match.user1 === currentUserId ? match.user2 : match.user1,
    userIds: [match.user1, match.user2],
  }));
}
