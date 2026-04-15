import styles from "../../page.module.scss";
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
    <>
      <div className={styles.questionMeta}>
        <p className={styles.questionLabel}>Ethnicity</p>
        <h2 className={styles.questionTitle}>
          Tell us about your background and who you are open to meeting.
        </h2>
        <p className={styles.questionCopy}>
          This helps with profile display and preference-based matching. You can keep your own
          background private if you want.
        </p>
      </div>

      <div className={styles.splitCard}>
        <div className={styles.stackCard}>
          <span className={styles.inlineLabel}>
            Which option is closest to your ethnicity or racial background?
          </span>

          <div className={styles.multiGrid}>
            {ethnicityOptions.map((option) => (
              <button
                key={option.value}
                className={`${styles.multiChip} ${
                  ethnicity === option.value ? styles.multiChipActive : ""
                }`.trim()}
                type="button"
                onClick={() => onEthnicityChange(option.value)}
              >
                <span className={styles.chipTitle}>{option.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.stackCard}>
          <span className={styles.inlineLabel}>
            Which ethnicities or races are you open to meeting?
          </span>

          <div className={styles.selectionSummary}>{selectedEthnicitySummary}</div>

          <div className={styles.multiGrid}>
            {preferredEthnicityOptions.map((option) => {
              const isActive = preferredEthnicities.includes(option.value);

              return (
                <button
                  key={option.value}
                  className={`${styles.multiChip} ${
                    isActive ? styles.multiChipActive : ""
                  }`.trim()}
                  type="button"
                  onClick={() => onPreferredEthnicityToggle(option.value)}
                >
                  <span className={styles.chipTitle}>{option.title}</span>
                  <span className={styles.chipCopy}>{option.copy}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
