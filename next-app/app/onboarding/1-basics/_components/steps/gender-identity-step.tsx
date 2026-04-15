import styles from "../../page.module.scss";
import { genderIdentityOptions } from "../basic-info-data";
import type { GenderIdentityOption } from "../basic-info-types";

type GenderIdentityStepProps = {
  genderIdentity: GenderIdentityOption | "";
  genderIdentityCustom: string;
  onChange: (value: GenderIdentityOption) => void;
  onCustomChange: (value: string) => void;
};

export function GenderIdentityStep({
  genderIdentity,
  genderIdentityCustom,
  onChange,
  onCustomChange,
}: GenderIdentityStepProps) {
  return (
    <>
      <div className={styles.questionMeta}>
        <p className={styles.questionLabel}>Gender identity</p>
        <h2 className={styles.questionTitle}>What is your gender identity?</h2>
        <p className={styles.questionCopy}>
          This is part of your core identity information and affects profile display and filtering.
        </p>
      </div>

      <div className={styles.chipGrid}>
        {genderIdentityOptions.map((option) => (
          <button
            key={option.value}
            className={`${styles.chip} ${
              genderIdentity === option.value ? styles.chipActive : ""
            }`.trim()}
            type="button"
            onClick={() => onChange(option.value)}
          >
            <span className={styles.chipTitle}>{option.title}</span>
            <span className={styles.chipCopy}>{option.copy}</span>
          </button>
        ))}
      </div>

      {genderIdentity === "custom" ? (
        <label className={styles.fieldStack}>
          <span className={styles.inlineLabel}>Write your identity</span>
          <input
            className={styles.input}
            placeholder="Describe your gender identity"
            type="text"
            value={genderIdentityCustom}
            onChange={(event) => onCustomChange(event.target.value)}
          />
        </label>
      ) : null}
    </>
  );
}
