import styles from "../../../1-basics/page.module.scss";
import { casualFrequencyOptions } from "../mentality-data";
import type { CasualFrequencyOption } from "../mentality-types";

type CasualFrequencyStepProps = {
  value: CasualFrequencyOption | "";
  onChange: (value: CasualFrequencyOption) => void;
};

export function CasualFrequencyStep({ value, onChange }: CasualFrequencyStepProps) {
  return (
    <div className={styles.fieldStack}>
      <div className={styles.questionMeta}>
        <span className={styles.questionLabel}>Shortterm</span>
        <h2 className={styles.questionTitle}>What kind of rhythm feels right for something casual?</h2>
        <p className={styles.questionCopy}>
          Frequency matters because casual does not mean the same thing to everyone.
        </p>
      </div>

      <div className={styles.chipGrid}>
        {casualFrequencyOptions.map((option) => (
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
