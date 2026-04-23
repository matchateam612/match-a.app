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

  return (
    <div
      className={styles.stackCard}
      style={{
        gap: 12,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
      }}
    >
      {pendingVoiceDraft ? (
        <div
          style={{
            display: "grid",
            gap: 10,
            padding: 12,
            borderRadius: 16,
            background: "rgba(255, 248, 237, 0.95)",
            border: "1px solid rgba(180, 83, 9, 0.18)",
          }}
        >
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

      {currentInputMode === "text" ? (
        <>
          <textarea
            className={styles.input}
            value={value}
            rows={2}
            disabled={disabled}
            placeholder={disabled ? "The agent is thinking..." : "Message the onboarding agent..."}
            onChange={(event) => setValue(event.target.value)}
            style={{
              minHeight: 82,
              resize: "none",
              borderRadius: 18,
              background: "#f8fafc",
              paddingTop: 16,
              paddingBottom: 16,
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => onSetInputMode(alternateMode)}
              disabled={disabled || !voiceModeEnabled}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <MicIcon />
              Voice
            </button>
            <button
              type="button"
              className={styles.nextButton}
              disabled={disabled || !value.trim()}
              onClick={() => {
                void onSubmitText(value.trim());
                setValue("");
              }}
            >
              Send
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gap: 8,
              justifyItems: "center",
              padding: "8px 0 2px",
            }}
          >
            <div
              style={{
                minHeight: 24,
                color: recordingState === "cancel-armed" ? "#b91c1c" : "var(--color-text-secondary)",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {instructions}
            </div>
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
              className={styles.nextButton}
              style={{
                width: 82,
                minWidth: 82,
                minHeight: 82,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                boxShadow:
                  recordingState === "cancel-armed"
                    ? "0 18px 36px rgba(185, 28, 28, 0.22)"
                    : "0 18px 36px rgba(147, 73, 55, 0.2)",
                background:
                  recordingState === "cancel-armed"
                    ? "linear-gradient(135deg, #dc2626, #ef4444)"
                    : undefined,
              }}
            >
              <span style={{ display: "grid", justifyItems: "center", gap: 8 }}>
                <MicIcon />
                <span>{recordingState === "recording" || recordingState === "cancel-armed" ? "Hold" : "Talk"}</span>
              </span>
            </button>
            <div style={{ minHeight: 20 }}>
              {recordingError ? (
                <p className={styles.helper} style={{ margin: 0, color: "#b91c1c" }}>
                  {recordingError}
                </p>
              ) : null}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <p className={styles.helper} style={{ margin: 0 }}>
              Release to send.
            </p>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => onSetInputMode(alternateMode)}
              disabled={disabled}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <KeyboardIcon />
              Keyboard
            </button>
          </div>
        </>
      )}
    </div>
  );
}
