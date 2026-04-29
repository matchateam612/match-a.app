import { NextResponse } from "next/server";

import { listThreadsForUser } from "@/lib/supabase/agent-threads";
import { requireAuthenticatedUser } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const archivedOnly = searchParams.get("archived") === "only";
    const includeArchived = searchParams.get("archived") === "all";
    const threads = await listThreadsForUser(user.id, "general", {
      archivedOnly,
      includeArchived,
    });

    return NextResponse.json({ threads });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "We couldn't load your chats right now.",
      500,
    );
  }
}
