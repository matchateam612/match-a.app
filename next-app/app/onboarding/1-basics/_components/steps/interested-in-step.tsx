import styles from "../../page.module.scss";
import { interestedInOptions } from "../basic-info-data";
import type { InterestedInOption } from "../basic-info-types";

type InterestedInStepProps = {
  interestedIn: InterestedInOption | "";
  interestedInCustom: string;
  onChange: (value: InterestedInOption) => void;
  onCustomChange: (value: string) => void;
};

export function InterestedInStep({
  interestedIn,
  interestedInCustom,
  onChange,
  onCustomChange,
}: InterestedInStepProps) {
  return (
    <>
      <div className={styles.questionMeta}>
        <p className={styles.questionLabel}>Who you want to meet</p>
        <h2 className={styles.questionTitle}>Which genders would you like to meet?</h2>
        <p className={styles.questionCopy}>
          This is one of the most important filters in the matching system, so we keep it front
          and center.
        </p>
      </div>

      <div className={styles.chipGrid}>
        {interestedInOptions.map((option) => (
          <button
            key={option.value}
            className={`${styles.chip} ${
              interestedIn === option.value ? styles.chipActive : ""
            }`.trim()}
            type="button"
            onClick={() => onChange(option.value)}
          >
            <span className={styles.chipTitle}>{option.title}</span>
            <span className={styles.chipCopy}>{option.copy}</span>
          </button>
        ))}
      </div>

      {interestedIn === "custom" ? (
        <label className={styles.fieldStack}>
          <span className={styles.inlineLabel}>Write your preference</span>
          <input
            className={styles.input}
            placeholder="Describe who you hope to meet"
            type="text"
            value={interestedInCustom}
            onChange={(event) => onCustomChange(event.target.value)}
          />
        </label>
      ) : null}
    </>
  );
}
