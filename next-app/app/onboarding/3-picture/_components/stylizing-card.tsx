import styles from "../../1-basics/page.module.scss";

export function StylizingCard() {
  return (
    <div className={styles.stackCard}>
      <span className={styles.inlineLabel}>Stylizing portrait</span>
      <p className={styles.helper}>
        We are smoothing tones, preserving facial structure, and adding light ink-style edges for
        a softer first glance.
      </p>
    </div>
  );
}
