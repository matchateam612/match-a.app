import type { ReactNode } from "react";

import { OnboardingRouteGuard } from "./_shared/route-guard";

type OnboardingLayoutProps = {
  children: ReactNode;
};

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return <OnboardingRouteGuard area="onboarding">{children}</OnboardingRouteGuard>;
}
