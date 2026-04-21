"use client";

import type { OnboardingMetaRecord } from "@/lib/onboarding-idb/types";

export const ONBOARDING_SECTION_ROUTES = [
  "/onboarding/1-basics",
  "/onboarding/2-mentality",
  "/onboarding/3-picture",
  "/onboarding/4-agent",
] as const;

export type OnboardingSectionRoute = (typeof ONBOARDING_SECTION_ROUTES)[number];

export function getNextOnboardingRoute(metaRecord: OnboardingMetaRecord | null): OnboardingSectionRoute | "/dashboard" {
  if (!metaRecord?.sections.basicInfo.completed) {
    return "/onboarding/1-basics";
  }

  if (!metaRecord.sections.mentality.completed) {
    return "/onboarding/2-mentality";
  }

  if (!metaRecord.sections.picture.completed) {
    return "/onboarding/3-picture";
  }

  if (!metaRecord.sections.agent.completed) {
    return "/onboarding/4-agent";
  }

  return "/dashboard";
}

export function isOnboardingSectionRoute(pathname: string) {
  return ONBOARDING_SECTION_ROUTES.includes(pathname as OnboardingSectionRoute);
}
