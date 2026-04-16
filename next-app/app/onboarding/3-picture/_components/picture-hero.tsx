import styles from "../../1-basics/page.module.scss";

export function PictureHero() {
  return (
    <div className={styles.questionMeta}>
      <span className={styles.questionLabel}>Profile picture</span>
      <h2 className={styles.questionTitle}>Choose how you want to add your photo.</h2>
      <p className={styles.questionCopy}>
        Start with a real image of yourself. We create a manga-inspired portrait that softens the
        first impression while keeping recognizable traits like skin tone, hair color, and face
        structure.
      </p>
    </div>
  );
}
