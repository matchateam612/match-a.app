"use client";

import styles from "../page.module.scss";

export type PendingDashboardMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type DashboardPendingMessageListProps = {
  messages: PendingDashboardMessage[];
};

export function DashboardPendingMessageList({ messages }: DashboardPendingMessageListProps) {
  return (
    <>
      {messages.map((message) =>
        message.role === "user" ? (
          <section className={styles.userMessageRow} key={message.id}>
            <div className={`${styles.userBubble} ${styles.pendingBubble}`.trim()}>{message.content}</div>
            <div className={styles.userAvatar}>Y</div>
          </section>
        ) : (
          <section className={styles.messageCluster} key={message.id}>
            <div className={styles.assistantAvatar}>✦</div>
            <div className={`${styles.assistantBubble} ${styles.pendingBubble}`.trim()}>
              {message.content}
            </div>
          </section>
        ),
      )}
    </>
  );
}
