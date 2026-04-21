import Link from "next/link";
import type { ReactNode } from "react";

import styles from "../../_shared/onboarding-shell.module.scss";
import { TOTAL_SECTIONS, TOTAL_STEPS } from "./picture-data";

type PictureLayoutProps = {
  children: ReactNode;
  draftStatus: string;
  footer: ReactNode;
  currentStep: number;
  footerClassName?: string;
  panelClassName?: string;
  questionBlockClassName?: string;
  status?: ReactNode;
};

export function PictureLayout({
  children,
  currentStep,
  draftStatus,
  footer,
  footerClassName,
  panelClassName,
  questionBlockClassName,
  status,
}: PictureLayoutProps) {
  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>M</span>
            <span className={styles.brandName}>Matcha</span>
          </Link>

          <p className={styles.helpText}>Picture section 3 of {TOTAL_SECTIONS}</p>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.layout}>
          <section className={`${styles.panelCard} ${panelClassName ?? ""}`.trim()}>
            <div className={styles.panelHeader}>
              <div className={styles.progressMeta}>
                <span>Step {currentStep + 1} of {TOTAL_STEPS}</span>
                <span>{draftStatus}</span>
              </div>

              <div className={styles.progressTrack} aria-hidden="true">
                {Array.from({ length: TOTAL_STEPS }, (_, index) => (
                  <div
                    key={index}
                    className={`${styles.progressSegment} ${
                      index <= currentStep ? styles.progressSegmentActive : ""
                    }`.trim()}
                  />
                ))}
              </div>
            </div>

            <div className={`${styles.questionBlock} ${questionBlockClassName ?? ""}`.trim()}>
              {children}
            </div>
            {status}
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.footerInner} ${footerClassName ?? ""}`.trim()}>{footer}</div>
      </footer>
    </div>
  );
}
