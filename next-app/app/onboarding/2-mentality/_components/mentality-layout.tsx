import Link from "next/link";
import type { ReactNode } from "react";

import styles from "../../_shared/onboarding-shell.module.scss";
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
          <section className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div className={styles.questionMeta}>
                <span className={styles.questionLabel}>Section 2 of {TOTAL_SECTIONS}</span>
                <h1 className={styles.questionTitle}>Shape the intent behind each match.</h1>
                <p className={styles.questionCopy}>
                  These answers guide branching and keep recommendations aligned with the kind of
                  connection you want.
                </p>
              </div>

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
