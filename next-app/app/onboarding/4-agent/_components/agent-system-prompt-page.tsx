"use client";

import Link from "next/link";
import { useState } from "react";

import styles from "../../_shared/onboarding-shell.module.scss";
import { useClientReady } from "@/app/onboarding/_shared/onboarding-storage";
import { DEFAULT_INTERVIEWER_SYSTEM_PROMPT } from "../_lib/agent-prompts";
import { readAgentPromptSettings, writeAgentPromptSettings } from "../_lib/agent-storage";
import { AgentLayout } from "./agent-layout";

export function AgentSystemPromptPage() {
  const isClientReady = useClientReady();

  if (!isClientReady) {
    return (
      <AgentLayout
        eyebrow="Testing"
        title="Agent1 system prompt"
        description="Preparing local system prompt controls..."
      >
        <div />
      </AgentLayout>
    );
  }

  return <AgentSystemPromptPageClient />;
}

function AgentSystemPromptPageClient() {
  const storedSettings = readAgentPromptSettings();
  const [promptValue, setPromptValue] = useState(storedSettings.interviewerSystemPrompt);
  const [saveMessage, setSaveMessage] = useState("");

  return (
    <AgentLayout
      eyebrow="Testing"
      title="Agent1 system prompt"
      description="Edit the interviewer prompt locally so we can test different conversation styles without touching code."
      status={
        saveMessage ? (
          <p className={`${styles.statusMessage} ${styles.statusSuccess}`}>{saveMessage}</p>
        ) : null
      }
      footer={
        <>
          <Link href="/onboarding/4-agent/testing" className={styles.backButton}>
            Back to testing
          </Link>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => {
                setPromptValue(DEFAULT_INTERVIEWER_SYSTEM_PROMPT);
                setSaveMessage("Prompt reset locally. Save to apply it.");
              }}
            >
              Reset
            </button>
            <button
              type="button"
              className={styles.nextButton}
              onClick={() => {
                writeAgentPromptSettings({
                  interviewerSystemPrompt: promptValue,
                });
                setSaveMessage("System prompt saved locally. The section and testing pages now read from this value.");
              }}
            >
              Save prompt
            </button>
          </div>
        </>
      }
    >
      <div className={styles.stackCard}>
        <span className={styles.inlineLabel}>Interviewer system prompt</span>
        <textarea
          className={styles.input}
          value={promptValue}
          rows={18}
          onChange={(event) => {
            setPromptValue(event.target.value);
            setSaveMessage("");
          }}
          style={{ minHeight: 360, resize: "vertical" }}
        />
        <p className={styles.helper}>
          This page is intentionally scoped to Agent1, the interviewer. When we wire in the real model calls later, this stored prompt should become the prompt source for that agent.
        </p>
      </div>

      <div className={styles.stackCard}>
        <span className={styles.inlineLabel}>Prompting reminders</span>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Ask one focused thing at a time.</li>
          <li>Do not ask about criteria that are already clear.</li>
          <li>Reflect back what has been learned before ending.</li>
          <li>Confirm the final summary before the app saves it.</li>
        </ul>
      </div>
    </AgentLayout>
  );
}
