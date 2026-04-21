"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "../../_shared/onboarding-shell.module.scss";
import { useClientReady } from "@/app/onboarding/_shared/onboarding-storage";
import { OnboardingSectionStatus } from "@/app/onboarding/_shared/onboarding-section-status";
import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
import { getCurrentUser } from "@/lib/supabase/auth";
import { upsertUserAgentProfile } from "@/lib/supabase/user-agent-profile";
import { upsertUserMatchesInfo } from "@/lib/supabase/user-matches-info";
import type {
  CreateInitialAgentTurnResponse,
  CreateInitialVoiceTurnContextRequest,
  SubmitAgentTurnResponse,
} from "../_lib/agent-api-types";
import { hasAgentDraftContent, persistAgentStateToIdb, readStoredAgentStateFromIdb } from "../_lib/agent-idb";
import { buildDraftSummary, createTranscriptItem } from "../_lib/agent-orchestrator";
import { readAgentPromptSettings, readTestingCriteriaDefinitions } from "../_lib/agent-storage";
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

function isCreateInitialAgentTurnResponse(
  payload: CreateInitialAgentTurnResponse | { error?: string },
): payload is CreateInitialAgentTurnResponse {
  return (
    "assistantMessage" in payload &&
    "draftSummary" in payload &&
    "status" in payload
  );
}

type StreamedAgentTurnEvent =
  | {
      type: "assistant.delta";
      delta: string;
    }
  | {
      type: "assistant.done";
      payload: SubmitAgentTurnResponse;
    }
  | {
      type: "error";
      message: string;
    };

export function AgentOnboarding() {
  const isClientReady = useClientReady();

  if (!isClientReady) {
    return (
      <AgentLayout
        eyebrow="Section 4"
        title="Agent onboarding"
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
  const promptSettings = readAgentPromptSettings();
  const criteriaDefinitions = readTestingCriteriaDefinitions();
  const userInfo: UserInfo = useMemo(
    () => ({
      agent: draft,
      agent_system_prompt: promptSettings.interviewerSystemPrompt,
    }),
    [draft, promptSettings.interviewerSystemPrompt],
  );

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
      ? "Saved locally in IndexedDB on this device as you go."
      : "Your agent conversation will be saved locally in IndexedDB on this device.";
  }, [hasSavedDraft, isHydrating]);

  const { connectionStatus, activityLabel, liveTranscript, connect, disconnect, queueInitialVoiceTurnContext } = useAgentVoiceSession({
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

  const buildInitialVoiceTurnContext = useCallback(
    (nextDraft: AgentOnboardingState): CreateInitialVoiceTurnContextRequest => ({
      selectedMode: "voice",
      criteriaDefinitions,
      criteria: nextDraft.criteria,
      interviewerSystemPrompt: promptSettings.interviewerSystemPrompt,
      userInfo: {
        ...userInfo,
        agent: nextDraft,
      },
    }),
    [
      criteriaDefinitions,
      promptSettings.interviewerSystemPrompt,
      userInfo,
    ],
  );

  const onSelectMode = useCallback(
    async (mode: AgentConversationMode) => {
      if (isPreparingConversation) {
        return;
      }

      setSaveError("");
      setSaveMessage(
        mode === "voice"
          ? "Preparing your first voice turn from the answers you already shared."
          : "Preparing the first assistant message from your onboarding answers.",
      );
      setIsPreparingConversation(true);

      try {
        const nextDraft =
          draft.selectedMode === mode && draft.transcript.length
            ? draft
            : {
                ...draft,
                selectedMode: mode,
                transcript: [] as typeof draft.transcript,
                turnCount: 0,
                status: "collecting" as const,
                finalSummary: null,
                completedAt: null,
                lastAskedCriterionId: null,
              };

        if (nextDraft.transcript.length > 0) {
          setDraft(nextDraft);
          setProgress(nextDraft.status);
          if (mode === "voice") {
            queueInitialVoiceTurnContext(buildInitialVoiceTurnContext(nextDraft));
          }
          return;
        }

        const response = await fetch("/api/agent-turn/initial", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedMode: mode,
            criteriaDefinitions,
            criteria: nextDraft.criteria,
            interviewerSystemPrompt: promptSettings.interviewerSystemPrompt,
            userInfo: {
              ...userInfo,
              agent: nextDraft,
            },
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
          modality: mode,
          text: payload.assistantMessage,
        });

        setDraft({
          ...nextDraft,
          transcript: [initialTranscriptItem],
          status: payload.status,
          finalSummary: payload.draftSummary,
          lastAskedCriterionId: payload.lastAskedCriterionId,
        });
        setProgress(payload.status);

        if (mode === "voice") {
          queueInitialVoiceTurnContext(buildInitialVoiceTurnContext({
            ...nextDraft,
            transcript: [initialTranscriptItem],
            status: payload.status,
            finalSummary: payload.draftSummary,
            lastAskedCriterionId: payload.lastAskedCriterionId,
          }));
          setSaveMessage("Voice mode selected. The first assistant turn is now prepared from your stored onboarding context and will be generated through the voice session after connect.");
        } else {
          setSaveMessage("Text mode selected. The first assistant message is now generated from your stored onboarding context.");
        }
      } catch (error) {
        setSaveMessage("");
        setSaveError(
          error instanceof Error ? error.message : "Could not prepare the first assistant turn.",
        );
      } finally {
        setIsPreparingConversation(false);
      }
    },
    [
      buildInitialVoiceTurnContext,
      criteriaDefinitions,
      draft,
      isPreparingConversation,
      promptSettings.interviewerSystemPrompt,
      queueInitialVoiceTurnContext,
      setDraft,
      setProgress,
      setSaveError,
      setSaveMessage,
      userInfo,
    ],
  );

  const onSubmitTextTurn = useCallback(
    async (value: string) => {
      if (isSubmittingTurn || !draft.selectedMode) {
        return;
      }

      setSaveError("");
      setSaveMessage("");
      setIsSubmittingTurn(true);
      setPendingAssistantMessage("");

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
        const response = await fetch("/api/agent-turn/stream", {
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

        if (!response.ok || !response.body) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "The streamed agent turn request failed.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let completedPayload: SubmitAgentTurnResponse | null = null;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const event of events) {
            const line = event
              .split("\n")
              .map((entry) => entry.trim())
              .find((entry) => entry.startsWith("data:"));

            if (!line) {
              continue;
            }

            const parsed = JSON.parse(line.slice("data:".length).trim()) as StreamedAgentTurnEvent;

            if (parsed.type === "assistant.delta") {
              setPendingAssistantMessage((current) => `${current}${parsed.delta}`);
              continue;
            }

            if (parsed.type === "assistant.done") {
              completedPayload = parsed.payload;
              continue;
            }

            if (parsed.type === "error") {
              throw new Error(parsed.message);
            }
          }
        }

        if (!completedPayload || !isSubmitAgentTurnResponse(completedPayload)) {
          throw new Error("The streamed agent turn finished without a valid completion payload.");
        }

        setPendingAssistantMessage("");
        setDraft((current) => ({
          ...current,
          criteria: completedPayload.criteria,
          transcript: [
            ...requestTranscript,
            createTranscriptItem({
              role: "assistant",
              modality: "text",
              text: completedPayload.assistantMessage,
            }),
          ],
          status: completedPayload.status,
          finalSummary: completedPayload.draftSummary,
          lastAskedCriterionId: completedPayload.lastAskedCriterionId,
        }));

        setProgress(completedPayload.status);
        setSaveMessage("Agent turn streamed successfully. The interviewer reply now appears progressively in text mode.");
      } catch (error) {
        setPendingAssistantMessage("");
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

  const draftSummary = buildDraftSummary(draft.criteria);
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

      setSaveMessage("Agent profile saved to user_agent_profile.");
      router.push("/dashboard");
    } catch (error) {
      setSaveError(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't save your agent profile right now.",
      );
    }
  }, [draft, draftSummary, router]);

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
        pendingAssistantMessage={pendingAssistantMessage}
        voiceStatusMessage={getVoiceScaffoldStatus(draft.selectedMode)}
        voiceConnectionStatus={connectionStatus}
        voiceActivityLabel={activityLabel}
        liveVoiceTranscript={liveTranscript}
        finalSummary={draft.finalSummary}
        onSubmitTextTurn={onSubmitTextTurn}
        isSubmittingTurn={isSubmittingTurn || isPreparingConversation}
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
          This criteria model stays flexible and data-driven. You can expand, rename, or replace criteria later without rewriting the core state shape.
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
