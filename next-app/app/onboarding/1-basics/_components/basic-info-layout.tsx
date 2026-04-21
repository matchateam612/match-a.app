import Link from "next/link";
import type { ReactNode } from "react";

import styles from "../page.module.scss";
import { TOTAL_SECTIONS, TOTAL_STEPS } from "./basic-info-data";

type BasicInfoLayoutProps = {
  children: ReactNode;
  currentStep: number;
  draftStatus: string;
  footer?: ReactNode;
  hideProgress?: boolean;
  status?: ReactNode;
};

export function BasicInfoLayout({
  children,
  currentStep,
  draftStatus,
  footer,
  hideProgress = false,
  status,
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
          <section className={styles.panelCard}>
            {hideProgress ? null : (
              <div className={styles.panelHeader}>
                <div className={styles.progressMeta}>
                  <span>Step {currentStep + 1} of {TOTAL_STEPS}</span>
                  <span>{draftStatus}</span>
                </div>

                <div className={styles.progressTrack} aria-hidden="true">
                  {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                    <div
                      key={index}
                      className={`${styles.progressSegment} ${
                        index <= currentStep ? styles.progressSegmentActive : ""
                      }`.trim()}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className={styles.questionBlock}>{children}</div>
            {status}
          </section>
        </div>
      </main>

      {footer ? (
        <footer className={styles.footer}>
          <div className={styles.footerInner}>{footer}</div>
        </footer>
      ) : null}
    </div>
  );
}
