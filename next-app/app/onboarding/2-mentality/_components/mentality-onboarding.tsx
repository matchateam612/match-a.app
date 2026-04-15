"use client";

import { useCallback, useMemo } from "react";

import styles from "../../1-basics/page.module.scss";
import {
  useClientReady
} from "@/app/onboarding/_shared/onboarding-storage";
import {
  readStoredProgressValue,
  readStoredUserInfo,
  writeStoredProgressValue,
  writeStoredUserInfo,
} from "@/app/onboarding/_shared/onboarding-persistence";
import { OnboardingSectionStatus } from "@/app/onboarding/_shared/onboarding-section-status";
import {
  useOnboardingSectionState,
} from "@/app/onboarding/_shared/use-onboarding-section-state";
import { useSectionSaveFeedback } from "@/app/onboarding/_shared/use-section-save-feedback";
import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
import { getCurrentUser } from "@/lib/supabase/auth";
import { upsertUserPrivateInfo } from "@/lib/supabase/user-private-info";
import {
  initialDraft,
  initialProgress,
  MENTALITY_STEP_STORAGE_KEY,
  USER_INFO_STORAGE_KEY,
} from "./mentality-data";
import { getFirstBranchStepId, getMentalityFlow, type MentalityStepId } from "./mentality-flow";
import { MentalityLayout } from "./mentality-layout";
import type { MentalityDraft, MentalityProgress, RelationshipIntent } from "./mentality-types";
import { CasualBoundariesStep } from "./steps/casual-boundaries-step";
import { CasualFrequencyStep } from "./steps/casual-frequency-step";
import { OpenClarityStep } from "./steps/open-clarity-step";
import { OpenStyleStep } from "./steps/open-style-step";
import { RelationshipIntentStep } from "./steps/relationship-intent-step";
import { SeriousPaceStep } from "./steps/serious-pace-step";
import { SeriousPrioritiesStep } from "./steps/serious-priorities-step";

type StoredMentalityState = {
  draft: MentalityDraft;
  progress: MentalityProgress;
  hasSavedDraft: boolean;
  userInfo: UserInfo;
};

const emptyStoredState: StoredMentalityState = {
  draft: initialDraft,
  progress: initialProgress,
  hasSavedDraft: false,
  userInfo: {},
};

function isMentalityStepId(value: string): value is MentalityStepId {
  return [
    "relationship_intent",
    "serious_pace",
    "serious_priorities",
    "casual_frequency",
    "casual_boundaries",
    "open_style",
    "open_clarity",
  ].includes(value);
}

function sanitizeProgress(draft: MentalityDraft, progress?: Partial<MentalityProgress>): MentalityProgress {
  const branch = draft.relationshipIntent || progress?.branch || "";
  const flow = getMentalityFlow(branch);
  const fallbackStepId = branch ? getFirstBranchStepId(branch) : "relationship_intent";
  const requestedStepId =
    progress?.currentStepId && isMentalityStepId(progress.currentStepId)
      ? progress.currentStepId
      : fallbackStepId;
  const currentStepId = flow.some((step) => step.id === requestedStepId)
    ? requestedStepId
    : branch
      ? getFirstBranchStepId(branch)
      : "relationship_intent";

  return {
    branch,
    currentStepId,
    completedStepIds: Array.isArray(progress?.completedStepIds)
      ? progress.completedStepIds.filter((stepId): stepId is MentalityStepId =>
          isMentalityStepId(stepId) && flow.some((step) => step.id === stepId),
        )
      : [],
  };
}

function readStoredState(): StoredMentalityState {
  if (typeof window === "undefined") {
    return emptyStoredState;
  }

  const rawCurrentStepId = readStoredProgressValue(MENTALITY_STEP_STORAGE_KEY);
  const userInfo: UserInfo = readStoredUserInfo(USER_INFO_STORAGE_KEY);

  const draft: MentalityDraft = {
    ...initialDraft,
    ...userInfo.mentality,
    serious: {
      ...initialDraft.serious,
      ...(userInfo.mentality?.serious ?? {}),
      priorities: Array.isArray(userInfo.mentality?.serious?.priorities)
        ? userInfo.mentality.serious.priorities
        : initialDraft.serious.priorities,
    },
    casual: {
      ...initialDraft.casual,
      ...(userInfo.mentality?.casual ?? {}),
      boundaries: Array.isArray(userInfo.mentality?.casual?.boundaries)
        ? userInfo.mentality.casual.boundaries
        : initialDraft.casual.boundaries,
    },
    open: {
      ...initialDraft.open,
      ...(userInfo.mentality?.open ?? {}),
      needsClarity: Array.isArray(userInfo.mentality?.open?.needsClarity)
        ? userInfo.mentality.open.needsClarity
        : initialDraft.open.needsClarity,
    },
  };

  const progress = sanitizeProgress(draft, {
    ...userInfo.mentality_progress,
    currentStepId: rawCurrentStepId ?? userInfo.mentality_progress?.currentStepId,
  });

  return {
    draft,
    progress,
    hasSavedDraft: Boolean(userInfo.mentality),
    userInfo,
  };
}

function hasDraftContent(draft: MentalityDraft) {
  return Boolean(
    draft.relationshipIntent ||
      draft.serious.pace ||
      draft.serious.priorities.length > 0 ||
      draft.casual.frequency ||
      draft.casual.boundaries.length > 0 ||
      draft.open.style ||
      draft.open.needsClarity.length > 0,
  );
}

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
      currentStepId: getFirstBranchStepId(nextIntent),
      completedStepIds: ["relationship_intent"],
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
  const buildUserInfo = useCallback(
    ({
      draft,
      progress,
      storedUserInfo,
    }: {
      draft: MentalityDraft;
      progress: MentalityProgress;
      storedUserInfo: UserInfo;
    }) => ({
      ...storedUserInfo,
      mentality: draft,
      mentality_progress: progress,
    }),
    [],
  );

  const persistState = useCallback(
    ({
      draft,
      progress,
      userInfo,
    }: {
      draft: MentalityDraft;
      progress: MentalityProgress;
      userInfo: UserInfo;
    }) => {
      const sanitizedProgress = sanitizeProgress(draft, progress);

      if (
        sanitizedProgress.branch !== progress.branch ||
        sanitizedProgress.currentStepId !== progress.currentStepId ||
        sanitizedProgress.completedStepIds.join("|") !== progress.completedStepIds.join("|")
      ) {
        return;
      }

      writeStoredUserInfo(USER_INFO_STORAGE_KEY, userInfo);
      writeStoredProgressValue(MENTALITY_STEP_STORAGE_KEY, sanitizedProgress.currentStepId);
    },
    [],
  );

  const {
    draft,
    setDraft,
    progress,
    setProgress,
    userInfo,
    isSavingSection,
    setIsSavingSection,
    saveMessage,
    setSaveMessage,
    saveError,
    setSaveError,
    draftStatus,
  } = useOnboardingSectionState({
    readStoredState,
    hasDraftContent: (draft) => hasDraftContent(draft),
    buildUserInfo,
    persistState,
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

      await upsertUserPrivateInfo(user.id, {
        ...userInfo,
        mentality: draft,
        mentality_progress: finalProgress,
      });

      writeStoredUserInfo(USER_INFO_STORAGE_KEY, {
        ...userInfo,
        mentality: draft,
        mentality_progress: finalProgress,
      });
      writeStoredProgressValue(MENTALITY_STEP_STORAGE_KEY, finalProgress.currentStepId);
      setProgress(finalProgress);
      setSaveMessage("Mentality answers saved. Your user_info row is up to date.");
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
            disabled={currentStepIndex === 0 || isSavingSection}
          >
            Back
          </button>
          <button
            className={styles.nextButton}
            type="button"
            onClick={isLastStep ? finishMentality : goNext}
            disabled={!canContinue || isSavingSection}
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
