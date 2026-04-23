"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "../../_shared/onboarding-shell.module.scss";
import { useClientReady } from "@/app/onboarding/_shared/onboarding-storage";
import { OnboardingSectionStatus } from "@/app/onboarding/_shared/onboarding-section-status";
import {
  persistAgentStateToIdb,
  readStoredAgentStateFromIdb,
} from "../_lib/agent-idb";
import { readAgentPromptSettings, readTestingCriteriaDefinitions } from "../_lib/agent-storage";
import type { AgentConversationMode } from "../_lib/agent-types";
import { AgentLayout } from "./agent-layout";
import { ModePicker } from "./mode-picker";

export function AgentModalityPage() {
  const isClientReady = useClientReady();

  if (!isClientReady) {
    return (
      <AgentLayout
        eyebrow="Section 4"
        title="Choose your conversation style"
        description="Preparing your saved agent setup..."
      >
        <div />
      </AgentLayout>
    );
  }

  return <AgentModalityPageClient />;
}

function AgentModalityPageClient() {
  const router = useRouter();
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedMode, setSelectedMode] = useState<AgentConversationMode | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const criteriaDefinitions = readTestingCriteriaDefinitions();
  const promptSettings = readAgentPromptSettings();

  useEffect(() => {
    let isCancelled = false;

    void readStoredAgentStateFromIdb(criteriaDefinitions, promptSettings)
      .then((storedState) => {
        if (isCancelled) {
          return;
        }

        setSelectedMode(storedState.draft.selectedMode);
      })
      .catch(() => {
        if (!isCancelled) {
          setSaveError("We couldn't restore your saved agent setup.");
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

  const onSelectMode = useCallback(
    async (mode: AgentConversationMode) => {
      if (isSelecting) {
        return;
      }

      setSaveError("");
      setSaveMessage(mode === "voice" ? "Opening voice-first chat..." : "Opening text-first chat...");
      setIsSelecting(true);

      try {
        const storedState = await readStoredAgentStateFromIdb(criteriaDefinitions, promptSettings);
        const nextDraft = {
          ...storedState.draft,
          selectedMode: mode,
        };
        const nextProgress = nextDraft.status;

        await persistAgentStateToIdb({
          draft: nextDraft,
          progress: nextProgress,
          promptSettings,
          criteriaDefinitions,
        });

        setSelectedMode(mode);
        router.push("/onboarding/4-agent/chat");
      } catch (error) {
        setSaveMessage("");
        setSaveError(
          error instanceof Error ? error.message : "We couldn't save your selected conversation style.",
        );
      } finally {
        setIsSelecting(false);
      }
    },
    [criteriaDefinitions, isSelecting, promptSettings, router],
  );

  return (
    <AgentLayout
      eyebrow="Section 4"
      title="Choose how this conversation should feel"
      description="Pick your default style first. On the next screen, you can still switch your input method at any time."
      status={
        <OnboardingSectionStatus
          errorMessage={saveError}
          successMessage={saveMessage || "Your choice sets the assistant's default reply style for this onboarding chat."}
          errorClassName={`${styles.statusMessage} ${styles.statusError}`}
          successClassName={`${styles.statusMessage} ${styles.statusSuccess}`}
        />
      }
      footer={
        <button
          className={styles.backButton}
          type="button"
          onClick={() => router.push("/onboarding/3-picture")}
          disabled={isHydrating || isSelecting}
        >
          Back
        </button>
      }
    >
      <div className={styles.stackCard}>
        <span className={styles.inlineLabel}>Default conversation style</span>
        <p className={styles.helper} style={{ marginTop: 0 }}>
          Text-first keeps everything quiet and typed. Voice-first keeps the same transcript view, but the assistant will read its replies aloud and the default input becomes hold-to-talk.
        </p>
      </div>

      <ModePicker selectedMode={selectedMode} onSelectMode={onSelectMode} />

      <div className={styles.stackCard}>
        <span className={styles.inlineLabel}>What happens next</span>
        <p className={styles.helper} style={{ marginTop: 0, marginBottom: 0 }}>
          Both paths go to the same chat screen. The only difference is which input mode is ready first and whether the assistant automatically speaks its text replies.
        </p>
      </div>
    </AgentLayout>
  );
}
