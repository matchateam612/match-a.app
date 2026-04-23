"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getCurrentUser } from "@/lib/supabase/auth";
import { getOnboardingMetaRecord } from "@/lib/onboarding-idb/meta-store";

import { getNextOnboardingRoute } from "./onboarding-routing";

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

    function isAllowedOnboardingPath(path: string, nextRoute: string) {
      return path === nextRoute || path.startsWith(`${nextRoute}/`);
    }

    async function checkAccess() {
      try {
        const user = await getCurrentUser();

        if (!user) {
          if (isActive) {
            router.replace("/signin");
          }
          return;
        }

        const nextRoute = getNextOnboardingRoute(await getOnboardingMetaRecord());

        if (!isActive) {
          return;
        }

        if (area === "dashboard") {
          if (nextRoute !== "/dashboard") {
            router.replace(nextRoute);
            return;
          }
        } else if (!isAllowedOnboardingPath(pathname, nextRoute)) {
          router.replace(nextRoute);
          return;
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
