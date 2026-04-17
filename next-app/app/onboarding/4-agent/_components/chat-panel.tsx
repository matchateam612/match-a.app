"use client";

import styles from "../../1-basics/page.module.scss";
import type { AgentConversationMode, AgentTranscriptItem } from "../_lib/agent-types";
import { TextInputBar } from "./text-input-bar";
import { TranscriptMessageList } from "./transcript-message-list";
import { VoiceSessionPanel } from "./voice-session-panel";

type ChatPanelProps = {
  selectedMode: AgentConversationMode | null;
  transcript: AgentTranscriptItem[];
  voiceStatusMessage: string;
  onSubmitTextTurn: (value: string) => void;
};

export function ChatPanel({
  selectedMode,
  transcript,
  voiceStatusMessage,
  onSubmitTextTurn,
}: ChatPanelProps) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {selectedMode === "voice" ? (
        <VoiceSessionPanel statusMessage={voiceStatusMessage} />
      ) : null}

      {selectedMode === "text" ? <TextInputBar onSubmit={onSubmitTextTurn} /> : null}

      {!selectedMode ? (
        <div className={styles.stackCard}>
          <span className={styles.inlineLabel}>Conversation engine</span>
          <p className={styles.helper}>
            Choose a mode first. Text and voice share the same transcript, criteria state, and completion logic.
          </p>
        </div>
      ) : null}

      <TranscriptMessageList transcript={transcript} />
    </div>
  );
}
