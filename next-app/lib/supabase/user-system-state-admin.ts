import "server-only";

import { getSupabaseAdminClient } from "./admin";
import type { OnboardingStatus } from "./database.types";
import {
  isValidOnboardingStatusTransition,
  shouldPromoteOnboardingStatus,
  type UserSystemStateRow,
} from "./user-system-state";

export async function getUserSystemStateByUserId(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_system_state")
    .select("user_id, onboarding_status, tier, promoted_by, report_flags, created_at, updated_at")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data as UserSystemStateRow;
}

export async function advanceUserOnboardingStatus(userId: string, nextStatus: OnboardingStatus) {
  const supabase = getSupabaseAdminClient();
  const currentState = await getUserSystemStateByUserId(userId);

  if (!shouldPromoteOnboardingStatus(currentState.onboarding_status, nextStatus)) {
    return currentState;
  }

  if (!isValidOnboardingStatusTransition(currentState.onboarding_status, nextStatus)) {
    throw new Error("Invalid onboarding status transition.");
  }

  const { data, error } = await supabase
    .from("user_system_state")
    .update({
      onboarding_status: nextStatus,
    })
    .eq("user_id", userId)
    .select("user_id, onboarding_status, tier, promoted_by, report_flags, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data as UserSystemStateRow;
}
