import styles from "../page.module.scss";

export default function DashboardMatchesPage() {
  return (
    <div className={styles.chatCanvas}>
      <section className={styles.homeHero}>
        <p className={styles.eyebrow}>Matches</p>
        <h2 className={styles.homeTitle}>Choose a match from the menu.</h2>
        <p className={styles.heroCopy}>
          Open the Matches section in the drawer to start a focused conversation
          about someone Glint found for you.
        </p>
      </section>
    </div>
  );
}
