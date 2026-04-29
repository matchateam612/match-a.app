import { NextResponse } from "next/server";

import { listMessagesForThread } from "@/lib/supabase/agent-messages";
import {
  findOrCreateMatchThread,
  getAuthorizedMatchContext,
} from "@/lib/supabase/agent-threads";
import { requireAuthenticatedUser } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type DashboardMatchThreadRouteProps = {
  params: Promise<{
    matchId: string;
  }>;
};

export async function GET(request: Request, { params }: DashboardMatchThreadRouteProps) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { matchId } = await params;
    const [thread, matchContext] = await Promise.all([
      findOrCreateMatchThread(user.id, matchId),
      getAuthorizedMatchContext(matchId, user.id),
    ]);
    const messages = await listMessagesForThread(user.id, thread.id);

    return NextResponse.json({
      thread,
      messages,
      matchContext,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "We couldn't load that match chat right now.",
      500,
    );
  }
}
