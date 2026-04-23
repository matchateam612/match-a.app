import styles from "../page.module.scss";

const matchDetails = {
  annie: {
    name: "Annie",
    age: 27,
    location: "Boston",
    note:
      "Annie looks aligned with your preference for calm weekends, design-minded conversations, and long-term intent.",
    tags: ["Design", "Coffee walks", "Long-term"],
  },
  sunny: {
    name: "Sunny",
    age: 29,
    location: "Cambridge",
    note:
      "Sunny shares your interest in community events and low-pressure first dates.",
    tags: ["Community", "Live music", "Warm energy"],
  },
  cherry: {
    name: "Cherry",
    age: 26,
    location: "Somerville",
    note:
      "Cherry has overlapping creative interests and a similar communication style.",
    tags: ["Creative", "Bookstores", "Playful"],
  },
} as const;

type MatchThreadViewProps = {
  matchId: string;
};

export function MatchThreadView({ matchId }: MatchThreadViewProps) {
  const match =
    matchDetails[matchId as keyof typeof matchDetails] ?? matchDetails.annie;

  return (
    <div className={styles.chatCanvas}>
      <section className={styles.messageCluster}>
        <div className={styles.assistantAvatar}>✦</div>
        <div className={styles.messageStack}>
          <div className={styles.assistantBubble}>
            I found someone worth looking at. {match.note} Would you like to
            explore what you two have in common?
          </div>

          <article className={styles.matchFeatureCard}>
            <div className={styles.matchPhoto}>
              <span>{match.name.slice(0, 1)}</span>
            </div>
            <div className={styles.matchCardBody}>
              <div>
                <h3 className={styles.matchName}>
                  {match.name}, {match.age}
                </h3>
                <p className={styles.matchLocation}>{match.location}</p>
              </div>
              <div className={styles.matchTags}>
                {match.tags.map((tag) => (
                  <span className={styles.matchTag} key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.userMessageRow}>
        <div className={styles.userBubble}>
          She seems interesting. Tell me more about the strongest overlap.
        </div>
        <div className={styles.userAvatar}>A</div>
      </section>
    </div>
  );
}
