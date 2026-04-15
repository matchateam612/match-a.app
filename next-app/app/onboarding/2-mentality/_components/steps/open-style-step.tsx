import styles from "../../../1-basics/page.module.scss";
import { openStyleOptions } from "../mentality-data";
import type { OpenStyleOption } from "../mentality-types";

type OpenStyleStepProps = {
  value: OpenStyleOption | "";
  onChange: (value: OpenStyleOption) => void;
};

export function OpenStyleStep({ value, onChange }: OpenStyleStepProps) {
  return (
    <div className={styles.fieldStack}>
      <div className={styles.questionMeta}>
        <span className={styles.questionLabel}>Open to both</span>
        <h2 className={styles.questionTitle}>
          When you say open to both, what does that usually look like?
        </h2>
        <p className={styles.questionCopy}>
          This lets us preserve nuance instead of flattening you into a single intent bucket.
        </p>
      </div>

      <div className={styles.chipGrid}>
        {openStyleOptions.map((option) => (
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
