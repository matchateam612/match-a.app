import { getSupabaseBrowserClient } from "./client";
import type { Database, OnboardingStatus } from "./database.types";

export const ONBOARDING_STATUS_ROUTE_MAP = {
  "1-basics": "/onboarding/1-basics",
  "2-mentality": "/onboarding/2-mentality",
  "3-picture": "/onboarding/3-picture",
  "4-agent": "/onboarding/4-agent",
  finished: "/dashboard",
} as const;

export const ONBOARDING_ROUTE_STEP_INDEX = {
  "/onboarding/1-basics": 1,
  "/onboarding/2-mentality": 2,
  "/onboarding/3-picture": 3,
  "/onboarding/4-agent": 4,
} as const;

export type UserSystemStateRow = Database["public"]["Tables"]["user_system_state"]["Row"];
export type OnboardingRoutePath = keyof typeof ONBOARDING_ROUTE_STEP_INDEX;

const ONBOARDING_STATUS_ORDER: OnboardingStatus[] = [
  "1-basics",
  "2-mentality",
  "3-picture",
  "4-agent",
  "finished",
];

const ALLOWED_STATUS_TRANSITIONS: Record<Exclude<OnboardingStatus, "finished">, OnboardingStatus> = {
  "1-basics": "2-mentality",
  "2-mentality": "3-picture",
  "3-picture": "4-agent",
  "4-agent": "finished",
};

function getStatusOrderIndex(status: OnboardingStatus) {
  return ONBOARDING_STATUS_ORDER.indexOf(status);
}

export function getRouteForOnboardingStatus(status: OnboardingStatus) {
  return ONBOARDING_STATUS_ROUTE_MAP[status];
}

export function isFinishedOnboardingStatus(status: OnboardingStatus) {
  return status === "finished";
}

export function getOnboardingStepIndexFromStatus(status: OnboardingStatus) {
  if (status === "finished") {
    return ONBOARDING_ROUTE_STEP_INDEX["/onboarding/4-agent"];
  }

  return ONBOARDING_ROUTE_STEP_INDEX[getRouteForOnboardingStatus(status) as OnboardingRoutePath];
}

export function getOnboardingStepIndexFromPath(pathname: string) {
  const matchedRoute = Object.keys(ONBOARDING_ROUTE_STEP_INDEX).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  return matchedRoute
    ? ONBOARDING_ROUTE_STEP_INDEX[matchedRoute as OnboardingRoutePath]
    : null;
}

export function isOnboardingPathAllowed(status: OnboardingStatus, pathname: string) {
  const pathIndex = getOnboardingStepIndexFromPath(pathname);

  if (pathIndex === null) {
    return false;
  }

  if (isFinishedOnboardingStatus(status)) {
    return false;
  }

  return pathIndex <= getOnboardingStepIndexFromStatus(status);
}

export function isValidOnboardingStatusTransition(
  currentStatus: OnboardingStatus,
  nextStatus: OnboardingStatus,
) {
  if (currentStatus === "finished") {
    return nextStatus === "finished";
  }

  return ALLOWED_STATUS_TRANSITIONS[currentStatus] === nextStatus;
}

export function shouldPromoteOnboardingStatus(
  currentStatus: OnboardingStatus,
  requestedStatus: OnboardingStatus,
) {
  return getStatusOrderIndex(requestedStatus) > getStatusOrderIndex(currentStatus);
}

export async function getCurrentUserSystemState() {
  const supabase = getSupabaseBrowserClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!authData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_system_state")
    .select("user_id, onboarding_status, tier, promoted_by, report_flags, created_at, updated_at")
    .eq("user_id", authData.user.id)
    .single();

  if (error) {
    throw error;
  }

  return data as UserSystemStateRow;
}
