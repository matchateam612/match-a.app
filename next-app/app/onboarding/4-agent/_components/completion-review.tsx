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
      <span className={styles.inlineLabel}>Confirmation flow scaffold</span>
      <p style={{ marginTop: 0 }}>{draftSummary}</p>
      <p className={styles.helper}>
        The real implementation should ask the user to confirm or correct this summary before save.
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" className={styles.nextButton} onClick={onApplySummary}>
          Use as final summary
        </button>
      </div>
    </div>
  );
}
