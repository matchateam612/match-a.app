import { DashboardHero } from "./_components/dashboard-hero";
import { DashboardNav } from "./_components/dashboard-nav";
import { DashboardTopBar } from "./_components/dashboard-top-bar";
import { PotentialRipplesContainer } from "./_components/potential-ripples-container";
import { SystemActivityPanel } from "./_components/system-activity-panel";
import styles from "./page.module.scss";

export default function DashboardPage() {
  return (
    <div className={styles.page}>
      <DashboardTopBar />

      <main className={styles.main}>
        <div className={styles.stack}>
          <DashboardHero />
          <SystemActivityPanel />
          <PotentialRipplesContainer />
        </div>
      </main>

      <DashboardNav />
    </div>
  );
}
