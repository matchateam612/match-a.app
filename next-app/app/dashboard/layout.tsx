import type { ReactNode } from "react";

import { DashboardNav } from "./_components/dashboard-nav";
import { DashboardTopBar } from "./_components/dashboard-top-bar";
import styles from "./page.module.scss";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className={styles.page}>
      <DashboardTopBar />

      <main className={styles.main}>{children}</main>

      <DashboardNav />
    </div>
  );
}
