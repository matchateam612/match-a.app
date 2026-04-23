"use client";

import styles from "../../_shared/onboarding-shell.module.scss";

type CompletionReviewProps = {
  draftSummary: string;
  onApplySummary: () => void;
};

export function CompletionReview({
  draftSummary,
  onApplySummary,
}: CompletionReviewProps) {
  return (
    <div className={styles.stackCard}>
      <span className={styles.inlineLabel}>Summary review</span>
      <p style={{ marginTop: 0 }}>{draftSummary}</p>
      <p className={styles.helper}>
        Use this draft when you want to move the conversation into the final confirmation step.
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" className={styles.nextButton} onClick={onApplySummary}>
          Review this summary
        </button>
      </div>
    </div>
  );
}
