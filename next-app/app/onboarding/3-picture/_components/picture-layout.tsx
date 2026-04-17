import Link from "next/link";
import type { ReactNode } from "react";

import styles from "../../1-basics/page.module.scss";
import { TOTAL_SECTIONS, TOTAL_STEPS } from "./picture-data";

type PictureLayoutProps = {
  children: ReactNode;
  draftStatus: string;
  footer: ReactNode;
  status?: ReactNode;
};

export function PictureLayout({ children, draftStatus, footer, status }: PictureLayoutProps) {
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
          <section className={styles.heroCard}>
            <div className={styles.heroContent}>
              <span className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                Section 3 of {TOTAL_SECTIONS}
              </span>

              <div>
                <h1 className={styles.heroTitle}>
                  Lead with a <span className={styles.heroHighlight}>strong first photo</span>.
                </h1>
                <p className={styles.heroCopy}>
                  Add a real photo, review a cleaned-up AI version if you want one, and save the
                  final JPEG to your profile.
                </p>
              </div>

              <div className={styles.heroBadges}>
                <div className={styles.heroBadge}>Upload or use the front camera</div>
                <div className={`${styles.heroBadge} ${styles.heroBadgeAccent}`}>
                  AI transform falls back to your original image
                </div>
              </div>
            </div>
          </section>

          <section className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div className={styles.progressMeta}>
                <span>Step 1 of {TOTAL_STEPS}</span>
                <span>{draftStatus}</span>
              </div>

              <div className={styles.progressTrack} aria-hidden="true">
                <div className={`${styles.progressSegment} ${styles.progressSegmentActive}`.trim()} />
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
