"use client";

import styles from "../../1-basics/page.module.scss";
import { summarizeCompletion } from "../_lib/agent-completion";
import type { AgentCriterionState } from "../_lib/agent-types";

type AgentSummaryCardProps = {
  criteria: AgentCriterionState[];
  finalSummary: string | null;
};

export function AgentSummaryCard({ criteria, finalSummary }: AgentSummaryCardProps) {
  const completion = summarizeCompletion(criteria);

  return (
    <div className={styles.stackCard}>
      <span className={styles.inlineLabel}>Current summary</span>
      <p style={{ marginTop: 0, marginBottom: 12 }}>
        {finalSummary ?? "No final summary yet. This scaffold will show a draft summary as criteria fill in."}
      </p>
      <p className={styles.helper} style={{ marginBottom: 16 }}>
        Required confirmed: {completion.confirmedRequiredCount} / {completion.requiredCount}
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        {criteria.map((criterion) => (
          <div
            key={criterion.id}
            style={{
              border: "1px solid rgba(15, 23, 42, 0.08)",
              borderRadius: 16,
              padding: 12,
              background: "#ffffff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <strong>{criterion.label}</strong>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {criterion.status} · {(criterion.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p style={{ marginTop: 8, marginBottom: 0 }}>
              {criterion.summary ?? criterion.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
