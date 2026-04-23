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
      <div
        className={`${styles.stackCard} ${styles.agentSurfaceSoft}`.trim()}
        style={{
          minHeight: 240,
          alignContent: "center",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <span className={styles.inlineLabel}>Conversation</span>
          <p className={styles.helper}>
            No conversation yet. Once a mode is selected, the agent’s first message will appear here in the chat view.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.stackCard} ${styles.agentSurfaceSoft}`.trim()}
      style={{
        minHeight: 260,
        gap: 12,
      }}
    >
      <span className={styles.inlineLabel}>Conversation</span>
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
                className={`${styles.chatMessageMeta} ${
                  message.role === "assistant" ? styles.chatMessageMetaAssistant : styles.chatMessageMetaUser
                }`.trim()}
              >
                <span>{message.role === "assistant" ? "Matcha" : "You"}</span>
              </div>
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
              <div
                className={`${styles.chatMessageMeta} ${styles.chatMessageMetaAssistant}`.trim()}
              >
                <span>Matcha</span>
              </div>
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
