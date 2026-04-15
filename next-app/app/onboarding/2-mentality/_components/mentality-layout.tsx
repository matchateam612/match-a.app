import Link from "next/link";
import type { ReactNode } from "react";

import styles from "../../1-basics/page.module.scss";
import { TOTAL_SECTIONS } from "./mentality-data";

type MentalityLayoutProps = {
  children: ReactNode;
  currentStepIndex: number;
  totalSteps: number;
  draftStatus: string;
  footer: ReactNode;
  status?: ReactNode;
};

export function MentalityLayout({
  children,
  currentStepIndex,
  totalSteps,
  draftStatus,
  footer,
  status,
}: MentalityLayoutProps) {
  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>M</span>
            <span className={styles.brandName}>Matcha</span>
          </Link>

          <p className={styles.helpText}>Mentality section 2 of {TOTAL_SECTIONS}</p>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.layout}>
          <section className={styles.heroCard}>
            <div className={styles.heroContent}>
              <span className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                Section 2 of {TOTAL_SECTIONS}
              </span>

              <div>
                <h1 className={styles.heroTitle}>
                  Shape the <span className={styles.heroHighlight}>intent</span> behind each
                  match.
                </h1>
                <p className={styles.heroCopy}>
                  These answers guide how we branch your onboarding, interpret compatibility, and
                  keep your recommendations aligned with the kind of connection you want.
                </p>
              </div>

              <div className={styles.heroBadges}>
                <div className={styles.heroBadge}>Branch-aware resume on this device</div>
                <div className={`${styles.heroBadge} ${styles.heroBadgeAccent}`}>
                  Different questions for different intentions
                </div>
              </div>
            </div>
          </section>

          <section className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div className={styles.progressMeta}>
                <span>
                  Step {currentStepIndex + 1} of {totalSteps}
                </span>
                <span>{draftStatus}</span>
              </div>

              <div className={styles.progressTrack} aria-hidden="true">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div
                    key={index}
                    className={`${styles.progressSegment} ${
                      index <= currentStepIndex ? styles.progressSegmentActive : ""
                    }`.trim()}
                  />
                ))}
              </div>
            </div>

            <div className={styles.questionBlock}>{children}</div>
            {status}
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>{footer}</div>
      </footer>
    </div>
  );
}
