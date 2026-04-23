import styles from "../page.module.scss";

const threadDetails = {
  "tonight-plans": {
    title: "Tonight plans",
    message: "Tell me what kind of energy you want tonight, and I can help plan around it.",
  },
  "profile-tune-up": {
    title: "Profile tune-up",
    message: "We can refine your first impression, photo order, and opening prompts here.",
  },
  "match-strategy": {
    title: "Match strategy",
    message: "Bring me the people you are considering, and I can help you prioritize.",
  },
} as const;

type ThreadViewProps = {
  threadId: string;
};

export function ThreadView({ threadId }: ThreadViewProps) {
  const thread =
    threadDetails[threadId as keyof typeof threadDetails] ??
    threadDetails["tonight-plans"];

  return (
    <div className={styles.chatCanvas}>
      <section className={styles.homeHero}>
        <p className={styles.eyebrow}>Agent Thread</p>
        <h2 className={styles.homeTitle}>{thread.title}</h2>
      </section>

      <section className={styles.messageCluster}>
        <div className={styles.assistantAvatar}>✦</div>
        <div className={styles.assistantBubble}>{thread.message}</div>
      </section>
    </div>
  );
}
