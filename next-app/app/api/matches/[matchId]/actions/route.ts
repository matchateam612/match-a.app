import { NextResponse } from "next/server";

import { getMatchUserAction } from "@/lib/supabase/match-user-actions";
import { requireAuthenticatedUser } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type MatchActionsRouteProps = {
  params: Promise<{
    matchId: string;
  }>;
};

export async function GET(request: Request, { params }: MatchActionsRouteProps) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { matchId } = await params;
    const action = await getMatchUserAction(matchId, user.id);

    return NextResponse.json({
      declined: action?.declined ?? false,
      declineReason: action?.decline_reason ?? null,
      sharedContactType: action?.shared_contact_type ?? null,
      sharedContactValue: action?.shared_contact_value ?? null,
      hasSharedContact: Boolean(action?.shared_contact_type && action?.shared_contact_value),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "We couldn't load that match state right now.",
      500,
    );
  }
}
