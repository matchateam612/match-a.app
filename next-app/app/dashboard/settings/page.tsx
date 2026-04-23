import styles from "../page.module.scss";

const memories = [
  {
    id: "relationship-pace",
    icon: "♡",
    title: "Prefers a steady relationship pace",
    source: "Learned during onboarding mentality setup",
  },
  {
    id: "communication",
    icon: "◌",
    title: "Values calm, direct communication",
    source: "Saved from agent profile context",
  },
  {
    id: "match-focus",
    icon: "✦",
    title: "Wants thoughtful match recommendations",
    source: "Used when Glint explains potential matches",
  },
] as const;

export default function DashboardSettingsPage() {
  return (
    <div className={styles.settingsPage}>
      <section className={styles.settingsIdentity}>
        <div className={styles.aiAvatarLarge}>
          <span aria-hidden="true">✦</span>
          <span className={styles.aiStatusDot} />
        </div>
        <div>
          <p className={styles.eyebrow}>Settings</p>
          <h2 className={styles.profilePageTitle}>Glint AI</h2>
          <span className={styles.aiModePill}>Supportive & Observant</span>
        </div>
      </section>

      <section className={styles.settingsSection}>
        <div className={styles.settingsSectionHeader}>
          <h3 className={styles.settingsTitle}>Memory Vault</h3>
          <button className={styles.textActionButton} type="button">
            Manage
          </button>
        </div>

        <div className={styles.memoryList}>
          {memories.map((memory) => (
            <article className={styles.memoryItem} key={memory.id}>
              <div className={styles.memoryIcon}>{memory.icon}</div>
              <div className={styles.memoryBody}>
                <h4>{memory.title}</h4>
                <p>{memory.source}</p>
              </div>
              <button
                aria-label={`Delete ${memory.title}`}
                className={styles.memoryDeleteButton}
                type="button"
              >
                ×
              </button>
            </article>
          ))}
        </div>

        <button className={styles.secondaryWideButton} type="button">
          View All Memories
        </button>
      </section>

      <section className={styles.settingsSection}>
        <h3 className={styles.settingsTitle}>Personality Profile</h3>
        <div className={styles.personalityPanel}>
          <div className={styles.settingRow}>
            <div>
              <h4>Deep Empathy Mode</h4>
              <p>Glint prioritizes emotional support before solutions.</p>
            </div>
            <button aria-pressed="true" className={styles.toggleOn} type="button">
              <span />
            </button>
          </div>

          <div className={styles.settingRow}>
            <div>
              <h4>Active Listening Memories</h4>
              <p>Extract key details from future conversations.</p>
            </div>
            <button aria-pressed="true" className={styles.toggleOn} type="button">
              <span />
            </button>
          </div>

          <div className={styles.observationControl}>
            <div className={styles.observationHeader}>
              <h4>Observation Level</h4>
              <span>Analytical</span>
            </div>
            <button
              aria-label="Observation level control"
              className={styles.rangePreview}
              type="button"
            >
              <span />
            </button>
            <div className={styles.rangeLabels}>
              <span>Intuitive</span>
              <span>Balanced</span>
              <span>Analytical</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.dangerPanel}>
        <h3>Danger Zone</h3>
        <p>
          Wiping Glint&apos;s memory will reset its understanding of your
          personality and preferences. This cannot be undone.
        </p>
        <button className={styles.dangerButton} type="button">
          Clear All Memories
        </button>
      </section>
    </div>
  );
}
