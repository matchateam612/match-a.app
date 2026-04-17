"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import styles from "../../1-basics/page.module.scss";
import { useClientReady } from "@/app/onboarding/_shared/onboarding-storage";
import { OnboardingSectionStatus } from "@/app/onboarding/_shared/onboarding-section-status";
import { useOnboardingSectionState } from "@/app/onboarding/_shared/use-onboarding-section-state";
import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
import { createCriterionStates, defaultAgentCriteria } from "../_lib/agent-criteria";
import { buildDraftSummary, buildStarterAssistantMessage, createTranscriptItem } from "../_lib/agent-orchestrator";
import { readAgentPromptSettings, readStoredAgentState, hasAgentDraftContent, persistAgentState } from "../_lib/agent-storage";
import { getVoiceScaffoldStatus } from "../_lib/agent-voice";
import type { AgentOnboardingState, AgentConversationMode } from "../_lib/agent-types";
import { AgentLayout } from "./agent-layout";
import { AgentSummaryCard } from "./agent-summary-card";
import { ChatPanel } from "./chat-panel";
import { CompletionReview } from "./completion-review";
import { ModePicker } from "./mode-picker";

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
  const promptSettings = readAgentPromptSettings();

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
    (value: string) => {
      setSaveError("");

      setDraft((current) => {
        const nextCriteria =
          current.criteria.length > 0
            ? current.criteria.map((criterion, index) =>
                index === 0 && criterion.status === "missing"
                  ? {
                      ...criterion,
                      summary: "Placeholder extraction from testing turn. Replace with model output later.",
                      confidence: 0.72,
                      status: "tentative" as const,
                      source: "explicit" as const,
                      evidence: [value],
                      updatedAt: new Date().toISOString(),
                      needsConfirmation: true,
                    }
                  : criterion,
              )
            : createCriterionStates(defaultAgentCriteria);

        const nextTranscript = [
          ...current.transcript,
          createTranscriptItem({
            role: "user",
            modality: "text",
            text: value,
          }),
          createTranscriptItem({
            role: "assistant",
            modality: "text",
            text: "Scaffold reply: in the real flow, the interviewer model will respond using the system prompt, recent transcript, and current criteria state.",
          }),
        ];

        return {
          ...current,
          turnCount: current.turnCount + 1,
          criteria: nextCriteria,
          transcript: nextTranscript,
          lastAskedCriterionId: nextCriteria.find((criterion) => criterion.status === "missing")?.id ?? null,
        };
      });

      setSaveMessage("Testing turn added. This scaffold now updates transcript and placeholder criterion state.");
    },
    [setDraft, setSaveError, setSaveMessage],
  );

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
        transcript={draft.transcript}
        voiceStatusMessage={getVoiceScaffoldStatus(draft.selectedMode)}
        onSubmitTextTurn={onSubmitTextTurn}
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
