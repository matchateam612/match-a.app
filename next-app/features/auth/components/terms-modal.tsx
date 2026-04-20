"use client";

import styles from "../auth-page.module.scss";

type TermsModalProps = {
  onClose: () => void;
  open: boolean;
};

export function TermsModal({ onClose, open }: TermsModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Terms and Conditions">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Terms and Conditions</h2>
            <p className={styles.modalCopy}>
              Placeholder modal ready for the legal copy. We can drop the real terms in here next.
            </p>
          </div>

          <button className={styles.toggleButton} type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
