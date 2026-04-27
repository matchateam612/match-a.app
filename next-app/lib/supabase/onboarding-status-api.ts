"use client";

import { getSupabaseBrowserClient } from "./client";
import type { OnboardingStatus } from "./database.types";

async function buildAuthHeaders() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (error || !accessToken) {
    throw error ?? new Error("Please sign in before continuing onboarding.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

export async function updateOnboardingStatusRequest(nextStatus: OnboardingStatus) {
  const headers = await buildAuthHeaders();
  const response = await fetch("/api/onboarding/status", {
    method: "POST",
    headers,
    body: JSON.stringify({ nextStatus }),
  });
  const payload = (await response.json().catch(() => null)) as
    | { onboardingStatus?: OnboardingStatus; error?: string }
    | null;

  if (!response.ok || !payload?.onboardingStatus) {
    throw new Error(payload?.error || "We couldn't update your onboarding status right now.");
  }

  return payload.onboardingStatus;
}
