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
  isConfirmationSheetVisible: boolean;
  isSpeechMuted: boolean;
  pendingVoiceDraft: PendingVoiceDraft | null;
  onSetInputMode: (mode: AgentConversationMode) => void;
  onSubmitTextTurn: (value: string) => void;
  onSubmitVoiceBlob: (blob: Blob) => void;
  onRetryVoiceDraft: () => void;
  onDiscardVoiceDraft: () => void;
  onConfirmConversation: () => void;
  onKeepChatting: () => void;
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
  isConfirmationSheetVisible,
  isSpeechMuted,
  pendingVoiceDraft,
  onSetInputMode,
  onSubmitTextTurn,
  onSubmitVoiceBlob,
  onRetryVoiceDraft,
  onDiscardVoiceDraft,
  onConfirmConversation,
  onKeepChatting,
  onToggleSpeechMute,
}: ChatPanelProps) {
  const showComposer = status !== "complete" && !isConfirmationSheetVisible;

  return (
    <div className={styles.agentChatPanel}>
      <TranscriptMessageList transcript={transcript} pendingAssistantMessage={pendingAssistantMessage} />

      {status === "confirming" && isConfirmationSheetVisible ? (
        <div className={styles.agentConfirmCard}>
          <span className={styles.inlineLabel}>Confirm</span>
          <div className={styles.agentConfirmActions}>
            <button type="button" className={styles.backButton} onClick={onKeepChatting}>
              No
            </button>
            <button type="button" className={styles.nextButton} onClick={onConfirmConversation}>
              Confirm
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

      {selectedMode === "voice" ? (
        <button
          type="button"
          className={styles.agentChatMuteButton}
          onClick={onToggleSpeechMute}
          aria-label={isSpeechMuted ? "Unmute spoken replies" : "Mute spoken replies"}
        >
          {isSpeechMuted ? <SpeakerMutedIcon /> : <SpeakerIcon />}
        </button>
      ) : null}
    </div>
  );
}
