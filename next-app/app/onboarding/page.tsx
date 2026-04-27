"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getCurrentUserSystemState, getRouteForOnboardingStatus } from "@/lib/supabase/user-system-state";

export default function OnboardingIndexPage() {
  const router = useRouter();

  useEffect(() => {
    let isActive = true;

    async function routeToCurrentStep() {
      try {
        const systemState = await getCurrentUserSystemState();

        if (isActive && systemState) {
          router.replace(getRouteForOnboardingStatus(systemState.onboarding_status));
        }
      } catch {
        if (isActive) {
          router.replace("/signin");
        }
      }
    }

    void routeToCurrentStep();

    return () => {
      isActive = false;
    };
  }, [router]);

  return null;
}
