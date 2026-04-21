import styles from "../../../_shared/onboarding-shell.module.scss";

type AgePreferenceStepProps = {
  preferredAgeMin: string;
  preferredAgeMax: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
};

export function AgePreferenceStep({
  preferredAgeMin,
  preferredAgeMax,
  onMinChange,
  onMaxChange,
}: AgePreferenceStepProps) {
  return (
    <>
      <div className={styles.questionMeta}>
        <p className={styles.questionLabel}>Age preference</p>
        <h2 className={styles.questionTitle}>What age range would you like to date?</h2>
        <p className={styles.questionCopy}>
          Set the youngest and oldest ages you want included in your dating pool.
        </p>
      </div>

      <div className={styles.stackCard}>
        <div className={styles.rangeSummary}>
          <div>
            <span className={styles.inlineLabel}>Minimum</span>
            <div className={styles.rangeValue}>{preferredAgeMin}</div>
          </div>
          <div>
            <span className={styles.inlineLabel}>Maximum</span>
            <div className={styles.rangeValue}>{preferredAgeMax}</div>
          </div>
        </div>

        <label className={styles.fieldStack}>
          <span className={styles.inlineLabel}>Minimum age</span>
          <input
            className={styles.slider}
            type="range"
            min="18"
            max="80"
            value={preferredAgeMin}
            onChange={(event) => onMinChange(event.target.value)}
          />
        </label>

        <label className={styles.fieldStack}>
          <span className={styles.inlineLabel}>Maximum age</span>
          <input
            className={styles.slider}
            type="range"
            min="18"
            max="80"
            value={preferredAgeMax}
            onChange={(event) => onMaxChange(event.target.value)}
          />
        </label>

        <p className={styles.helper}>Both ends of the range stay between 18 and 80.</p>
      </div>
    </>
  );
}
