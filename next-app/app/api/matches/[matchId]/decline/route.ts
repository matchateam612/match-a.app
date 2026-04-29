import { NextResponse } from "next/server";

import { upsertDeclineState } from "@/lib/supabase/match-user-actions";
import { requireAuthenticatedUser } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type RequestBody = {
  declined?: boolean;
  reason?: string;
};

type MatchDeclineRouteProps = {
  params: Promise<{
    matchId: string;
  }>;
};

export async function POST(request: Request, { params }: MatchDeclineRouteProps) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { matchId } = await params;
    const body = (await request.json().catch(() => null)) as RequestBody | null;

    if (typeof body?.declined !== "boolean") {
      return jsonError("A declined flag is required.");
    }

    if (body.declined && (!body.reason || !body.reason.trim())) {
      return jsonError("Please share why this user does not feel like the right fit.");
    }

    const action = await upsertDeclineState(matchId, user.id, {
      declined: body.declined,
      reason: body.reason ?? null,
    });

    return NextResponse.json({
      declined: action?.declined ?? false,
      declineReason: action?.decline_reason ?? null,
      sharedContactType: action?.shared_contact_type ?? null,
      sharedContactValue: action?.shared_contact_value ?? null,
      hasSharedContact: Boolean(action?.shared_contact_type && action?.shared_contact_value),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "We couldn't update that match right now.",
      500,
    );
  }
}
