"use client";

import type { DashboardMessage } from "@/lib/dashboard/chat-api";

import styles from "../page.module.scss";

type DashboardMessageListProps = {
  messages: DashboardMessage[];
};

export function DashboardMessageList({ messages }: DashboardMessageListProps) {
  return (
    <>
      {messages.map((message) =>
        message.role === "user" ? (
          <section className={styles.userMessageRow} key={message.id}>
            <div className={styles.userBubble}>{message.content}</div>
            <div className={styles.userAvatar}>Y</div>
          </section>
        ) : (
          <section className={styles.messageCluster} key={message.id}>
            <div className={styles.assistantAvatar}>✦</div>
            <div className={styles.assistantBubble}>{message.content}</div>
          </section>
        ),
      )}
    </>
  );
}
