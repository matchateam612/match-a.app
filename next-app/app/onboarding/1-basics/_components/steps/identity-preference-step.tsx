import styles from "../../page.module.scss";
import { genderIdentityOptions, interestedInOptions } from "../basic-info-data";
import type { GenderIdentityOption, InterestedInOption } from "../basic-info-types";

type IdentityPreferenceStepProps = {
  genderIdentity: GenderIdentityOption | "";
  genderIdentityCustom: string;
  interestedIn: InterestedInOption | "";
  interestedInCustom: string;
  onGenderIdentityChange: (value: GenderIdentityOption) => void;
  onGenderIdentityCustomChange: (value: string) => void;
  onInterestedInChange: (value: InterestedInOption) => void;
  onInterestedInCustomChange: (value: string) => void;
};

export function IdentityPreferenceStep({
  genderIdentity,
  genderIdentityCustom,
  interestedIn,
  interestedInCustom,
  onGenderIdentityChange,
  onGenderIdentityCustomChange,
  onInterestedInChange,
  onInterestedInCustomChange,
}: IdentityPreferenceStepProps) {
  return (
    <>
      <div className={styles.questionMeta}>
        <p className={styles.questionLabel}>Identity and dating preference</p>
        <h2 className={styles.questionTitle}>Tell us who you are and who you want to meet.</h2>
        <p className={styles.questionCopy}>
          These two answers shape profile display and who enters your matching pool, so they now
          live on the same page.
        </p>
      </div>

      <div className={styles.stackCard}>
        <label className={styles.fieldStack}>
          <span className={styles.inlineLabel}>Gender identity</span>
          <select
            className={styles.selectInput}
            value={genderIdentity}
            onChange={(event) => onGenderIdentityChange(event.target.value as GenderIdentityOption)}
          >
            <option value="">Select one</option>
            {genderIdentityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.title}
              </option>
            ))}
          </select>
        </label>

        {genderIdentity === "custom" ? (
          <label className={styles.fieldStack}>
            <span className={styles.inlineLabel}>Write your identity</span>
            <input
              className={styles.input}
              placeholder="Describe your gender identity"
              type="text"
              value={genderIdentityCustom}
              onChange={(event) => onGenderIdentityCustomChange(event.target.value)}
            />
          </label>
        ) : null}

        <label className={styles.fieldStack}>
          <span className={styles.inlineLabel}>Interested in</span>
          <select
            className={styles.selectInput}
            value={interestedIn}
            onChange={(event) => onInterestedInChange(event.target.value as InterestedInOption)}
          >
            <option value="">Select one</option>
            {interestedInOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.title}
              </option>
            ))}
          </select>
        </label>

        {interestedIn === "custom" ? (
          <label className={styles.fieldStack}>
            <span className={styles.inlineLabel}>Write your preference</span>
            <input
              className={styles.input}
              placeholder="Describe who you hope to meet"
              type="text"
              value={interestedInCustom}
              onChange={(event) => onInterestedInCustomChange(event.target.value)}
            />
          </label>
        ) : null}
      </div>
    </>
  );
}
