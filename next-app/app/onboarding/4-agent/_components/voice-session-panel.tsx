"use client";

import styles from "../../1-basics/page.module.scss";
import type { AgentVoiceConnectionStatus } from "../_lib/agent-types";

type VoiceSessionPanelProps = {
  statusMessage: string;
  connectionStatus: AgentVoiceConnectionStatus;
  liveTranscript: string;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function VoiceSessionPanel({
  statusMessage,
  connectionStatus,
  liveTranscript,
  onConnect,
  onDisconnect,
}: VoiceSessionPanelProps) {
  const isConnected = connectionStatus === "connected";
  const isBusy = connectionStatus === "connecting" || connectionStatus === "requesting-permission";

  return (
    <div
      className={styles.stackCard}
      style={{
        border: "1px solid rgba(15, 23, 42, 0.08)",
        background: "#ffffff",
      }}
    >
      <span className={styles.inlineLabel}>Voice session</span>
      <p className={styles.helper} style={{ marginBottom: 12 }}>
        {statusMessage}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        <div style={{ border: "1px dashed rgba(15, 23, 42, 0.18)", borderRadius: 18, padding: 14 }}>
          <strong>Connection</strong>
          <p style={{ marginTop: 10, marginBottom: 0, textTransform: "capitalize" }}>
            {connectionStatus}
          </p>
        </div>
        <div style={{ border: "1px dashed rgba(15, 23, 42, 0.18)", borderRadius: 18, padding: 14 }}>
          <strong>Live transcript</strong>
          <p style={{ marginTop: 10, marginBottom: 0 }}>
            {liveTranscript || "Your current speech turn will appear here while OpenAI Realtime is transcribing it."}
          </p>
        </div>
        <div style={{ border: "1px dashed rgba(15, 23, 42, 0.18)", borderRadius: 18, padding: 14 }}>
          <strong>Controls</strong>
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              className={styles.nextButton}
              disabled={isConnected || isBusy}
              onClick={onConnect}
            >
              {isBusy ? "Connecting..." : "Start voice"}
            </button>
            <button
              type="button"
              className={styles.backButton}
              disabled={!isConnected}
              onClick={onDisconnect}
            >
              Stop voice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
