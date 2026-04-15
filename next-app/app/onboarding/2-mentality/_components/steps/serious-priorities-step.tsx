import styles from "../../../1-basics/page.module.scss";
import { seriousPriorityOptions } from "../mentality-data";

type SeriousPrioritiesStepProps = {
  values: string[];
  onToggle: (value: string) => void;
};

export function SeriousPrioritiesStep({
  values,
  onToggle,
}: SeriousPrioritiesStepProps) {
  return (
    <div className={styles.fieldStack}>
      <div className={styles.questionMeta}>
        <span className={styles.questionLabel}>Longterm</span>
        <h2 className={styles.questionTitle}>Which qualities matter most in a longterm match?</h2>
        <p className={styles.questionCopy}>
          Pick the signals you want our matching system to prioritize earliest.
        </p>
      </div>

      <div className={styles.multiGrid}>
        {seriousPriorityOptions.map((option) => {
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
                {isActive ? "Selected for longterm matching." : "Tap to prioritize this trait."}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
