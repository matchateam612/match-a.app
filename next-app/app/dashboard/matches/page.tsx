import { PotentialRipplesContainer } from "../_components/potential-ripples-container";
import styles from "../page.module.scss";

export default function DashboardMatchesPage() {
  return (
    <div className={styles.stack}>
      <section className={styles.section}>
        <div className={styles.matchesIntro}>
          <p className={styles.eyebrow}>Matches</p>
          <h2 className={styles.sectionTitle}>Potential Ripples</h2>
          <p className={styles.heroCopy}>
            Review the people Glint thinks are worth a closer look, along with the
            context behind each signal.
          </p>
        </div>
      </section>

      <PotentialRipplesContainer />
    </div>
  );
}
