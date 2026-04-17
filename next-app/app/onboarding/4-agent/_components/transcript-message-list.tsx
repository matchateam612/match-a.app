"use client";

import styles from "../../1-basics/page.module.scss";
import type { AgentTranscriptItem } from "../_lib/agent-types";

type TranscriptMessageListProps = {
  transcript: AgentTranscriptItem[];
};

export function TranscriptMessageList({ transcript }: TranscriptMessageListProps) {
  if (!transcript.length) {
    return (
      <div className={styles.stackCard}>
        <span className={styles.inlineLabel}>Transcript</span>
        <p className={styles.helper}>
          No conversation yet. The first assistant message will appear after you choose a mode.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.stackCard}>
      <span className={styles.inlineLabel}>Transcript</span>
      <div style={{ display: "grid", gap: 12 }}>
        {transcript.map((message) => (
          <article
            key={message.id}
            style={{
              border: "1px solid rgba(15, 23, 42, 0.08)",
              borderRadius: 18,
              padding: 14,
              background: message.role === "assistant" ? "#f8fafc" : "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 6,
                fontSize: 12,
                color: "#64748b",
                textTransform: "capitalize",
              }}
            >
              <span>
                {message.role} · {message.modality}
              </span>
              <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
            </div>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
