import type { ReactNode } from "react";

import { OnboardingRouteGuard } from "../onboarding/_shared/route-guard";
import { DashboardNav } from "./_components/dashboard-nav";
import { DashboardTopBar } from "./_components/dashboard-top-bar";
import styles from "./page.module.scss";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <OnboardingRouteGuard area="dashboard">
      <div className={styles.page}>
        <DashboardTopBar />

        <main className={styles.main}>{children}</main>

        <DashboardNav />
      </div>
    </OnboardingRouteGuard>
  );
}
