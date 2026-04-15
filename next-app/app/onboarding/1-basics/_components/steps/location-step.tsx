import styles from "../../page.module.scss";

type LocationStepProps = {
  city: string;
  onChange: (value: string) => void;
};

export function LocationStep({ city, onChange }: LocationStepProps) {
  return (
    <>
      <div className={styles.questionMeta}>
        <p className={styles.questionLabel}>Location</p>
        <h2 className={styles.questionTitle}>What city or region are you mainly in?</h2>
        <p className={styles.questionCopy}>
          We use this for geographic filtering and to support local or cross-city matching.
        </p>
      </div>

      <div className={styles.stackCard}>
        <label className={styles.fieldStack}>
          <span className={styles.inlineLabel}>City or region</span>
          <input
            className={styles.input}
            placeholder="San Francisco Bay Area"
            type="text"
            value={city}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>

        <p className={styles.helper}>
          Keep it broad enough for matching, like a city, metro area, or region.
        </p>
      </div>
    </>
  );
}
