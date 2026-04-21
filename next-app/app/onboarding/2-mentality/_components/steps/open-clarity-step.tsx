import styles from "../../../_shared/onboarding-shell.module.scss";
import { openClarityOptions } from "../mentality-data";

type OpenClarityStepProps = {
  values: string[];
  onToggle: (value: string) => void;
};

export function OpenClarityStep({ values, onToggle }: OpenClarityStepProps) {
  return (
    <div className={styles.fieldStack}>
      <div className={styles.questionMeta}>
        <span className={styles.questionLabel}>Open to both</span>
        <h2 className={styles.questionTitle}>
          What kind of clarity matters most when things could go either way?
        </h2>
        <p className={styles.questionCopy}>
          Pick the communication signals you want surfaced before ambiguity turns into mismatch.
        </p>
      </div>

      <div className={styles.multiGrid}>
        {openClarityOptions.map((option) => {
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
                {isActive ? "Selected as a preferred signal." : "Tap to add this expectation."}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
