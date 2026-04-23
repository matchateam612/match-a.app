"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import styles from "../../_shared/onboarding-shell.module.scss";

type AgentLayoutProps = {
  title: string;
  eyebrow: string;
  description: string;
  status?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function AgentLayout({
  title,
  eyebrow,
  description,
  status,
  footer,
  children,
}: AgentLayoutProps) {
  return (
    <main className={styles.page}>
      <div className={styles.main}>
        <section className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.progressMeta}>
              <span className={styles.inlineLabel}>{eyebrow}</span>
            </div>

            <div className={styles.questionMeta}>
              <h1 className={styles.questionTitle}>{title}</h1>
              <p className={styles.questionCopy}>{description}</p>
              {status}
            </div>

            <details className={styles.debugPanel}>
              <summary className={styles.debugSummary}>Testing tools</summary>
              <div className={styles.debugLinks}>
                <Link href="/onboarding/4-agent/testing" className={styles.backButton}>
                  Open testing playground
                </Link>
                <Link
                  href="/onboarding/4-agent/testing/system-prompt"
                  className={styles.backButton}
                >
                  Edit system prompt
                </Link>
              </div>
            </details>
          </div>

          <div className={styles.questionBlock}>
            <div className={styles.fieldStack}>{children}</div>
            {footer ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                  paddingTop: 8,
                }}
              >
                {footer}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
