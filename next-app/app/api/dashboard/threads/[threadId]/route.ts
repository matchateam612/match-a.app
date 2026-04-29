import { NextResponse } from "next/server";

import { listMessagesForThread } from "@/lib/supabase/agent-messages";
import { getThreadByIdForUser } from "@/lib/supabase/agent-threads";
import { requireAuthenticatedUser } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type DashboardThreadRouteProps = {
  params: Promise<{
    threadId: string;
  }>;
};

export async function GET(request: Request, { params }: DashboardThreadRouteProps) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { threadId } = await params;
    const thread = await getThreadByIdForUser(user.id, threadId);

    if (!thread) {
      return jsonError("Thread not found.", 404);
    }

    const messages = await listMessagesForThread(user.id, thread.id);

    return NextResponse.json({ thread, messages });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "We couldn't load that thread right now.",
      500,
    );
  }
}
