"use client";

import styles from "../../1-basics/page.module.scss";
import type {
  AgentConversationMode,
  AgentConversationStatus,
  AgentTranscriptItem,
  AgentVoiceConnectionStatus,
} from "../_lib/agent-types";
import { TextInputBar } from "./text-input-bar";
import { TranscriptMessageList } from "./transcript-message-list";
import { VoiceSessionPanel } from "./voice-session-panel";

type ChatPanelProps = {
  selectedMode: AgentConversationMode | null;
  status: AgentConversationStatus;
  transcript: AgentTranscriptItem[];
  pendingAssistantMessage?: string;
  voiceStatusMessage: string;
  voiceConnectionStatus?: AgentVoiceConnectionStatus;
  liveVoiceTranscript?: string;
  isSubmittingTurn?: boolean;
  finalSummary: string | null;
  onSubmitTextTurn: (value: string) => void;
  onConfirmConversation: () => void;
  onConnectVoice: () => void;
  onDisconnectVoice: () => void;
};

export function ChatPanel({
  selectedMode,
  status,
  transcript,
  pendingAssistantMessage = "",
  voiceStatusMessage,
  voiceConnectionStatus = "idle",
  liveVoiceTranscript = "",
  isSubmittingTurn = false,
  finalSummary,
  onSubmitTextTurn,
  onConfirmConversation,
  onConnectVoice,
  onDisconnectVoice,
}: ChatPanelProps) {
  const showComposer = selectedMode === "text" && status !== "confirming" && status !== "complete";

  return (
    <div
      className={styles.stackCard}
      style={{
        gap: 16,
        padding: 18,
        background: "#eef4ff",
        border: "1px solid rgba(29, 78, 216, 0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <span className={styles.inlineLabel}>AI conversation</span>
          <p className={styles.helper} style={{ marginTop: 6, marginBottom: 0 }}>
            Familiar chat layout for testing the onboarding agent before voice is added.
          </p>
        </div>
        {selectedMode ? (
          <span className={styles.selectionSummary}>
            {selectedMode === "text" ? "Text mode" : "Voice mode"} · {status}
          </span>
        ) : null}
      </div>

      {selectedMode === "voice" ? (
        <VoiceSessionPanel
          statusMessage={voiceStatusMessage}
          connectionStatus={voiceConnectionStatus}
          liveTranscript={liveVoiceTranscript}
          onConnect={onConnectVoice}
          onDisconnect={onDisconnectVoice}
        />
      ) : null}

      {!selectedMode ? (
        <div className={styles.stackCard}>
          <span className={styles.inlineLabel}>Conversation engine</span>
          <p className={styles.helper}>
            Choose a mode first. Text and voice share the same transcript, criteria state, and completion logic.
          </p>
        </div>
      ) : null}

      <TranscriptMessageList
        transcript={transcript}
        pendingAssistantMessage={selectedMode === "text" ? pendingAssistantMessage : ""}
      />

      {status === "confirming" ? (
        <div
          className={styles.stackCard}
          style={{
            border: "1px solid rgba(16, 185, 129, 0.18)",
            background: "linear-gradient(180deg, rgba(236, 253, 245, 0.92), #ffffff)",
          }}
        >
          <span className={styles.inlineLabel}>Ready to finish</span>
          <p style={{ marginTop: 0, marginBottom: 8 }}>
            The agent believes every criterion is strongly confirmed with at least 80% confidence.
          </p>
          {finalSummary ? <p style={{ marginTop: 0, marginBottom: 8 }}>{finalSummary}</p> : null}
          <p className={styles.helper} style={{ marginTop: 0 }}>
            If this summary matches what the user meant, confirm and end the onboarding chat.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="button" className={styles.nextButton} onClick={onConfirmConversation}>
              Confirm and finish
            </button>
          </div>
        </div>
      ) : null}

      {showComposer ? (
        <TextInputBar
          disabled={isSubmittingTurn}
          placeholder={isSubmittingTurn ? "The agent is thinking..." : "Message the onboarding agent..."}
          submitLabel={isSubmittingTurn ? "Sending..." : "Send"}
          onSubmit={onSubmitTextTurn}
        />
      ) : null}
    </div>
  );
}
