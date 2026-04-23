"use client";

import styles from "../page.module.scss";

type DashboardTopBarProps = {
  onMenuClick: () => void;
};

export function DashboardTopBar({ onMenuClick }: DashboardTopBarProps) {
  return (
    <header className={styles.topBar}>
      <div className={styles.topBarInner}>
        <button
          aria-label="Open menu"
          className={styles.iconButton}
          onClick={onMenuClick}
          type="button"
        >
          ☰
        </button>

        <div className={styles.brand}>
          <span aria-hidden="true" className={styles.brandMark}>
            ✦
          </span>
          <h1 className={styles.brandName}>Glint</h1>
        </div>

        <div className={styles.topBarActions}>
          <button
            aria-label="More options"
            className={styles.iconButton}
            type="button"
          >
            ⋯
          </button>
          <div className={styles.avatar}>
            <div aria-hidden="true" className={styles.avatarFallback} />
          </div>
        </div>
      </div>
    </header>
  );
}
