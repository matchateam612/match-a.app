import Link from "next/link";
import type { ReactNode } from "react";

import styles from "../page.module.scss";
import { TOTAL_SECTIONS } from "./basic-info-data";

type BasicInfoLayoutProps = {
  children: ReactNode;
  currentStep: number;
  draftStatus: string;
  footer: ReactNode;
};

export function BasicInfoLayout({
  children,
  currentStep,
  draftStatus,
  footer,
}: BasicInfoLayoutProps) {
  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>M</span>
            <span className={styles.brandName}>Matcha</span>
          </Link>

          <p className={styles.helpText}>Basic info section 1 of {TOTAL_SECTIONS}</p>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.layout}>
          <section className={styles.heroCard}>
            <div className={styles.heroContent}>
              <span className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                Section 1 of {TOTAL_SECTIONS}
              </span>

              <div>
                <h1 className={styles.heroTitle}>
                  Let&apos;s build the <span className={styles.heroHighlight}>basics</span> first.
                </h1>
                <p className={styles.heroCopy}>
                  These answers shape your profile foundation, screening rules, and who can appear
                  in your earliest matching pool.
                </p>
              </div>

              <div className={styles.heroBadges}>
                <div className={styles.heroBadge}>Saved on this device while you go</div>
                <div className={`${styles.heroBadge} ${styles.heroBadgeAccent}`}>
                  Built for a roomy mobile flow
                </div>
              </div>
            </div>
          </section>

          <section className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div className={styles.progressMeta}>
                <span>Step {currentStep + 1} of 5</span>
                <span>{draftStatus}</span>
              </div>

              <div className={styles.progressTrack} aria-hidden="true">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className={`${styles.progressSegment} ${
                      index <= currentStep ? styles.progressSegmentActive : ""
                    }`.trim()}
                  />
                ))}
              </div>
            </div>

            <div className={styles.questionBlock}>{children}</div>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>{footer}</div>
      </footer>
    </div>
  );
}
