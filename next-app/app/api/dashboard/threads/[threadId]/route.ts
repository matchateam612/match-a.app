import { NextResponse } from "next/server";

import { listMessagesForThread } from "@/lib/supabase/agent-messages";
import {
  deleteThreadForUser,
  getThreadByIdForUser,
  updateThreadForUser,
} from "@/lib/supabase/agent-threads";
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

export async function PATCH(request: Request, { params }: DashboardThreadRouteProps) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { threadId } = await params;
    const thread = await getThreadByIdForUser(user.id, threadId);

    if (!thread) {
      return jsonError("Thread not found.", 404);
    }

    const body = (await request.json().catch(() => null)) as { title?: unknown } | null;
    const nextTitle = typeof body?.title === "string" ? body.title.trim() : "";

    if (!nextTitle) {
      return jsonError("A thread title is required.");
    }

    const updatedThread = await updateThreadForUser(user.id, threadId, {
      title: nextTitle,
    });

    return NextResponse.json({ thread: updatedThread });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "We couldn't update that thread right now.",
      500,
    );
  }
}

export async function DELETE(request: Request, { params }: DashboardThreadRouteProps) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { threadId } = await params;
    const thread = await getThreadByIdForUser(user.id, threadId);

    if (!thread) {
      return jsonError("Thread not found.", 404);
    }

    await deleteThreadForUser(user.id, threadId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "We couldn't delete that thread right now.",
      500,
    );
  }
}
