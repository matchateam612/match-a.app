import styles from "../page.module.scss";

export default function DashboardMatchesPage() {
  return (
    <div className={styles.chatCanvas}>
      <section className={styles.homeHero}>
        <p className={styles.eyebrow}>Matches</p>
        <h2 className={styles.homeTitle}>Choose a match from the menu.</h2>
        <p className={styles.heroCopy}>
          Matches now live as expandable threads in the drawer. Open the menu
          and pick Annie, Sunny, or Cherry to continue.
        </p>
      </section>
    </div>
  );
}
