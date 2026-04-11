import type { RippleCard } from "../_lib/ripple-types";
import styles from "../page.module.scss";

type PotentialRipplesSectionProps = {
  isLoading: boolean;
  ripples: RippleCard[];
};

export function PotentialRipplesSection({
  isLoading,
  ripples,
}: PotentialRipplesSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Potential Ripples</h3>
        <button className={styles.sectionLink} type="button">
          View All
        </button>
      </div>

      <div className={styles.rippleGrid}>
        {!isLoading && ripples.length > 0 ? (
          ripples.map((ripple) => (
            <article className={styles.rippleCard} key={ripple.id}>
              <div className={styles.rippleGlow} />
              <div className={styles.rippleAvatar} />
              <div className={styles.rippleBody}>
                <div className={styles.rippleHeader}>
                  <h4 className={styles.rippleTitle}>{ripple.label}</h4>
                  {ripple.statusLabel ? (
                    <span className={styles.rippleStatus}>{ripple.statusLabel}</span>
                  ) : null}
                </div>

                {ripple.match_reason ? (
                  <p className={styles.rippleMessage}>{ripple.match_reason}</p>
                ) : (
                  <div className={styles.skeletonBlock} />
                )}

                <div className={styles.rippleMeta}>
                  <span className={styles.rippleMetaLabel}>
                    Match ID: {ripple.id}
                  </span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <>
            {Array.from({ length: 2 }).map((_, index) => (
              <article className={styles.rippleCard} key={index}>
                <div className={styles.rippleGlow} />
                <div className={styles.rippleAvatar} />
                <div className={styles.rippleBody}>
                  <div className={styles.skeletonTiny} />
                  <div className={styles.skeletonBlock} />
                  <div className={styles.skeletonShort} />
                  <div className={styles.tagRow}>
                    <span className={styles.skeletonTag} />
                    <span className={styles.skeletonTag} />
                  </div>
                </div>
              </article>
            ))}

            <div className={styles.emptyShell}>
              <div aria-hidden="true" className={styles.emptyOrbit} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
