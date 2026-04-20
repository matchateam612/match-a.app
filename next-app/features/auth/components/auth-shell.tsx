import Link from "next/link";
import type { ReactNode } from "react";

import styles from "../auth-page.module.scss";
import { getAuthPageCopy } from "../lib/auth-copy";
import type { AuthMode } from "../lib/auth-types";

type AuthShellProps = {
  mode: AuthMode;
  children: ReactNode;
};

export function AuthShell({ mode, children }: AuthShellProps) {
  const copy = getAuthPageCopy(mode);

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>M</span>
            <span className={styles.brandName}>Matcha</span>
          </Link>

          <Link href={copy.topLinkHref} className={styles.topLink}>
            {copy.topLinkLabel}
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.layout}>
          <section className={styles.heroCard}>
            <div className={styles.heroContent}>
              <span className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                {copy.heroEyebrow}
              </span>

              <div>
                <h1 className={styles.heroTitle}>
                  {copy.heroTitlePrefix}{" "}
                  <span className={styles.heroHighlight}>{copy.heroTitleHighlight}</span>.
                </h1>
                <p className={styles.heroCopy}>{copy.heroCopy}</p>
              </div>

              <div className={styles.heroBadges}>
                <div className={styles.heroBadge}>{copy.heroBadges[0]}</div>
                <div className={`${styles.heroBadge} ${styles.heroBadgeAccent}`}>
                  {copy.heroBadges[1]}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.formCard}>
            <div className={styles.formWrap}>{children}</div>
          </section>
        </div>
      </main>
    </div>
  );
}
