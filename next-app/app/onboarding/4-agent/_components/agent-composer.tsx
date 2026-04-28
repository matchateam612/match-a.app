"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import styles from "../../_shared/onboarding-shell.module.scss";
import type { AgentConversationMode } from "../_lib/agent-types";

type PendingVoiceDraft = {
  url: string;
  error: string;
};

type AgentComposerProps = {
  currentInputMode: AgentConversationMode;
  disabled?: boolean;
  voiceModeEnabled?: boolean;
  pendingVoiceDraft: PendingVoiceDraft | null;
  onSetInputMode: (mode: AgentConversationMode) => void;
  onSubmitText: (value: string) => void | Promise<void>;
  onSubmitVoiceBlob: (blob: Blob) => void | Promise<void>;
  onRetryVoiceDraft: () => void;
  onDiscardVoiceDraft: () => void;
};

function KeyboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M7 13h.01M10 13h.01M13 13h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M8.5 21h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function useVoiceNoteRecorder({
  disabled,
  onSubmitVoiceBlob,
}: {
  disabled: boolean;
  onSubmitVoiceBlob: (blob: Blob) => void | Promise<void>;
}) {
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "cancel-armed" | "processing">("idle");
  const [recordingError, setRecordingError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const pointerIdRef = useRef<number | null>(null);
  const startYRef = useRef(0);
  const recordingStateRef = useRef<"idle" | "recording" | "cancel-armed" | "processing">("idle");

  useEffect(() => {
    recordingStateRef.current = recordingState;
  }, [recordingState]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const instructions = useMemo(() => {
    if (recordingState === "cancel-armed") {
      return "Release now to cancel this voice note.";
    }

    if (recordingState === "processing") {
      return "Transcribing your voice note...";
    }

    if (recordingState === "recording") {
      return "Hold to keep recording. Slide up to cancel.";
    }

    return "Hold to talk. Release to send.";
  }, [recordingState]);

  async function beginRecording(pointerId: number, startY: number) {
    if (disabled || recordingState === "processing") {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordingError("This browser does not support microphone recording here.");
      return;
    }

    setRecordingError("");
    chunksRef.current = [];
    pointerIdRef.current = pointerId;
    startYRef.current = startY;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : undefined,
      });

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });
      mediaRecorder.addEventListener("stop", () => {
        const shouldCancel = recordingStateRef.current === "cancel-armed";
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        chunksRef.current = [];

        if (shouldCancel || blob.size === 0) {
          setRecordingState("idle");
          return;
        }

        setRecordingState("processing");
        Promise.resolve(onSubmitVoiceBlob(blob))
          .catch((error) => {
            setRecordingError(
              error instanceof Error ? error.message : "We couldn't process that voice note.",
            );
          })
          .finally(() => {
            setRecordingState("idle");
          });
      });
      mediaRecorder.start();
      setRecordingState("recording");
    } catch (error) {
      setRecordingError(
        error instanceof Error ? error.message : "We couldn't access your microphone.",
      );
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      setRecordingState("idle");
    }
  }

  function updateRecordingPosition(clientY: number) {
    if (pointerIdRef.current === null || recordingState === "idle" || recordingState === "processing") {
      return;
    }

    const deltaY = clientY - startYRef.current;
    setRecordingState(deltaY <= -72 ? "cancel-armed" : "recording");
  }

  function finishRecording() {
    pointerIdRef.current = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      return;
    }

    setRecordingState("idle");
  }

  return {
    instructions,
    recordingState,
    recordingError,
    beginRecording,
    updateRecordingPosition,
    finishRecording,
  };
}

export function AgentComposer({
  currentInputMode,
  disabled = false,
  voiceModeEnabled = true,
  pendingVoiceDraft,
  onSetInputMode,
  onSubmitText,
  onSubmitVoiceBlob,
  onRetryVoiceDraft,
  onDiscardVoiceDraft,
}: AgentComposerProps) {
  const [value, setValue] = useState("");
  const {
    instructions,
    recordingState,
    recordingError,
    beginRecording,
    updateRecordingPosition,
    finishRecording,
  } = useVoiceNoteRecorder({
    disabled,
    onSubmitVoiceBlob,
  });

  const alternateMode = currentInputMode === "text" ? "voice" : "text";
  const isRecording = recordingState === "recording" || recordingState === "cancel-armed";

  return (
    <div className={styles.agentComposerDock}>
      {pendingVoiceDraft ? (
        <div className={styles.agentVoiceDraftCard}>
          <strong style={{ fontSize: 14 }}>Voice note needs a retry</strong>
          <p className={styles.helper} style={{ margin: 0 }}>
            {pendingVoiceDraft.error}
          </p>
          <audio controls src={pendingVoiceDraft.url} style={{ width: "100%" }} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className={styles.nextButton} onClick={onRetryVoiceDraft} disabled={disabled}>
              Retry transcription
            </button>
            <button type="button" className={styles.backButton} onClick={onDiscardVoiceDraft} disabled={disabled}>
              Discard
            </button>
          </div>
        </div>
      ) : null}

      {isRecording ? (
        <div className={styles.agentVoiceRecordingHint} aria-live="polite">
          <div className={styles.agentVoiceWave} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className={styles.agentVoiceRecordingText}>
            {recordingState === "cancel-armed" ? "Release to cancel" : "Listening... swipe up to cancel"}
          </p>
        </div>
      ) : null}

      <div className={styles.agentComposerBar}>
        <button
          type="button"
          className={styles.agentComposerModeButton}
          onClick={() => onSetInputMode(alternateMode)}
          disabled={disabled || (currentInputMode === "text" ? !voiceModeEnabled : false)}
          aria-label={currentInputMode === "text" ? "Switch to voice input" : "Switch to keyboard input"}
        >
          {currentInputMode === "text" ? <MicIcon /> : <KeyboardIcon />}
        </button>

        {currentInputMode === "text" ? (
          <>
            <textarea
              className={styles.agentComposerInput}
              value={value}
              rows={1}
              disabled={disabled}
              placeholder={disabled ? "Thinking..." : "Message"}
              onChange={(event) => setValue(event.target.value)}
            />
            <button
              type="button"
              className={styles.agentComposerSendButton}
              disabled={disabled || !value.trim()}
              onClick={() => {
                void onSubmitText(value.trim());
                setValue("");
              }}
            >
              Send
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onPointerDown={(event) => {
              event.preventDefault();
              void beginRecording(event.pointerId, event.clientY);
            }}
            onPointerMove={(event) => {
              updateRecordingPosition(event.clientY);
            }}
            onPointerUp={() => {
              finishRecording();
            }}
            onPointerCancel={() => {
              finishRecording();
            }}
            className={`${styles.agentHoldToTalkButton} ${
              recordingState === "cancel-armed" ? styles.agentHoldToTalkCancel : ""
            }`.trim()}
          >
            {isRecording ? (
              <span className={styles.agentHoldToTalkWave} aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </span>
            ) : (
              <span className={styles.agentHoldToTalkLabel}>{instructions}</span>
            )}
          </button>
        )}
      </div>

      {recordingError ? (
        <p className={styles.agentComposerError}>{recordingError}</p>
      ) : null}
    </div>
  );
}
