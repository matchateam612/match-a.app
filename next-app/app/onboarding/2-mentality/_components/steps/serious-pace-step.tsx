import styles from "../../../1-basics/page.module.scss";
import { seriousPaceOptions } from "../mentality-data";
import type { SeriousPaceOption } from "../mentality-types";

type SeriousPaceStepProps = {
  value: SeriousPaceOption | "";
  onChange: (value: SeriousPaceOption) => void;
};

export function SeriousPaceStep({ value, onChange }: SeriousPaceStepProps) {
  return (
    <div className={styles.fieldStack}>
      <div className={styles.questionMeta}>
        <span className={styles.questionLabel}>Longterm</span>
        <h2 className={styles.questionTitle}>How do you want a serious connection to unfold?</h2>
        <p className={styles.questionCopy}>
          Your pacing preference helps us avoid matching you with someone who wants the opposite
          tempo.
        </p>
      </div>

      <div className={styles.chipGrid}>
        {seriousPaceOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.chip} ${value === option.value ? styles.chipActive : ""}`.trim()}
            onClick={() => onChange(option.value)}
          >
            <span className={styles.chipTitle}>{option.title}</span>
            <span className={styles.chipCopy}>{option.copy}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
