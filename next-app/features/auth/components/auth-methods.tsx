import styles from "../auth-page.module.scss";
import { futureMethods } from "../lib/auth-copy";

export function AuthMethods() {
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
