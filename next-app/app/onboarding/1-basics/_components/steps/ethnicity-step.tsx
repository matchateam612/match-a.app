import styles from "../../../_shared/onboarding-shell.module.scss";
import { ethnicityOptions, preferredEthnicityOptions } from "../basic-info-data";
import type { EthnicityOption, PreferredEthnicityOption } from "../basic-info-types";

type EthnicityStepProps = {
  ethnicity: EthnicityOption | "";
  preferredEthnicities: PreferredEthnicityOption[];
  selectedEthnicitySummary: string;
  onEthnicityChange: (value: EthnicityOption) => void;
  onPreferredEthnicityToggle: (value: PreferredEthnicityOption) => void;
};

export function EthnicityStep({
  ethnicity,
  preferredEthnicities,
  selectedEthnicitySummary,
  onEthnicityChange,
  onPreferredEthnicityToggle,
}: EthnicityStepProps) {
  return (
    <div className={styles.fieldStack}>
      <div className={styles.questionMeta}>
        <p className={styles.questionLabel}>Ethnicity</p>
        <h2 className={styles.questionTitle}>Background and match preferences.</h2>
        <p className={styles.questionCopy}>
          Keep it quick: choose your own background, then tap the groups you want included in
          matching.
        </p>
      </div>

      <div className={styles.compactSection}>
        <span className={styles.inlineLabel}>Your background</span>
        <div className={styles.compactChoiceGrid}>
          {ethnicityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.compactChoice} ${
                ethnicity === option.value ? styles.compactChoiceActive : ""
              }`.trim()}
              aria-pressed={ethnicity === option.value}
              onClick={() => onEthnicityChange(option.value as EthnicityOption)}
            >
              {option.title}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.compactSection}>
        <div className={styles.rowBetween}>
          <span className={styles.inlineLabel}>Open to meeting</span>
          <div className={styles.selectionSummary}>{selectedEthnicitySummary}</div>
        </div>

        <div className={styles.compactChoiceGrid}>
          {preferredEthnicityOptions.map((option) => {
            const isSelected = preferredEthnicities.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                className={`${styles.compactChoice} ${
                  isSelected ? styles.compactChoiceActive : ""
                }`.trim()}
                aria-pressed={isSelected}
                onClick={() => onPreferredEthnicityToggle(option.value)}
              >
                {option.title}
              </button>
            );
          })}
        </div>

        <p className={styles.helper}>Choose as many as you want, or tap Any race to stay open.</p>
      </div>
    </div>
  );
}
