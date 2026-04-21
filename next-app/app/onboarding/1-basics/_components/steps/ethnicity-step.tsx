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
            <span className={styles.inlineLabel}>
              Which ethnicities or races are you open to meeting?
            </span>
            <select
              className={`${styles.selectInput} ${styles.multiSelect}`.trim()}
              multiple
              value={preferredEthnicities}
              onChange={(event) => {
                const values = Array.from(event.target.selectedOptions, (option) => option.value);

                preferredEthnicityOptions.forEach((option) => {
                  const shouldBeSelected = values.includes(option.value);
                  const isSelected = preferredEthnicities.includes(option.value);

                  if (shouldBeSelected !== isSelected) {
                    onPreferredEthnicityToggle(option.value);
                  }
                });
              }}
            >
              {preferredEthnicityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.title}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.selectionSummary}>{selectedEthnicitySummary}</div>
          <p className={styles.helper}>Hold Ctrl or Cmd to select more than one option.</p>
        </div>
      </div>
    </>
  );
}
