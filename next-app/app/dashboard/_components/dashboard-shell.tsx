"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { DashboardComposer } from "./dashboard-composer";
import { DashboardDrawer } from "./dashboard-drawer";
import { DashboardTopBar } from "./dashboard-top-bar";
import styles from "../page.module.scss";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className={styles.page}>
      <DashboardTopBar onMenuClick={() => setIsDrawerOpen(true)} />
      <DashboardDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <main className={styles.main}>{children}</main>

      <DashboardComposer />
    </div>
  );
}
