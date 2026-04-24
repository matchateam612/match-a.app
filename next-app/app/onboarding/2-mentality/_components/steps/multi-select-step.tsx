import styles from "../../../_shared/onboarding-shell.module.scss";
import type { MentalityMultiSelectOption } from "../mentality-types";

type MultiSelectStepProps = {
  label: string;
  title: string;
  description: string;
  values: string[];
  options: MentalityMultiSelectOption[];
  onToggle: (value: string) => void;
};

export function MultiSelectStep({
  label,
  title,
  description,
  values,
  options,
  onToggle,
}: MultiSelectStepProps) {
  return (
    <div className={styles.fieldStack}>
      <div className={styles.questionMeta}>
        <span className={styles.questionLabel}>{label}</span>
        <h2 className={styles.questionTitle}>{title}</h2>
        <p className={styles.questionCopy}>{description}</p>
      </div>

      <div className={styles.multiGrid}>
        {options.map((option) => {
          const isActive = values.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              className={`${styles.multiChip} ${isActive ? styles.multiChipActive : ""}`.trim()}
              onClick={() => onToggle(option.value)}
            >
              <span className={styles.chipTitle}>{option.title}</span>
              <span className={styles.chipCopy}>
                {isActive ? option.copyActive : option.copyInactive}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
