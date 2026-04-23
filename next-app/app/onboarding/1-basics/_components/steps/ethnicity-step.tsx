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
          <label className={styles.fieldStack}>
            <span className={styles.inlineLabel}>
              Which option is closest to your ethnicity or racial background?
            </span>
            <select
              className={styles.selectInput}
              value={ethnicity}
              onChange={(event) => onEthnicityChange(event.target.value as EthnicityOption)}
            >
              <option value="">Select one</option>
              {ethnicityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.stackCard}>
          <label className={styles.fieldStack}>
            <span className={styles.inlineLabel}>Who are you open to meeting?</span>
          </label>

          <div className={styles.selectionSummary}>{selectedEthnicitySummary}</div>

          <div className={styles.multiGrid}>
            {preferredEthnicityOptions.map((option) => {
              const isSelected = preferredEthnicities.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.multiChip} ${isSelected ? styles.multiChipActive : ""}`.trim()}
                  aria-pressed={isSelected}
                  onClick={() => onPreferredEthnicityToggle(option.value)}
                >
                  <span className={styles.chipTitle}>{option.title}</span>
                  <span className={styles.chipCopy}>{option.copy}</span>
                </button>
              );
            })}
          </div>

          <p className={styles.helper}>
            Select as many as you want. Choose <strong>Any race</strong> if you do not want this
            preference to narrow your matches.
          </p>
        </div>
      </div>
    </>
  );
}
