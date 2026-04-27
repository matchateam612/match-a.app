import { NextResponse } from "next/server";

import { advanceUserOnboardingStatus } from "@/lib/supabase/user-system-state-admin";
import { requireAuthenticatedUser } from "@/lib/supabase/server-auth";
import type { OnboardingStatus } from "@/lib/supabase/database.types";

export const runtime = "nodejs";

type UpdateOnboardingStatusRequest = {
  nextStatus?: OnboardingStatus;
};

const ALLOWED_STATUSES: OnboardingStatus[] = [
  "1-basics",
  "2-mentality",
  "3-picture",
  "4-agent",
  "finished",
];

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isOnboardingStatus(value: unknown): value is OnboardingStatus {
  return typeof value === "string" && ALLOWED_STATUSES.includes(value as OnboardingStatus);
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const payload = (await request.json().catch(() => null)) as UpdateOnboardingStatusRequest | null;
    const nextStatus = payload?.nextStatus;

    if (!isOnboardingStatus(nextStatus)) {
      return jsonError("A valid onboarding status is required.");
    }

    const state = await advanceUserOnboardingStatus(user.id, nextStatus);

    return NextResponse.json({
      onboardingStatus: state.onboarding_status,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error && error.message
        ? error.message
        : "We couldn't update your onboarding status right now.",
      500,
    );
  }
}
