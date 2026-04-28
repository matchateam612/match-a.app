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
import { updateOnboardingStatusRequest } from "@/lib/supabase/onboarding-status-api";
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

function getValueAtPath(source: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, source);
}

function setValueAtPath<T extends Record<string, unknown>>(source: T, path: string, value: unknown): T {
  const segments = path.split(".");
  const [head, ...tail] = segments;

  if (!head) {
    return source;
  }

  if (tail.length === 0) {
    return {
      ...source,
      [head]: value,
    };
  }

  const nestedSource =
    source[head] && typeof source[head] === "object" && !Array.isArray(source[head])
      ? (source[head] as Record<string, unknown>)
      : {};

  return {
    ...source,
    [head]: setValueAtPath(nestedSource, tail.join("."), value),
  };
}

function getSingleSelectValue(draft: MentalityDraft, questionKey: string) {
  const value = getValueAtPath(draft, questionKey);
  return typeof value === "string" ? value : "";
}

function getMultiSelectValues(draft: MentalityDraft, questionKey: string) {
  const value = getValueAtPath(draft, questionKey);
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function applySingleSelectAnswer(
  currentDraft: MentalityDraft,
  questionKey: string,
  value: string,
): MentalityDraft {
  if (questionKey === "relationshipIntent") {
    return {
      ...currentDraft,
      relationshipIntent: value as RelationshipIntent,
    };
  }

  return setValueAtPath(currentDraft as Record<string, unknown>, questionKey, value) as MentalityDraft;
}

function applyMultiSelectAnswer(
  currentDraft: MentalityDraft,
  questionKey: string,
  value: string,
): MentalityDraft {
  return setValueAtPath(
    currentDraft as Record<string, unknown>,
    questionKey,
    toggleValue(getMultiSelectValues(currentDraft, questionKey), value),
  ) as MentalityDraft;
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
      router.push("/onboarding/1-basics");
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
      await updateOnboardingStatusRequest("3-picture");
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
