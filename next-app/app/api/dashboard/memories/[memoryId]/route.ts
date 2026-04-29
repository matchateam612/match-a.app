import { NextResponse } from "next/server";

import { updateMemoryForUser } from "@/lib/supabase/agent-memories";
import { requireAuthenticatedUser } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type DashboardMemoryRouteProps = {
  params: Promise<{
    memoryId: string;
  }>;
};

export async function DELETE(request: Request, { params }: DashboardMemoryRouteProps) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { memoryId } = await params;
    await updateMemoryForUser(user.id, memoryId, {
      status: "discarded",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "We couldn't delete that memory right now.",
      500,
    );
  }
}
