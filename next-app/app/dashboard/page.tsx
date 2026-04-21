import { DashboardHero } from "./_components/dashboard-hero";
import { SystemActivityPanel } from "./_components/system-activity-panel";
import styles from "./page.module.scss";

export default function DashboardPage() {
  return (
    <div className={styles.stack}>
      <DashboardHero />
      <SystemActivityPanel />
    </div>
  );
}
