"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "../../_shared/onboarding-shell.module.scss";
import { useClientReady } from "@/app/onboarding/_shared/onboarding-storage";
import { OnboardingSectionStatus } from "@/app/onboarding/_shared/onboarding-section-status";
import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
import { getCurrentUser } from "@/lib/supabase/auth";
import { updateOnboardingStatusRequest } from "@/lib/supabase/onboarding-status-api";
import { upsertUserAgentProfile } from "@/lib/supabase/user-agent-profile";
import { upsertUserMatchesInfo } from "@/lib/supabase/user-matches-info";
import type {
  CreateInitialAgentTurnResponse,
} from "../_lib/agent-api-types";
import {
  getCappedStatus,
  isCreateInitialAgentTurnResponse,
  MAX_AGENT_TURNS,
  readStreamedAgentTurn,
} from "../_lib/agent-chat-client";
import {
  hasAgentDraftContent,
  persistAgentStateToIdb,
  readStoredAgentStateFromIdb,
} from "../_lib/agent-idb";
import { buildDraftSummary, createTranscriptItem } from "../_lib/agent-orchestrator";
import { readAgentPromptSettings, readTestingCriteriaDefinitions } from "../_lib/agent-storage";
import type { AgentOnboardingState, AgentConversationMode } from "../_lib/agent-types";
import { useAgentSpeechPlayback } from "../_lib/use-agent-speech-playback";
import { AgentLayout } from "./agent-layout";
import { AgentSummaryCard } from "./agent-summary-card";
import { ChatPanel } from "./chat-panel";
import { CompletionReview } from "./completion-review";

type PendingVoiceDraft = {
  blob: Blob;
  url: string;
  error: string;
};

export function AgentOnboarding() {
  const isClientReady = useClientReady();

  if (!isClientReady) {
    return (
      <AgentLayout
        eyebrow="Section 4"
        title="Agent conversation"
        description="Preparing your saved agent conversation..."
      >
        <div />
      </AgentLayout>
    );
  }

  return <AgentOnboardingClient />;
}

function AgentOnboardingClient() {
  const router = useRouter();
  const [isSubmittingTurn, setIsSubmittingTurn] = useState(false);
  const [isPreparingConversation, setIsPreparingConversation] = useState(false);
  const [pendingAssistantMessage, setPendingAssistantMessage] = useState("");
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSpeechMuted, setIsSpeechMuted] = useState(false);
  const [currentInputMode, setCurrentInputMode] = useState<AgentConversationMode>("text");
  const [pendingVoiceDraft, setPendingVoiceDraft] = useState<PendingVoiceDraft | null>(null);
  const [draft, setDraft] = useState<AgentOnboardingState>({
    sessionId: `agent-session-${Date.now()}`,
    selectedMode: null,
    turnCount: 0,
    status: "collecting",
    lastAskedCriterionId: null,
    criteria: [],
    transcript: [],
    finalSummary: null,
    completedAt: null,
  });
  const [progress, setProgress] = useState("collecting");
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [priorUserInfo, setPriorUserInfo] = useState<UserInfo>({});
  const promptSettings = readAgentPromptSettings();
  const criteriaDefinitions = readTestingCriteriaDefinitions();
  const userInfo: UserInfo = useMemo(
    () => ({
      ...priorUserInfo,
      agent: draft,
      agent_system_prompt: promptSettings.interviewerSystemPrompt,
    }),
    [draft, priorUserInfo, promptSettings.interviewerSystemPrompt],
  );
  const { cancelSpeech, queueSpeechFromText } = useAgentSpeechPlayback({
    enabled: draft.selectedMode === "voice",
    muted: isSpeechMuted,
  });

  useEffect(() => {
    return () => {
      if (pendingVoiceDraft) {
        URL.revokeObjectURL(pendingVoiceDraft.url);
      }
    };
  }, [pendingVoiceDraft]);

  useEffect(() => {
    let isCancelled = false;

    void readStoredAgentStateFromIdb(criteriaDefinitions, promptSettings)
      .then((storedState) => {
        if (isCancelled) {
          return;
        }

        setDraft(storedState.draft);
        setProgress(storedState.progress);
        setHasSavedDraft(storedState.hasSavedDraft);
        setCurrentInputMode(storedState.draft.selectedMode ?? "text");
        setPriorUserInfo(storedState.userInfo);
      })
      .catch(() => {
        if (!isCancelled) {
          setSaveError("We couldn't restore your saved agent conversation.");
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsHydrating(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [criteriaDefinitions, promptSettings]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    setHasSavedDraft(hasAgentDraftContent(draft, progress));

    void persistAgentStateToIdb({
      draft,
      progress,
      promptSettings,
      criteriaDefinitions,
    }).catch(() => {
      setSaveError("We couldn't save your agent draft on this device.");
    });
  }, [criteriaDefinitions, draft, isHydrating, progress, promptSettings]);

  const draftStatus = useMemo(() => {
    if (isHydrating) {
      return "Preparing your saved agent conversation...";
    }

    return hasSavedDraft
      ? "Saved on this device as you go."
      : "Your agent conversation will be saved on this device.";
  }, [hasSavedDraft, isHydrating]);

  const ensureInitialAssistantTurn = useCallback(async () => {
    if (
      isHydrating ||
      isPreparingConversation ||
      !draft.selectedMode ||
      draft.transcript.length > 0
    ) {
      return;
    }

    setIsPreparingConversation(true);
    setSaveError("");
    setSaveMessage("Preparing the opening message from your earlier onboarding answers.");

    try {
      const response = await fetch("/api/agent-turn/initial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedMode: draft.selectedMode,
          criteriaDefinitions,
          criteria: draft.criteria,
          interviewerSystemPrompt: promptSettings.interviewerSystemPrompt,
          userInfo,
        }),
      });

      const payload = (await response.json()) as CreateInitialAgentTurnResponse | { error?: string };

      if (!response.ok || !isCreateInitialAgentTurnResponse(payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "The initial agent turn request failed.",
        );
      }

      const initialTranscriptItem = createTranscriptItem({
        role: "assistant",
        modality: draft.selectedMode,
        text: payload.assistantMessage,
      });
      const nextStatus = getCappedStatus(draft.turnCount, payload.status);

      setDraft((current) => ({
        ...current,
        criteria: payload.criteria,
        transcript: [initialTranscriptItem],
        status: nextStatus,
        finalSummary: payload.draftSummary,
        lastAskedCriterionId: payload.lastAskedCriterionId,
      }));
      setProgress(nextStatus);
      setSaveMessage("Your onboarding conversation is ready.");

      if (draft.selectedMode === "voice") {
        cancelSpeech();
        queueSpeechFromText(payload.assistantMessage, true);
      }
    } catch (error) {
      setSaveMessage("");
      setSaveError(
        error instanceof Error ? error.message : "Could not prepare the first assistant turn.",
      );
    } finally {
      setIsPreparingConversation(false);
    }
  }, [
    cancelSpeech,
    criteriaDefinitions,
    draft.criteria,
    draft.selectedMode,
    draft.transcript.length,
    draft.turnCount,
    isHydrating,
    isPreparingConversation,
    promptSettings.interviewerSystemPrompt,
    queueSpeechFromText,
    userInfo,
  ]);

  useEffect(() => {
    void ensureInitialAssistantTurn();
  }, [ensureInitialAssistantTurn]);

  const submitUserTurn = useCallback(
    async (value: string, modality: AgentConversationMode) => {
      if (
        isSubmittingTurn ||
        !draft.selectedMode ||
        draft.turnCount >= MAX_AGENT_TURNS ||
        !value.trim()
      ) {
        return;
      }

      setSaveError("");
      setSaveMessage("");
      setIsSubmittingTurn(true);
      setPendingAssistantMessage("");
      cancelSpeech();

      const userTranscriptItem = createTranscriptItem({
        role: "user",
        modality,
        text: value.trim(),
      });

      const requestTranscript = [...draft.transcript, userTranscriptItem];
      const nextTurnCount = Math.min(draft.turnCount + 1, MAX_AGENT_TURNS);

      setDraft((current) => ({
        ...current,
        turnCount: nextTurnCount,
        transcript: requestTranscript,
      }));

      try {
        const response = await fetch("/api/agent-turn/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedMode: draft.selectedMode,
            userMessage: value.trim(),
            transcript: requestTranscript,
            criteriaDefinitions,
            criteria: draft.criteria,
            interviewerSystemPrompt: promptSettings.interviewerSystemPrompt,
          }),
        });

        if (!response.ok || !response.body) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "The streamed agent turn request failed.");
        }

        let streamedAssistantMessage = "";
        const completedPayload = await readStreamedAgentTurn({
          response,
          onDelta: (delta) => {
            streamedAssistantMessage += delta;
            setPendingAssistantMessage(streamedAssistantMessage);
            queueSpeechFromText(streamedAssistantMessage, false);
          },
        });

        const assistantText = completedPayload.assistantMessage || streamedAssistantMessage;
        queueSpeechFromText(assistantText, true);
        setPendingAssistantMessage("");

        setDraft((current) => ({
          ...current,
          criteria: completedPayload.criteria,
          transcript: [
            ...requestTranscript,
            createTranscriptItem({
              role: "assistant",
              modality: current.selectedMode ?? "text",
              text: assistantText,
            }),
          ],
          status: getCappedStatus(nextTurnCount, completedPayload.status),
          finalSummary: completedPayload.draftSummary,
          lastAskedCriterionId: completedPayload.lastAskedCriterionId,
        }));

        setProgress(getCappedStatus(nextTurnCount, completedPayload.status));
        setSaveMessage(
          nextTurnCount >= MAX_AGENT_TURNS
            ? "Reached the 20-turn cap. The conversation is now ready for summary confirmation."
            : "Agent turn streamed successfully.",
        );
      } catch (error) {
        setPendingAssistantMessage("");
        cancelSpeech();
        setSaveError(
          error instanceof Error ? error.message : "The agent turn could not be processed.",
        );
      } finally {
        setIsSubmittingTurn(false);
      }
    },
    [
      cancelSpeech,
      criteriaDefinitions,
      draft.criteria,
      draft.selectedMode,
      draft.transcript,
      draft.turnCount,
      isSubmittingTurn,
      promptSettings.interviewerSystemPrompt,
      queueSpeechFromText,
    ],
  );

  const onSubmitTextTurn = useCallback(
    async (value: string) => {
      await submitUserTurn(value, "text");
    },
    [submitUserTurn],
  );

  const onSubmitVoiceBlob = useCallback(
    async (blob: Blob) => {
      const formData = new FormData();
      formData.append("file", blob, "voice-note.webm");

      setSaveError("");
      setSaveMessage("Transcribing your voice note...");

      try {
        const response = await fetch("/api/agent-voice/transcribe", {
          method: "POST",
          body: formData,
        });
        const payload = (await response.json()) as { text?: string; error?: string };

        if (!response.ok || typeof payload.text !== "string" || !payload.text.trim()) {
          throw new Error(payload.error || "Voice transcription failed.");
        }

        if (pendingVoiceDraft) {
          URL.revokeObjectURL(pendingVoiceDraft.url);
          setPendingVoiceDraft(null);
        }

        await submitUserTurn(payload.text.trim(), "voice");
      } catch (error) {
        const nextDraft = {
          blob,
          url: URL.createObjectURL(blob),
          error: error instanceof Error ? error.message : "Voice transcription failed.",
        };

        if (pendingVoiceDraft) {
          URL.revokeObjectURL(pendingVoiceDraft.url);
        }

        setPendingVoiceDraft(nextDraft);
        setSaveError("");
        setSaveMessage("Voice note saved on this device. Retry when you're ready.");
      }
    },
    [pendingVoiceDraft, submitUserTurn],
  );

  const onRetryVoiceDraft = useCallback(async () => {
    if (!pendingVoiceDraft) {
      return;
    }

    await onSubmitVoiceBlob(pendingVoiceDraft.blob);
  }, [onSubmitVoiceBlob, pendingVoiceDraft]);

  const onDiscardVoiceDraft = useCallback(() => {
    if (!pendingVoiceDraft) {
      return;
    }

    URL.revokeObjectURL(pendingVoiceDraft.url);
    setPendingVoiceDraft(null);
    setSaveMessage("Discarded the unsent voice note.");
  }, [pendingVoiceDraft]);

  const draftSummary = buildDraftSummary(draft.criteria);
  const turnLimitReached = draft.turnCount >= MAX_AGENT_TURNS;
  const criteriaJson = JSON.stringify(draft.criteria, null, 2);

  const saveAgentProfile = useCallback(async () => {
    setSaveError("");
    setSaveMessage("");

    const nextDraft: AgentOnboardingState = {
      ...draft,
      status: "complete",
      finalSummary: draft.finalSummary ?? draftSummary,
      completedAt: draft.completedAt ?? new Date().toISOString(),
    };

    setDraft(nextDraft);
    setProgress("complete");

    try {
      const user = await getCurrentUser();

      if (!user) {
        throw new Error("Please sign in before saving your agent profile.");
      }

      await upsertUserAgentProfile(user.id, nextDraft);
      await upsertUserMatchesInfo({
        userId: user.id,
        agentSummary: nextDraft.finalSummary ?? draftSummary,
      });
      await updateOnboardingStatusRequest("finished");

      setSaveMessage("Your onboarding summary is saved.");
      router.push("/dashboard");
    } catch (error) {
      setSaveError(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't save your agent profile right now.",
      );
    }
  }, [draft, draftSummary, router]);

  if (!isHydrating && !draft.selectedMode) {
    return (
      <AgentLayout
        eyebrow="Section 4"
        title="Choose your conversation style first"
        description="Pick text-first or voice-first before starting this onboarding chat."
        footer={
          <button
            className={styles.backButton}
            type="button"
            onClick={() => router.push("/onboarding/4-agent")}
          >
            Back to modality picker
          </button>
        }
      >
        <div className={styles.stackCard}>
          <span className={styles.inlineLabel}>Missing setup</span>
          <p className={styles.helper} style={{ marginTop: 0, marginBottom: 0 }}>
            This chat route needs a saved modality choice first.
          </p>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout
      eyebrow="Section 4"
      title="Agent onboarding"
      description="One shared chat screen, with text-first or voice-first behavior depending on the style you picked."
      status={
        <OnboardingSectionStatus
          errorMessage={saveError}
          successMessage={saveMessage || draftStatus}
          errorClassName={`${styles.statusMessage} ${styles.statusError}`}
          successClassName={`${styles.statusMessage} ${styles.statusSuccess}`}
        />
      }
      footer={
        <>
          <button
            className={styles.backButton}
            type="button"
            onClick={() => router.push("/onboarding/4-agent")}
            disabled={isHydrating}
          >
            Back
          </button>
          <button
            className={styles.nextButton}
            type="button"
            onClick={() => void saveAgentProfile()}
            disabled={isHydrating}
          >
            Save progress
          </button>
        </>
      }
    >
      <ChatPanel
        selectedMode={draft.selectedMode}
        currentInputMode={currentInputMode}
        status={draft.status}
        transcript={draft.transcript}
        pendingAssistantMessage={pendingAssistantMessage}
        finalSummary={draft.finalSummary}
        isSubmittingTurn={isSubmittingTurn || isPreparingConversation || turnLimitReached}
        isSpeechMuted={isSpeechMuted}
        pendingVoiceDraft={pendingVoiceDraft ? { url: pendingVoiceDraft.url, error: pendingVoiceDraft.error } : null}
        onSetInputMode={setCurrentInputMode}
        onSubmitTextTurn={onSubmitTextTurn}
        onSubmitVoiceBlob={onSubmitVoiceBlob}
        onRetryVoiceDraft={onRetryVoiceDraft}
        onDiscardVoiceDraft={onDiscardVoiceDraft}
        onToggleSpeechMute={() => {
          setIsSpeechMuted((current) => !current);
        }}
        onConfirmConversation={() => {
          cancelSpeech();
          setDraft((current) => ({
            ...current,
            status: "complete",
            completedAt: new Date().toISOString(),
          }));
          setProgress("complete");
          setSaveMessage("Conversation confirmed.");
        }}
      />

      <AgentSummaryCard criteria={draft.criteria} finalSummary={draft.finalSummary} />

      <CompletionReview
        draftSummary={draftSummary}
        onApplySummary={() => {
          cancelSpeech();
          setDraft((current) => ({
            ...current,
            status: "confirming",
            finalSummary: draftSummary,
          }));
          setProgress("confirming");
          setSaveMessage("Draft summary applied. Review it before saving.");
        }}
      />

      <details className={styles.debugPanel}>
        <summary className={styles.debugSummary}>Conversation debug view</summary>
        <div className={styles.debugCard}>
          <span className={styles.inlineLabel}>Stored criteria JSON</span>
          <textarea
            className={styles.input}
            value={criteriaJson}
            readOnly
            rows={14}
            style={{ minHeight: 280, fontFamily: "monospace", resize: "vertical" }}
          />
          <p className={styles.helper}>
            Use this testing view to inspect the extracted criteria model and tune the conversation logic.
          </p>
        </div>

        <div className={styles.debugCard}>
          <span className={styles.inlineLabel}>Progress diagnostics</span>
          <p style={{ marginTop: 0, marginBottom: 8 }}>Session status: {progress}</p>
          <p style={{ marginTop: 0, marginBottom: 0 }}>Turns so far: {draft.turnCount}</p>
          {turnLimitReached ? (
            <p className={styles.helper} style={{ marginTop: 8, marginBottom: 0 }}>
              The 20-turn limit has been reached, so the current summary is being used for the final review step.
            </p>
          ) : null}
        </div>
      </details>
    </AgentLayout>
  );
}
