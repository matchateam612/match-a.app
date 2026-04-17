import styles from "../../1-basics/page.module.scss";

export function PictureHero() {
  return (
    <div className={styles.questionMeta}>
      <span className={styles.questionLabel}>Profile picture</span>
      <h2 className={styles.questionTitle}>Choose how you want to add your photo.</h2>
      <p className={styles.questionCopy}>
        Start with a real image of yourself. We convert it to a clean JPEG, let you optionally run
        an AI enhancement prompt on it, and upload the final profile photo when you finish this
        section.
      </p>
    </div>
  );
}
