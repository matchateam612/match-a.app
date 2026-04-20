"use client";

import styles from "../../1-basics/page.module.scss";
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
        className={styles.stackCard}
        style={{
          minHeight: 420,
          alignContent: "center",
          background: "linear-gradient(180deg, #f8fafc, #ffffff)",
          border: "1px solid rgba(15, 23, 42, 0.08)",
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
      className={styles.stackCard}
      style={{
        minHeight: 420,
        gap: 14,
        background: "linear-gradient(180deg, #f8fafc, #ffffff)",
        border: "1px solid rgba(15, 23, 42, 0.08)",
      }}
    >
      <span className={styles.inlineLabel}>Conversation</span>
      <div style={{ display: "grid", gap: 14 }}>
        {transcript.map((message) => (
          <article
            key={message.id}
            style={{
              display: "grid",
              justifyItems: message.role === "assistant" ? "start" : "end",
            }}
          >
            <div
              style={{
                width: "min(100%, 640px)",
                display: "grid",
                gap: 6,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: message.role === "assistant" ? "flex-start" : "flex-end",
                  gap: 10,
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
              <div
                style={{
                  borderRadius: message.role === "assistant" ? "20px 20px 20px 8px" : "20px 20px 8px 20px",
                  padding: "14px 16px",
                  background:
                    message.role === "assistant"
                      ? "#ffffff"
                      : "linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-primary-soft))",
                  color: message.role === "assistant" ? "var(--color-text-primary)" : "#ffffff",
                  border:
                    message.role === "assistant"
                      ? "1px solid rgba(15, 23, 42, 0.08)"
                      : "1px solid transparent",
                  boxShadow:
                    message.role === "assistant"
                      ? "0 6px 18px rgba(15, 23, 42, 0.06)"
                      : "0 10px 24px rgba(147, 73, 55, 0.18)",
                }}
              >
                <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{message.text}</p>
              </div>
            </div>
          </article>
        ))}
        {pendingAssistantMessage ? (
          <article
            style={{
              display: "grid",
              justifyItems: "start",
            }}
          >
            <div
              style={{
                width: "min(100%, 640px)",
                display: "grid",
                gap: 6,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  gap: 10,
                  fontSize: 12,
                  color: "#64748b",
                  textTransform: "capitalize",
                }}
              >
                <span>assistant · streaming</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <div
                style={{
                  borderRadius: "20px 20px 20px 8px",
                  padding: "14px 16px",
                  background: "#ffffff",
                  color: "var(--color-text-primary)",
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                }}
              >
                <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {pendingAssistantMessage}
                </p>
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}
