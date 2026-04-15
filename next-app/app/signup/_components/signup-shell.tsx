import Link from "next/link";

import styles from "../page.module.scss";
import { SignupForm } from "./signup-form";
import { SignupMethods } from "./signup-methods";

export function SignupShell() {
  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>M</span>
            <span className={styles.brandName}>Matcha</span>
          </Link>

          <Link href="/signin" className={styles.topLink}>
            Already a member?
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.layout}>
          <section className={styles.heroCard}>
            <div className={styles.heroContent}>
              <span className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                Mobile-first signup
              </span>

              <div>
                <h1 className={styles.heroTitle}>
                  Find out how dating should <span className={styles.heroHighlight}>feel</span>.
                </h1>
                <p className={styles.heroCopy}>
                  Start with email and password today, then add more ways to sign
                  in as the experience grows.
                </p>
              </div>

              <div className={styles.heroBadges}>
                <div className={styles.heroBadge}>Safer onboarding</div>
                <div className={`${styles.heroBadge} ${styles.heroBadgeAccent}`}>
                  Room for Google and more
                </div>
              </div>
            </div>
          </section>

          <section className={styles.formCard}>
            <div className={styles.formWrap}>
              <div className={styles.formHeader}>
                <p className={styles.eyebrow}>Create your account</p>
                <h2 className={styles.formTitle}>Join Matcha</h2>
                <p className={styles.formCopy}>
                  Use your email and a password to get started. We&apos;ll keep this
                  page ready for future sign-in methods too.
                </p>
              </div>

              <SignupForm />
              <SignupMethods />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
