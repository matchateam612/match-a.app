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

export function mapMatchesToRippleCards(matches: MatchRecord[]): RippleCard[] {
  return matches.map((match) => ({
    id: match.id,
    label: "Potential Ripple",
    match_reason: match.match_reason,
    statusLabel: toStatusLabel(match),
    userIds: [match.user1, match.user2],
  }));
}
