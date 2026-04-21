import styles from "../../page.module.scss";

type AgeStepProps = {
  age: string;
  phoneNumber: string;
  onAgeChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
};

export function AgeStep({
  age,
  phoneNumber,
  onAgeChange,
  onPhoneNumberChange,
}: AgeStepProps) {
  return (
    <>
      <div className={styles.questionMeta}>
        <p className={styles.questionLabel}>Age and phone number</p>
        <h2 className={styles.questionTitle}>Age and phone numbers</h2>
        <p className={styles.questionCopy}>
          We use this for compliance, account contact, and to place you in the appropriate
          matching pool.
        </p>
      </div>

      <div className={styles.ageWrap}>
        <label className={styles.fieldStack}>
          <span className={styles.inlineLabel}>Age</span>
          <input
            className={styles.numberInput}
            inputMode="numeric"
            min={0}
            max={99}
            placeholder="18"
            type="number"
            value={age}
            onChange={(event) => onAgeChange(event.target.value)}
          />
        </label>

        <label className={styles.fieldStack}>
          <span className={styles.inlineLabel}>Phone number</span>
          <input
            className={styles.input}
            autoComplete="tel"
            inputMode="tel"
            placeholder="(555) 123-4567"
            type="tel"
            value={phoneNumber}
            onChange={(event) => onPhoneNumberChange(event.target.value)}
          />
        </label>

        <p className={styles.helper}>You must be at least 18 to use Matcha.</p>
      </div>
    </>
  );
}
