import styles from "../page.module.scss";

const profileSections = [
  {
    id: "basic-info",
    eyebrow: "Section 1",
    title: "Basic Info",
    description:
      "Your foundational profile details, identity markers, and the quick facts people see first.",
    items: ["Name, age, and location", "Bio and headline", "Profile completeness"],
  },
  {
    id: "mentality",
    eyebrow: "Section 2",
    title: "Mentality",
    description:
      "Your dating intentions, relationship style, and the values that shape how you want to connect.",
    items: ["Relationship intent", "Lifestyle preferences", "Compatibility signals"],
  },
  {
    id: "pictures",
    eyebrow: "Section 3",
    title: "Pictures",
    description:
      "Your gallery, profile visuals, and the photos Glint can use to help present you clearly.",
    items: ["Primary profile photo", "Gallery uploads", "Visual coverage and balance"],
  },
  {
    id: "agent-memory",
    eyebrow: "Section 4",
    title: "Agent's Memory About You",
    description:
      "The notes and learned context your agent will reference when helping with matches, chats, and planning.",
    items: ["What Glint remembers", "Preference summaries", "Future editable memory controls"],
  },
] as const;

export default function DashboardProfilePage() {
  return (
    <div className={styles.stack}>
      <section className={styles.section}>
        <div className={styles.matchesIntro}>
          <p className={styles.eyebrow}>Profile</p>
          <h2 className={styles.sectionTitle}>Your Profile Hub</h2>
          <p className={styles.heroCopy}>
            Everything is organized into the same four profile areas from onboarding so
            it stays easy to revisit and expand.
          </p>
        </div>
      </section>

      <section className={styles.profileGrid}>
        {profileSections.map((section) => (
          <article className={styles.profileCard} key={section.id}>
            <div className={styles.profileCardHeader}>
              <p className={styles.eyebrow}>{section.eyebrow}</p>
              <h3 className={styles.profileCardTitle}>{section.title}</h3>
            </div>
            <p className={styles.profileCardDescription}>{section.description}</p>
            <div className={styles.profileMetaList}>
              {section.items.map((item) => (
                <span className={styles.profileMetaPill} key={item}>
                  {item}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
