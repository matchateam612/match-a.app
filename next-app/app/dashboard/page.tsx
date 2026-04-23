import styles from "./page.module.scss";

export default function DashboardPage() {
  return (
    <div className={styles.chatCanvas}>
      <section className={styles.homeHero}>
        <p className={styles.eyebrow}>Main Reflection</p>
        <h2 className={styles.homeTitle}>What should Glint look into today?</h2>
        <p className={styles.heroCopy}>
          Your AI workspace is centered around conversations. Open the menu to
          review new matches or continue an existing thread.
        </p>
      </section>

      <section className={styles.insightCard}>
        <div>
          <p className={styles.eyebrow}>New Signals</p>
          <h3 className={styles.insightTitle}>3 new matches are ready to discuss.</h3>
        </div>
        <p className={styles.insightCopy}>
          Annie, Sunny, and Cherry are waiting in the Matches drawer. Each opens
          as a focused conversation with Glint.
        </p>
      </section>
    </div>
  );
}
