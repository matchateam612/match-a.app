import styles from "../page.module.scss";

export function DashboardHero() {
  return (
    <>
      <section className={styles.hero}>
        <h2 className={styles.heroTitle}>
          Agent Glint is <span className={styles.heroHighlight}>scouring</span>{" "}
          the city.
        </h2>
        <p className={styles.heroCopy}>
          Your AI scout is actively analyzing urban clusters and social ripples
          in Boston to find your perfect alignment.
        </p>
      </section>

      <section aria-label="City pulse map" className={styles.mapCard}>
        <div className={styles.mapBadge}>
          <span aria-hidden="true" className={styles.badgeDot} />
          <span>Live: Beacon Hill</span>
        </div>

        <div aria-hidden="true" className={styles.pulseWrap}>
          <div className={styles.pulseRing} />
          <div className={styles.pulseRingDelayed} />
          <div className={styles.pulseDot} />
        </div>

        <div className={styles.mapLabel}>Boston cluster map</div>
      </section>
    </>
  );
}
