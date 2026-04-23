"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import styles from "../../_shared/onboarding-shell.module.scss";
import {
  useClientReady
} from "@/app/onboarding/_shared/onboarding-storage";
import { OnboardingSectionStatus } from "@/app/onboarding/_shared/onboarding-section-status";
import { useOnboardingSectionState } from "@/app/onboarding/_shared/use-onboarding-section-state";
import { useSectionSaveFeedback } from "@/app/onboarding/_shared/use-section-save-feedback";
import { getCurrentUser } from "@/lib/supabase/auth";
import { upsertUserMatchesInfo } from "@/lib/supabase/user-matches-info";
import { upsertUserMentality } from "@/lib/supabase/user-mentality";
import {
  initialDraft,
} from "./mentality-data";
import { getMentalityFlow } from "./mentality-flow";
import {
  hasMentalityDraftContent,
  initialProgress,
  persistMentalityStateToIdb,
  readStoredMentalityStateFromIdb,
  sanitizeMentalityProgress,
} from "./mentality-idb";
import { MentalityLayout } from "./mentality-layout";
import type { MentalityDraft, MentalityProgress, RelationshipIntent } from "./mentality-types";
import { CasualBoundariesStep } from "./steps/casual-boundaries-step";
import { CasualFrequencyStep } from "./steps/casual-frequency-step";
import { OpenClarityStep } from "./steps/open-clarity-step";
import { OpenStyleStep } from "./steps/open-style-step";
import { RelationshipIntentStep } from "./steps/relationship-intent-step";
import { SeriousPaceStep } from "./steps/serious-pace-step";
import { SeriousPrioritiesStep } from "./steps/serious-priorities-step";

function applyRelationshipIntentChange(
  currentDraft: MentalityDraft,
  nextIntent: RelationshipIntent,
): { draft: MentalityDraft; progress: MentalityProgress } {
  const nextDraft: MentalityDraft = {
    relationshipIntent: nextIntent,
    serious:
      nextIntent === "serious_longterm"
        ? currentDraft.serious
        : { ...initialDraft.serious },
    casual:
      nextIntent === "casual_shortterm"
        ? currentDraft.casual
        : { ...initialDraft.casual },
    open:
      nextIntent === "open_to_both"
        ? currentDraft.open
        : { ...initialDraft.open },
  };

  return {
    draft: nextDraft,
    progress: {
      branch: nextIntent,
      currentStepId: "relationship_intent",
      completedStepIds: [],
    },
  };
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function MentalityOnboarding() {
  const isClientReady = useClientReady();

  if (!isClientReady) {
    return (
      <MentalityLayout
        currentStepIndex={0}
        totalSteps={3}
        draftStatus="Preparing your saved draft..."
        footer={
          <>
            <button className={styles.backButton} type="button" disabled>
              Back
            </button>
            <button className={styles.nextButton} type="button" disabled>
              Next
            </button>
          </>
        }
      >
        <div />
      </MentalityLayout>
    );
  }

  return <MentalityOnboardingClient />;
}

function MentalityOnboardingClient() {
  const router = useRouter();
  const readStoredState = useCallback(readStoredMentalityStateFromIdb, []);
  const persistState = useCallback(
    async (args: { draft: MentalityDraft; progress: MentalityProgress }) => {
      await persistMentalityStateToIdb({
        draft: args.draft,
        progress: sanitizeMentalityProgress(args.draft, args.progress),
      });
    },
    [],
  );
  const {
    draft,
    setDraft,
    progress,
    setProgress,
    isHydrating,
    draftStatus,
    isSavingSection,
    setIsSavingSection,
    saveMessage,
    setSaveMessage,
    saveError,
    setSaveError,
  } = useOnboardingSectionState({
    initialDraft,
    initialProgress,
    readStoredState,
    hasDraftContent: hasMentalityDraftContent,
    persistState,
    hydrationErrorMessage: "We couldn't restore your saved mentality draft.",
    persistenceErrorMessage: "We couldn't save your mentality draft on this device.",
  });
  const { clearSaveFeedback } = useSectionSaveFeedback({
    setSaveError,
    setSaveMessage,
  });

  const flow = useMemo(() => getMentalityFlow(draft.relationshipIntent), [draft.relationshipIntent]);
  const currentStepIndex = Math.max(
    0,
    flow.findIndex((step) => step.id === progress.currentStepId),
  );
  const currentStep = flow[currentStepIndex] ?? flow[0];
  const isLastStep = currentStepIndex === flow.length - 1;
  const canContinue = currentStep?.isComplete(draft) ?? false;

  function markCurrentStepComplete() {
    setProgress((current) => ({
      ...current,
      completedStepIds: current.completedStepIds.includes(current.currentStepId)
        ? current.completedStepIds
        : [...current.completedStepIds, current.currentStepId],
    }));
  }

  function goNext() {
    if (!canContinue || isLastStep || !currentStep) {
      return;
    }

    clearSaveFeedback();
    markCurrentStepComplete();
    const nextStep = flow[currentStepIndex + 1];

    if (!nextStep) {
      return;
    }

    setProgress((current) => ({
      ...current,
      currentStepId: nextStep.id,
    }));
  }

  function goBack() {
    if (currentStepIndex === 0) {
      return;
    }

    clearSaveFeedback();
    const previousStep = flow[currentStepIndex - 1];

    if (!previousStep) {
      return;
    }

    setProgress((current) => ({
      ...current,
      currentStepId: previousStep.id,
    }));
  }

  function updateRelationshipIntent(value: RelationshipIntent) {
    clearSaveFeedback();

    if (draft.relationshipIntent === value) {
      setDraft((current) => ({ ...current, relationshipIntent: value }));
      return;
    }

    const nextState = applyRelationshipIntentChange(draft, value);
    setDraft(nextState.draft);
    setProgress(nextState.progress);
  }

  async function finishMentality() {
    if (!canContinue || isSavingSection) {
      return;
    }

    setIsSavingSection(true);
    setSaveError("");
    setSaveMessage("");

    try {
      const user = await getCurrentUser();

      if (!user) {
        throw new Error("Please sign in before finishing this section.");
      }

      const finalProgress: MentalityProgress = {
        ...progress,
        completedStepIds: progress.completedStepIds.includes(currentStep.id)
          ? progress.completedStepIds
          : [...progress.completedStepIds, currentStep.id],
      };

      await upsertUserMentality(user.id, draft, finalProgress);
      await upsertUserMatchesInfo({
        userId: user.id,
        mentality: draft,
        mentalityProgress: finalProgress,
      });
      setProgress(finalProgress);
      setSaveMessage("Your dating intentions are saved.");
      router.push("/onboarding/3-picture");
    } catch (error) {
      setSaveError(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't save your mentality answers right now.",
      );
    } finally {
      setIsSavingSection(false);
    }
  }

  let stepContent = (
    <RelationshipIntentStep
      value={draft.relationshipIntent}
      onChange={updateRelationshipIntent}
    />
  );

  if (currentStep.id === "serious_pace") {
    stepContent = (
      <SeriousPaceStep
        value={draft.serious.pace}
        onChange={(value) =>
          setDraft((current) => ({
            ...current,
            serious: {
              ...current.serious,
              pace: value,
            },
          }))
        }
      />
    );
  } else if (currentStep.id === "serious_priorities") {
    stepContent = (
      <SeriousPrioritiesStep
        values={draft.serious.priorities}
        onToggle={(value) =>
          setDraft((current) => ({
            ...current,
            serious: {
              ...current.serious,
              priorities: toggleValue(current.serious.priorities, value),
            },
          }))
        }
      />
    );
  } else if (currentStep.id === "casual_frequency") {
    stepContent = (
      <CasualFrequencyStep
        value={draft.casual.frequency}
        onChange={(value) =>
          setDraft((current) => ({
            ...current,
            casual: {
              ...current.casual,
              frequency: value,
            },
          }))
        }
      />
    );
  } else if (currentStep.id === "casual_boundaries") {
    stepContent = (
      <CasualBoundariesStep
        values={draft.casual.boundaries}
        onToggle={(value) =>
          setDraft((current) => ({
            ...current,
            casual: {
              ...current.casual,
              boundaries: toggleValue(current.casual.boundaries, value),
            },
          }))
        }
      />
    );
  } else if (currentStep.id === "open_style") {
    stepContent = (
      <OpenStyleStep
        value={draft.open.style}
        onChange={(value) =>
          setDraft((current) => ({
            ...current,
            open: {
              ...current.open,
              style: value,
            },
          }))
        }
      />
    );
  } else if (currentStep.id === "open_clarity") {
    stepContent = (
      <OpenClarityStep
        values={draft.open.needsClarity}
        onToggle={(value) =>
          setDraft((current) => ({
            ...current,
            open: {
              ...current.open,
              needsClarity: toggleValue(current.open.needsClarity, value),
            },
          }))
        }
      />
    );
  }

  return (
    <MentalityLayout
      currentStepIndex={currentStepIndex}
      totalSteps={flow.length}
      draftStatus={draftStatus}
      status={
        <OnboardingSectionStatus
          errorMessage={saveError}
          successMessage={saveMessage}
          errorClassName={`${styles.statusMessage} ${styles.statusError}`}
          successClassName={`${styles.statusMessage} ${styles.statusSuccess}`}
        />
      }
      footer={
        <>
          <button
            className={styles.backButton}
            type="button"
            onClick={goBack}
            disabled={currentStepIndex === 0 || isSavingSection || isHydrating}
          >
            Back
          </button>
          <button
            className={styles.nextButton}
            type="button"
            onClick={isLastStep ? finishMentality : goNext}
            disabled={!canContinue || isSavingSection || isHydrating}
          >
            {isSavingSection ? "Saving..." : isLastStep ? "Finish mentality" : "Next"}
          </button>
        </>
      }
    >
      {stepContent}
    </MentalityLayout>
  );
}
