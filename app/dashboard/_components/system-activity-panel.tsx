import type { ReactNode } from "react";

import styles from "../page.module.scss";

type ActivityEntry = {
  tone: "primary" | "muted" | "active";
  key: string;
  content: ReactNode;
};

const systemActivity: ActivityEntry[] = [
  {
    tone: "primary",
    key: "trend-data",
    content: "Accessing localized trend data...",
  },
  {
    tone: "muted",
    key: "shared-interests",
    content: (
      <>
        Analyzing shared interests in{" "}
        <span className={styles.logStrong}>Sustainable Tech</span>
      </>
    ),
  },
  {
    tone: "muted",
    key: "ripple-detection",
    content: "Detecting high-frequency compatibility ripple...",
  },
  {
    tone: "active",
    key: "active-scan",
    content: "Scanning social nodes for Match #402...",
  },
];

export function SystemActivityPanel() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.eyebrow}>System Activity</h3>
        <span aria-hidden="true" className={styles.panelIcon}>
          &gt;_
        </span>
      </div>

      <div className={styles.logs}>
        {systemActivity.map((entry) => {
          const toneClass =
            entry.tone === "primary"
              ? styles.logPrimary
              : entry.tone === "active"
                ? styles.logPrimary
                : "";

          return (
            <div
              className={`${styles.logRow} ${toneClass}`.trim()}
              key={entry.key}
            >
              <span aria-hidden="true" className={styles.logPrompt}>
                &gt;
              </span>
              {entry.tone === "active" ? (
                <p className={styles.logActiveText}>{entry.content}</p>
              ) : (
                <p>{entry.content}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
