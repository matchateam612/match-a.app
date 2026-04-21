import styles from "../../../_shared/onboarding-shell.module.scss";
import { relationshipIntentOptions } from "../mentality-data";
import type { RelationshipIntent } from "../mentality-types";

type RelationshipIntentStepProps = {
  value: RelationshipIntent | "";
  onChange: (value: RelationshipIntent) => void;
};

export function RelationshipIntentStep({ value, onChange }: RelationshipIntentStepProps) {
  return (
    <div className={styles.fieldStack}>
      <div className={styles.questionMeta}>
        <span className={styles.questionLabel}>Intent</span>
        <h2 className={styles.questionTitle}>What kind of relationship are you looking for?</h2>
        <p className={styles.questionCopy}>
          This choice determines the rest of this section, so we tailor the follow-up questions to
          what you actually want.
        </p>
      </div>

      <div className={styles.chipGrid}>
        {relationshipIntentOptions.map((option) => (
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
