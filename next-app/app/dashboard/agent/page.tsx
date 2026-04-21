import styles from "../page.module.scss";

const mockThreads = [
  {
    id: "tonight-plans",
    label: "Tonight plans",
    preview: "Find a date idea that fits my energy tonight.",
    active: true,
  },
  {
    id: "profile-tune-up",
    label: "Profile tune-up",
    preview: "Help me sharpen my bio and first impression.",
    active: false,
  },
  {
    id: "match-strategy",
    label: "Match strategy",
    preview: "Who should I respond to first this week?",
    active: false,
  },
] as const;

const mockMessages = [
  {
    id: "assistant-1",
    role: "assistant" as const,
    content:
      "Your agent workspace is ready. This will become your ongoing coaching and planning chat.",
  },
  {
    id: "user-1",
    role: "user" as const,
    content: "I want help deciding who to message first.",
  },
  {
    id: "assistant-2",
    role: "assistant" as const,
    content:
      "Once we wire this up, I can compare your matches, your preferences, and recent activity here.",
  },
] as const;

export default function DashboardAgentPage() {
  return (
    <div className={styles.agentLayout}>
      <section className={styles.threadPanel}>
        <div className={styles.threadPanelHeader}>
          <p className={styles.eyebrow}>Agent Threads</p>
          <button className={styles.threadAction} type="button">
            New Thread
          </button>
        </div>

        <div className={styles.threadList}>
          {mockThreads.map((thread) => (
            <button
              className={thread.active ? styles.threadItemActive : styles.threadItem}
              key={thread.id}
              type="button"
            >
              <span className={styles.threadTitle}>{thread.label}</span>
              <span className={styles.threadPreview}>{thread.preview}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.chatPanel}>
        <div className={styles.chatHeader}>
          <div>
            <p className={styles.eyebrow}>Agent</p>
            <h2 className={styles.chatTitle}>Glint Chat</h2>
          </div>
          <span className={styles.chatStatus}>Coming Soon</span>
        </div>

        <div className={styles.chatTranscript}>
          {mockMessages.map((message) => (
            <article
              className={
                message.role === "user" ? styles.chatBubbleUser : styles.chatBubbleAssistant
              }
              key={message.id}
            >
              <span className={styles.chatRoleLabel}>
                {message.role === "user" ? "You" : "Glint"}
              </span>
              <p>{message.content}</p>
            </article>
          ))}
        </div>

        <form className={styles.chatComposer}>
          <label className={styles.chatComposerLabel} htmlFor="agent-message">
            Message Glint
          </label>
          <textarea
            className={styles.chatInput}
            id="agent-message"
            placeholder="Ask Glint anything once chat is connected..."
            rows={4}
          />
          <div className={styles.chatComposerFooter}>
            <p className={styles.chatHint}>Thread switching and sending are visual only for now.</p>
            <button className={styles.chatSendButton} type="button">
              Send
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
