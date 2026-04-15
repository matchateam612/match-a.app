import styles from "../../page.module.scss";

type AgeStepProps = {
  age: string;
  onChange: (value: string) => void;
};

export function AgeStep({ age, onChange }: AgeStepProps) {
  return (
    <>
      <div className={styles.questionMeta}>
        <p className={styles.questionLabel}>Age</p>
        <h2 className={styles.questionTitle}>How old are you?</h2>
        <p className={styles.questionCopy}>
          We use this for compliance, age filtering, and to place you in the appropriate matching
          pool.
        </p>
      </div>

      <div className={styles.ageWrap}>
        <div className={styles.ageCard}>
          <span className={styles.inlineLabel}>Current age</span>
          <div className={styles.ageValue}>{age || "--"}</div>
          <p className={styles.helper}>You must be at least 18 to use Matcha.</p>
        </div>

        <label className={styles.fieldStack}>
          <span className={styles.inlineLabel}>Enter your age</span>
          <input
            className={styles.numberInput}
            inputMode="numeric"
            min={18}
            max={99}
            placeholder="18"
            type="number"
            value={age}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
      </div>
    </>
  );
}
