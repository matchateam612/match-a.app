"use client";

import styles from "../../_shared/onboarding-shell.module.scss";
import type { AgentTranscriptItem } from "../_lib/agent-types";

type TranscriptMessageListProps = {
  transcript: AgentTranscriptItem[];
  pendingAssistantMessage?: string;
};

export function TranscriptMessageList({
  transcript,
  pendingAssistantMessage = "",
}: TranscriptMessageListProps) {
  if (!transcript.length && !pendingAssistantMessage) {
    return (
      <div className={styles.agentTranscriptEmpty}>
        <div className={styles.agentTranscriptEmptyBubble}>
          <p className={styles.helper} style={{ margin: 0 }}>
            Starting your conversation...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.agentTranscriptScroller}>
      <div className={styles.chatMessageList}>
        {transcript.map((message) => (
          <article
            key={message.id}
            className={`${styles.chatMessage} ${
              message.role === "assistant" ? styles.chatMessageAssistant : styles.chatMessageUser
            }`.trim()}
          >
            <div className={styles.chatMessageColumn}>
              <div
                className={`${styles.chatBubble} ${
                  message.role === "assistant" ? styles.chatBubbleAssistant : styles.chatBubbleUser
                }`.trim()}
              >
                <p className={styles.chatBubbleText}>{message.text}</p>
              </div>
            </div>
          </article>
        ))}
        {pendingAssistantMessage ? (
          <article className={`${styles.chatMessage} ${styles.chatMessageAssistant}`.trim()}>
            <div className={styles.chatMessageColumn}>
              <div className={`${styles.chatBubble} ${styles.chatBubbleAssistant}`.trim()}>
                <p className={styles.chatBubbleText}>{pendingAssistantMessage}</p>
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}
