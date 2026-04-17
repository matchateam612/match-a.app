"use client";

import styles from "../../1-basics/page.module.scss";

type VoiceSessionPanelProps = {
  statusMessage: string;
};

export function VoiceSessionPanel({ statusMessage }: VoiceSessionPanelProps) {
  return (
    <div className={styles.stackCard}>
      <span className={styles.inlineLabel}>Voice session scaffold</span>
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
          Listening state placeholder
        </div>
        <div style={{ border: "1px dashed rgba(15, 23, 42, 0.18)", borderRadius: 18, padding: 14 }}>
          Live transcript placeholder
        </div>
        <div style={{ border: "1px dashed rgba(15, 23, 42, 0.18)", borderRadius: 18, padding: 14 }}>
          Realtime controls placeholder
        </div>
      </div>
    </div>
  );
}
