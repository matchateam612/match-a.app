"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "../../1-basics/page.module.scss";
import { useClientReady } from "@/app/onboarding/_shared/onboarding-storage";
import { OnboardingSectionStatus } from "@/app/onboarding/_shared/onboarding-section-status";
import { useOnboardingSectionState } from "@/app/onboarding/_shared/use-onboarding-section-state";
import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
import type { SubmitAgentTurnResponse } from "../_lib/agent-api-types";
import { defaultAgentCriteria } from "../_lib/agent-criteria";
import { buildDraftSummary, buildStarterAssistantMessage, createTranscriptItem } from "../_lib/agent-orchestrator";
import { hasAgentDraftContent, persistAgentState, readAgentPromptSettings, readStoredAgentState, readTestingCriteriaDefinitions } from "../_lib/agent-storage";
import { useAgentVoiceSession } from "../_lib/use-agent-voice-session";
import { getVoiceScaffoldStatus } from "../_lib/agent-voice";
import type { AgentOnboardingState, AgentConversationMode } from "../_lib/agent-types";
import { AgentLayout } from "./agent-layout";
import { AgentSummaryCard } from "./agent-summary-card";
import { ChatPanel } from "./chat-panel";
import { CompletionReview } from "./completion-review";
import { ModePicker } from "./mode-picker";

function isSubmitAgentTurnResponse(
  payload: SubmitAgentTurnResponse | { error?: string },
): payload is SubmitAgentTurnResponse {
  return (
    "criteria" in payload &&
    "assistantMessage" in payload &&
    "draftSummary" in payload &&
    "status" in payload
  );
}

export function AgentOnboarding() {
  const isClientReady = useClientReady();

  if (!isClientReady) {
    return (
      <AgentLayout
        eyebrow="Section 4"
        title="Agent onboarding"
        description="Preparing your saved agent conversation scaffold..."
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
  const promptSettings = readAgentPromptSettings();
  const criteriaDefinitions = readTestingCriteriaDefinitions();

  const buildUserInfo = useCallback(
    ({
      draft,
      storedUserInfo,
    }: {
      draft: AgentOnboardingState;
      progress: string;
      storedUserInfo: UserInfo;
    }) => ({
      ...storedUserInfo,
      agent: draft,
    }),
    [],
  );

  const persistState = useCallback(
    ({ draft, progress, userInfo }: { draft: AgentOnboardingState; progress: string; userInfo: UserInfo }) => {
      persistAgentState({ draft, progress, userInfo });
    },
    [],
  );

  const {
    draft,
    setDraft,
    progress,
    setProgress,
    draftStatus,
    saveMessage,
    setSaveMessage,
    saveError,
    setSaveError,
  } = useOnboardingSectionState({
    readStoredState: () => readStoredAgentState(defaultAgentCriteria),
    hasDraftContent: hasAgentDraftContent,
    buildUserInfo,
    persistState,
  });

  const onSelectMode = useCallback(
    (mode: AgentConversationMode) => {
      setSaveError("");
      setSaveMessage(
        mode === "voice"
          ? "Voice mode selected. The realtime transport layer is scaffolded for later wiring."
          : "Text mode selected. You can simulate turns below.",
      );

      setDraft((current) => {
        if (current.selectedMode === mode && current.transcript.length) {
          return current;
        }

        const starterTranscript =
          current.transcript.length > 0
            ? current.transcript
            : [
                createTranscriptItem({
                  role: "assistant",
                  modality: mode,
                  text: buildStarterAssistantMessage(current.criteria),
                }),
              ];

        return {
          ...current,
          selectedMode: mode,
          transcript: starterTranscript,
        };
      });
      setProgress("collecting");
    },
    [setDraft, setProgress, setSaveError, setSaveMessage],
  );

  const onSubmitTextTurn = useCallback(
    async (value: string) => {
      if (isSubmittingTurn || !draft.selectedMode) {
        return;
      }

      setSaveError("");
      setSaveMessage("");
      setIsSubmittingTurn(true);

      const userTranscriptItem = createTranscriptItem({
        role: "user",
        modality: "text",
        text: value,
      });

      const requestTranscript = [...draft.transcript, userTranscriptItem];

      setDraft((current) => ({
        ...current,
        turnCount: current.turnCount + 1,
        transcript: requestTranscript,
      }));

      try {
        const response = await fetch("/api/agent-turn", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedMode: draft.selectedMode,
            userMessage: value,
            transcript: requestTranscript,
            criteriaDefinitions,
            criteria: draft.criteria,
            interviewerSystemPrompt: promptSettings.interviewerSystemPrompt,
          }),
        });

        const payload = (await response.json()) as SubmitAgentTurnResponse | { error?: string };

        if (!response.ok || !isSubmitAgentTurnResponse(payload)) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : "The agent turn request failed.",
          );
        }

      setDraft((current) => ({
        ...current,
        criteria: payload.criteria,
        transcript: [
            ...requestTranscript,
            createTranscriptItem({
              role: "assistant",
              modality: "text",
              text: payload.assistantMessage,
            }),
          ],
          status: payload.status,
          finalSummary: payload.draftSummary,
          lastAskedCriterionId: payload.lastAskedCriterionId,
        }));

        setProgress(payload.status);
        setSaveMessage("Agent turn processed. Extracted criteria and next reply are now coming from the API route.");
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : "The agent turn could not be processed.",
        );
      } finally {
        setIsSubmittingTurn(false);
      }
    },
    [
      criteriaDefinitions,
      draft.criteria,
      draft.selectedMode,
      draft.transcript,
      isSubmittingTurn,
      promptSettings.interviewerSystemPrompt,
      setDraft,
      setProgress,
      setSaveError,
      setSaveMessage,
    ],
  );

  const { connectionStatus, liveTranscript, connect, disconnect } = useAgentVoiceSession({
    enabled: draft.selectedMode === "voice" && draft.status !== "complete",
    transcript: draft.transcript,
    criteria: draft.criteria,
    criteriaDefinitions,
    promptSettings,
    onUserTranscript: (message) => {
      setDraft((current) => ({
        ...current,
        turnCount: current.turnCount + 1,
        transcript: [...current.transcript, message],
      }));
    },
    onAssistantTurn: (payload) => {
      setDraft((current) => ({
        ...current,
        criteria: payload.criteria,
        transcript: [
          ...current.transcript,
          createTranscriptItem({
            role: "assistant",
            modality: "voice",
            text: payload.assistantMessage,
          }),
        ],
        status: payload.status,
        finalSummary: payload.draftSummary,
        lastAskedCriterionId: payload.lastAskedCriterionId,
      }));
    },
    onStatusChange: (status) => {
      setProgress(status);
    },
    onError: (message) => {
      setSaveError(message);
    },
    onInfo: (message) => {
      setSaveMessage(message);
    },
  });

  const draftSummary = buildDraftSummary(draft.criteria);
  const criteriaJson = JSON.stringify(draft.criteria, null, 2);

  return (
    <AgentLayout
      eyebrow="Section 4"
      title="Agent onboarding"
      description="Scaffold the shared conversation engine first, then plug in the interviewer model, extractor, and voice transport."
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
            onClick={() => router.push("/onboarding/3-picture")}
          >
            Back
          </button>
          <button
            className={styles.nextButton}
            type="button"
            onClick={() => {
              setDraft((current) => ({
                ...current,
                status: "complete",
                finalSummary: draftSummary,
                completedAt: new Date().toISOString(),
              }));
              setProgress("complete");
              setSaveMessage("Scaffold completion saved locally. Replace this button with the real finalize flow later.");
            }}
          >
            Save scaffold state
          </button>
        </>
      }
    >
      <div className={styles.stackCard}>
        <span className={styles.inlineLabel}>Active interviewer prompt</span>
        <p style={{ marginTop: 0, whiteSpace: "pre-wrap" }}>{promptSettings.interviewerSystemPrompt}</p>
        <p className={styles.helper}>
          Edit this in the testing system-prompt page. The real interviewer model should read from this same stored prompt setting.
        </p>
      </div>

      <ModePicker selectedMode={draft.selectedMode} onSelectMode={onSelectMode} />

      <ChatPanel
        selectedMode={draft.selectedMode}
        status={draft.status}
        transcript={draft.transcript}
        voiceStatusMessage={getVoiceScaffoldStatus(draft.selectedMode)}
        voiceConnectionStatus={connectionStatus}
        liveVoiceTranscript={liveTranscript}
        finalSummary={draft.finalSummary}
        onSubmitTextTurn={onSubmitTextTurn}
        isSubmittingTurn={isSubmittingTurn}
        onConnectVoice={connect}
        onDisconnectVoice={disconnect}
        onConfirmConversation={() => {
          setDraft((current) => ({
            ...current,
            status: "complete",
            completedAt: new Date().toISOString(),
          }));
          setProgress("complete");
          setSaveMessage("Conversation confirmed and completed.");
        }}
      />

      <AgentSummaryCard criteria={draft.criteria} finalSummary={draft.finalSummary} />

      <CompletionReview
        draftSummary={draftSummary}
        onApplySummary={() => {
          setDraft((current) => ({
            ...current,
            status: "confirming",
            finalSummary: draftSummary,
          }));
          setProgress("confirming");
          setSaveMessage("Draft summary applied. The real flow should now ask the user to confirm or correct it.");
        }}
      />

      <div className={styles.stackCard}>
        <span className={styles.inlineLabel}>Stored schema preview</span>
        <textarea
          className={styles.input}
          value={criteriaJson}
          readOnly
          rows={14}
          style={{ minHeight: 280, fontFamily: "monospace", resize: "vertical" }}
        />
        <p className={styles.helper}>
          This scaffold keeps criteria flexible and data-driven. You can expand, rename, or replace criteria later without rewriting the core state shape.
        </p>
      </div>

      <div className={styles.stackCard}>
        <span className={styles.inlineLabel}>Conversation progress</span>
        <p style={{ marginTop: 0, marginBottom: 8 }}>Session status: {progress}</p>
        <p style={{ marginTop: 0, marginBottom: 0 }}>Turns so far: {draft.turnCount}</p>
      </div>
    </AgentLayout>
  );
}
