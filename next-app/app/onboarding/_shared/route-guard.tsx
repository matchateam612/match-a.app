"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getCurrentUser } from "@/lib/supabase/auth";
import {
  getCurrentUserSystemState,
  getRouteForOnboardingStatus,
  isFinishedOnboardingStatus,
  isOnboardingPathAllowed,
} from "@/lib/supabase/user-system-state";


type RouteGuardProps = {
  area: "dashboard" | "onboarding";
  children: ReactNode;
};

export function OnboardingRouteGuard({ area, children }: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function checkAccess() {
      try {
        const user = await getCurrentUser();

        if (!user) {
          if (isActive) {
            router.replace("/signin");
          }
          return;
        }

        const systemState = await getCurrentUserSystemState();

        if (!isActive) {
          return;
        }

        if (!systemState) {
          throw new Error("We couldn't find your onboarding state.");
        }

        const nextRoute = getRouteForOnboardingStatus(systemState.onboarding_status);

        if (area === "dashboard") {
          if (!isFinishedOnboardingStatus(systemState.onboarding_status)) {
            router.replace(nextRoute);
            return;
          }
        } else {
          if (isFinishedOnboardingStatus(systemState.onboarding_status)) {
            router.replace("/dashboard");
            return;
          }

          if (!isOnboardingPathAllowed(systemState.onboarding_status, pathname)) {
            router.replace(nextRoute);
            return;
          }
        }

        setIsCheckingAccess(false);
      } catch {
        if (isActive) {
          router.replace("/signin");
        }
      }
    }

    void checkAccess();

    return () => {
      isActive = false;
    };
  }, [area, pathname, router]);

  if (isCheckingAccess) {
    return null;
  }

  return <>{children}</>;
}
