import { NextResponse } from "next/server";

import { createAssistantMessage } from "@/lib/supabase/agent-messages";
import { findOrCreateMatchThread } from "@/lib/supabase/agent-threads";
import {
  formatSharedContactType,
  getMatchUserActionsForBothUsers,
  updateMatchUserAction,
  upsertSharedContact,
} from "@/lib/supabase/match-user-actions";
import { requireAuthenticatedUser } from "@/lib/supabase/server-auth";
import type { SharedContactType } from "@/lib/supabase/types";

export const runtime = "nodejs";

const SHARED_CONTACT_TYPES = new Set<SharedContactType>([
  "phone",
  "whatsapp",
  "instagram",
  "wechat",
]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type RequestBody = {
  type?: SharedContactType;
  value?: string;
};

type MatchShareContactRouteProps = {
  params: Promise<{
    matchId: string;
  }>;
};

function buildRevealMessage(type: SharedContactType, value: string) {
  return `The other person also shared contact with you. You can reach them at ${value} via ${formatSharedContactType(type)}.`;
}

export async function POST(request: Request, { params }: MatchShareContactRouteProps) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { matchId } = await params;
    const body = (await request.json().catch(() => null)) as RequestBody | null;
    const type = body?.type;
    const value = body?.value?.trim() ?? "";

    if (!type || !SHARED_CONTACT_TYPES.has(type)) {
      return jsonError("Please choose a valid contact type.");
    }

    if (!value) {
      return jsonError("Please enter the contact information you want to share.");
    }

    const currentAction = await upsertSharedContact(matchId, user.id, {
      type,
      value,
    });

    if (!currentAction) {
      throw new Error("We couldn't save your shared contact right now.");
    }

    const nextState = await getMatchUserActionsForBothUsers(matchId, user.id);
    const currentUserAction = nextState.currentUserAction;
    const otherUserAction = nextState.otherUserAction;

    let mutualRevealTriggered = false;

    if (
      currentUserAction?.shared_contact_type &&
      currentUserAction.shared_contact_value &&
      otherUserAction?.shared_contact_type &&
      otherUserAction.shared_contact_value &&
      !currentUserAction.contact_revealed_at &&
      !otherUserAction.contact_revealed_at
    ) {
      const currentThread = await findOrCreateMatchThread(user.id, matchId);
      const otherUserId =
        nextState.match.user1 === user.id ? nextState.match.user2 : nextState.match.user1;
      const otherThread = await findOrCreateMatchThread(otherUserId, matchId);

      await Promise.all([
        createAssistantMessage(
          currentThread.id,
          user.id,
          buildRevealMessage(
            otherUserAction.shared_contact_type,
            otherUserAction.shared_contact_value,
          ),
          {
            source: "match-contact-reveal",
            matchId,
            contactType: otherUserAction.shared_contact_type,
          },
        ),
        createAssistantMessage(
          otherThread.id,
          otherUserId,
          buildRevealMessage(
            currentUserAction.shared_contact_type,
            currentUserAction.shared_contact_value,
          ),
          {
            source: "match-contact-reveal",
            matchId,
            contactType: currentUserAction.shared_contact_type,
          },
        ),
        updateMatchUserAction(matchId, user.id, {
          contact_revealed_at: new Date().toISOString(),
        }),
        updateMatchUserAction(matchId, otherUserId, {
          contact_revealed_at: new Date().toISOString(),
        }),
      ]);

      mutualRevealTriggered = true;
    }

    return NextResponse.json({
      declined: currentAction.declined ?? false,
      declineReason: currentAction.decline_reason ?? null,
      sharedContactType: currentAction.shared_contact_type ?? null,
      sharedContactValue: currentAction.shared_contact_value ?? null,
      hasSharedContact: Boolean(
        currentAction.shared_contact_type && currentAction.shared_contact_value,
      ),
      mutualRevealTriggered,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "We couldn't update shared contact right now.",
      500,
    );
  }
}
