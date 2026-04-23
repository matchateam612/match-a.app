import type { ReactNode } from "react";

import { OnboardingRouteGuard } from "../onboarding/_shared/route-guard";
import { DashboardShell } from "./_components/dashboard-shell";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <OnboardingRouteGuard area="dashboard">
      <DashboardShell>{children}</DashboardShell>
    </OnboardingRouteGuard>
  );
}
