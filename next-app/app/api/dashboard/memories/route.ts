import { NextResponse } from "next/server";

import { clearAllMemoriesForUser } from "@/lib/dashboard/memory-extractor";
import { listMemoriesForUser } from "@/lib/supabase/agent-memories";
import { requireAuthenticatedUser } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const memories = await listMemoriesForUser(user.id, "active");

    return NextResponse.json({ memories });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "We couldn't load your memories right now.",
      500,
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    await clearAllMemoriesForUser(user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "We couldn't clear your memories right now.",
      500,
    );
  }
}
