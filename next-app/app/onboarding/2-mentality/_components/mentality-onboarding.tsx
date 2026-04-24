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
import { getMentalityQuestions } from "./mentality-questions";
import {
  hasMentalityDraftContent,
  initialProgress,
  persistMentalityStateToIdb,
  readStoredMentalityStateFromIdb,
  sanitizeMentalityProgress,
} from "./mentality-idb";
import { MentalityLayout } from "./mentality-layout";
import type {
  MentalityDraft,
  MentalityMultiSelectOption,
  MentalityProgress,
  MentalityQuestionDefinition,
  MentalitySingleSelectOption,
  RelationshipIntent,
} from "./mentality-types";
import { MultiSelectStep } from "./steps/multi-select-step";
import { SingleSelectStep } from "./steps/single-select-step";

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function getSingleSelectValue(draft: MentalityDraft, questionKey: string) {
  switch (questionKey) {
    case "relationshipIntent":
      return draft.relationshipIntent;
    case "serious.pace":
      return draft.serious.pace;
    case "casual.frequency":
      return draft.casual.frequency;
    case "open.style":
      return draft.open.style;
    default:
      return "";
  }
}

function getMultiSelectValues(draft: MentalityDraft, questionKey: string) {
  switch (questionKey) {
    case "serious.priorities":
      return draft.serious.priorities;
    case "casual.boundaries":
      return draft.casual.boundaries;
    case "open.needsClarity":
      return draft.open.needsClarity;
    default:
      return [];
  }
}

function applySingleSelectAnswer(
  currentDraft: MentalityDraft,
  questionKey: string,
  value: string,
): MentalityDraft {
  switch (questionKey) {
    case "relationshipIntent":
      return {
        ...currentDraft,
        relationshipIntent: value as RelationshipIntent,
      };
    case "serious.pace":
      return {
        ...currentDraft,
        serious: {
          ...currentDraft.serious,
          pace: value,
        },
      };
    case "casual.frequency":
      return {
        ...currentDraft,
        casual: {
          ...currentDraft.casual,
          frequency: value,
        },
      };
    case "open.style":
      return {
        ...currentDraft,
        open: {
          ...currentDraft.open,
          style: value,
        },
      };
    default:
      return currentDraft;
  }
}

function applyMultiSelectAnswer(
  currentDraft: MentalityDraft,
  questionKey: string,
  value: string,
): MentalityDraft {
  switch (questionKey) {
    case "serious.priorities":
      return {
        ...currentDraft,
        serious: {
          ...currentDraft.serious,
          priorities: toggleValue(currentDraft.serious.priorities, value),
        },
      };
    case "casual.boundaries":
      return {
        ...currentDraft,
        casual: {
          ...currentDraft.casual,
          boundaries: toggleValue(currentDraft.casual.boundaries, value),
        },
      };
    case "open.needsClarity":
      return {
        ...currentDraft,
        open: {
          ...currentDraft.open,
          needsClarity: toggleValue(currentDraft.open.needsClarity, value),
        },
      };
    default:
      return currentDraft;
  }
}

function renderQuestion(args: {
  draft: MentalityDraft;
  question: MentalityQuestionDefinition;
  onSingleSelect: (questionKey: string, value: string) => void;
  onMultiSelect: (questionKey: string, value: string) => void;
}) {
  const { draft, question, onSingleSelect, onMultiSelect } = args;

  if (question.kind === "single_select") {
    return (
      <SingleSelectStep
        label={question.label}
        title={question.title}
        description={question.description}
        value={getSingleSelectValue(draft, question.questionKey)}
        options={question.options as MentalitySingleSelectOption[]}
        onChange={(value) => onSingleSelect(question.questionKey, value)}
      />
    );
  }

  return (
    <MultiSelectStep
      label={question.label}
      title={question.title}
      description={question.description}
      values={getMultiSelectValues(draft, question.questionKey)}
      options={question.options as MentalityMultiSelectOption[]}
      onToggle={(value) => onMultiSelect(question.questionKey, value)}
    />
  );
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

  const flow = useMemo(() => getMentalityQuestions(draft.relationshipIntent), [draft.relationshipIntent]);
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
    setDraft((current) => ({
      ...current,
      relationshipIntent: value,
    }));
    setProgress({
      branch: value,
      currentStepId: "relationship_intent",
      completedStepIds: [],
    });
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

  const stepContent = renderQuestion({
    draft,
    question: currentStep,
    onSingleSelect: (questionKey, value) => {
      if (questionKey === "relationshipIntent") {
        updateRelationshipIntent(value as RelationshipIntent);
        return;
      }

      setDraft((current) => applySingleSelectAnswer(current, questionKey, value));
    },
    onMultiSelect: (questionKey, value) => {
      setDraft((current) => applyMultiSelectAnswer(current, questionKey, value));
    },
  });

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
