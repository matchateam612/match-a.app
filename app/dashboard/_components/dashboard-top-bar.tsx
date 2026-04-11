import styles from "../page.module.scss";

export function DashboardTopBar() {
  return (
    <header className={styles.topBar}>
      <div className={styles.topBarInner}>
        <div className={styles.brand}>
          <span aria-hidden="true" className={styles.brandMark}>
            ✦
          </span>
          <h1 className={styles.brandName}>Glint</h1>
        </div>

        <div className={styles.topBarActions}>
          <button
            aria-label="Notifications"
            className={styles.iconButton}
            type="button"
          >
            ◌
          </button>
          <div aria-hidden="true" className={styles.avatar} />
        </div>
      </div>
    </header>
  );
}
