import styles from "../page.module.scss";

const futureMethods = [
  {
    title: "Continue with Google",
    copy: "Reserved for the next auth method rollout.",
  },
  {
    title: "More sign-in options",
    copy: "Apple, magic links, or phone can live here later.",
  },
];

export function SignupMethods() {
  return (
    <div>
      <div className={styles.divider}>More ways to join</div>

      <div className={styles.methods}>
        {futureMethods.map((method) => (
          <button key={method.title} className={styles.methodButton} type="button" disabled>
            <span className={styles.methodMeta}>
              <span className={styles.methodTitle}>{method.title}</span>
              <span className={styles.methodCopy}>{method.copy}</span>
            </span>

            <span className={styles.methodPill}>Soon</span>
          </button>
        ))}
      </div>
    </div>
  );
}
