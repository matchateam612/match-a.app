"use client";

import styles from "../../_shared/onboarding-shell.module.scss";
import type {
  AgentConversationMode,
  AgentConversationStatus,
  AgentTranscriptItem,
} from "../_lib/agent-types";
import { AgentComposer } from "./agent-composer";
import { TranscriptMessageList } from "./transcript-message-list";

type PendingVoiceDraft = {
  url: string;
  error: string;
};

type ChatPanelProps = {
  selectedMode: AgentConversationMode | null;
  currentInputMode: AgentConversationMode;
  status: AgentConversationStatus;
  transcript: AgentTranscriptItem[];
  pendingAssistantMessage?: string;
  isSubmittingTurn?: boolean;
  finalSummary: string | null;
  isSpeechMuted: boolean;
  pendingVoiceDraft: PendingVoiceDraft | null;
  onSetInputMode: (mode: AgentConversationMode) => void;
  onSubmitTextTurn: (value: string) => void;
  onSubmitVoiceBlob: (blob: Blob) => void;
  onRetryVoiceDraft: () => void;
  onDiscardVoiceDraft: () => void;
  onConfirmConversation: () => void;
  onToggleSpeechMute: () => void;
};

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M5 14h3l4 4V6L8 10H5zM16 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpeakerMutedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M5 14h3l4 4V6L8 10H5zM16 9l4 6M20 9l-4 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChatPanel({
  selectedMode,
  currentInputMode,
  status,
  transcript,
  pendingAssistantMessage = "",
  isSubmittingTurn = false,
  finalSummary,
  isSpeechMuted,
  pendingVoiceDraft,
  onSetInputMode,
  onSubmitTextTurn,
  onSubmitVoiceBlob,
  onRetryVoiceDraft,
  onDiscardVoiceDraft,
  onConfirmConversation,
  onToggleSpeechMute,
}: ChatPanelProps) {
  const showComposer = status !== "confirming" && status !== "complete";

    return (
      <div
      className={`${styles.stackCard} ${styles.agentSurface}`.trim()}
      style={{
        gap: 16,
        padding: 18,
        border: "1px solid rgba(29, 78, 216, 0.08)",
        background: "#eef4ff",
      }}
    >
      <div className={`${styles.rowBetween} ${styles.rowWrap}`.trim()}>
        <div>
          <span className={styles.inlineLabel}>AI conversation</span>
          <p className={styles.helper} style={{ marginTop: 6, marginBottom: 0 }}>
            One transcript, one summary engine, and a switchable input method.
          </p>
        </div>
        <div className={styles.rowWrap}>
          {selectedMode ? (
            <span className={styles.selectionSummary}>
              {selectedMode === "text" ? "Text-first" : "Voice-first"} · {status}
            </span>
          ) : null}
          {selectedMode === "voice" ? (
            <button
              type="button"
              className={`${styles.backButton} ${styles.inlineButtonIcon}`.trim()}
              onClick={onToggleSpeechMute}
            >
              {isSpeechMuted ? <SpeakerMutedIcon /> : <SpeakerIcon />}
              {isSpeechMuted ? "Unmute" : "Mute"}
            </button>
          ) : null}
        </div>
      </div>

      <TranscriptMessageList transcript={transcript} pendingAssistantMessage={pendingAssistantMessage} />

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
            The chat is ready to wrap with the current summary.
          </p>
          {finalSummary ? <p style={{ marginTop: 0, marginBottom: 8 }}>{finalSummary}</p> : null}
          <p className={styles.helper} style={{ marginTop: 0 }}>
            If this summary matches what the user meant, confirm and end the onboarding chat.
          </p>
          <div className={styles.rowEnd}>
            <button type="button" className={styles.nextButton} onClick={onConfirmConversation}>
              Confirm and finish
            </button>
          </div>
        </div>
      ) : null}

      {showComposer ? (
        <AgentComposer
          currentInputMode={currentInputMode}
          disabled={isSubmittingTurn}
          voiceModeEnabled
          pendingVoiceDraft={pendingVoiceDraft}
          onSetInputMode={onSetInputMode}
          onSubmitText={onSubmitTextTurn}
          onSubmitVoiceBlob={onSubmitVoiceBlob}
          onRetryVoiceDraft={onRetryVoiceDraft}
          onDiscardVoiceDraft={onDiscardVoiceDraft}
        />
      ) : null}
    </div>
  );
}
