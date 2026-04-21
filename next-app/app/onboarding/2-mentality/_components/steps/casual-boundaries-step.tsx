import styles from "../../../_shared/onboarding-shell.module.scss";
import { casualBoundaryOptions } from "../mentality-data";

type CasualBoundariesStepProps = {
  values: string[];
  onToggle: (value: string) => void;
};

export function CasualBoundariesStep({
  values,
  onToggle,
}: CasualBoundariesStepProps) {
  return (
    <div className={styles.fieldStack}>
      <div className={styles.questionMeta}>
        <span className={styles.questionLabel}>Shortterm</span>
        <h2 className={styles.questionTitle}>What boundaries make casual dating feel good to you?</h2>
        <p className={styles.questionCopy}>
          These preferences help surface respectful, expectation-aligned matches earlier.
        </p>
      </div>

      <div className={styles.multiGrid}>
        {casualBoundaryOptions.map((option) => {
          const isActive = values.includes(option);

          return (
            <button
              key={option}
              type="button"
              className={`${styles.multiChip} ${isActive ? styles.multiChipActive : ""}`.trim()}
              onClick={() => onToggle(option)}
            >
              <span className={styles.chipTitle}>{option}</span>
              <span className={styles.chipCopy}>
                {isActive ? "Selected as an early expectation." : "Tap to add this boundary."}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
