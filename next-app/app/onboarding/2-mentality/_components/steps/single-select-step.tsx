import styles from "../../../_shared/onboarding-shell.module.scss";
import type { MentalitySingleSelectOption } from "../mentality-types";

type SingleSelectStepProps = {
  label: string;
  title: string;
  description: string;
  value: string;
  options: MentalitySingleSelectOption[];
  onChange: (value: string) => void;
};

export function SingleSelectStep({
  label,
  title,
  description,
  value,
  options,
  onChange,
}: SingleSelectStepProps) {
  return (
    <div className={styles.fieldStack}>
      <div className={styles.questionMeta}>
        <span className={styles.questionLabel}>{label}</span>
        <h2 className={styles.questionTitle}>{title}</h2>
        <p className={styles.questionCopy}>{description}</p>
      </div>

      <div className={styles.chipGrid}>
        {options.map((option) => (
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
