"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "../../_shared/onboarding-shell.module.scss";
import { useClientReady } from "@/app/onboarding/_shared/onboarding-storage";
import { OnboardingSectionStatus } from "@/app/onboarding/_shared/onboarding-section-status";
import { useOnboardingSectionState } from "@/app/onboarding/_shared/use-onboarding-section-state";
import { useSectionSaveFeedback } from "@/app/onboarding/_shared/use-section-save-feedback";
import { getCurrentUser } from "@/lib/supabase/auth";
import { upsertUserBasicInfo } from "@/lib/supabase/user-basic-info";
import { upsertUserMatchesInfo } from "@/lib/supabase/user-matches-info";
import { BasicInfoLayout } from "./basic-info-layout";
import {
  initialDraft,
  TOTAL_STEPS,
} from "./basic-info-data";
import {
  markBasicInfoAgeLockedInIdb,
  persistBasicInfoStateToIdb,
  readStoredBasicInfoStateFromIdb,
} from "./basic-info-idb";
import type { BasicInfoDraft, PreferredEthnicityOption } from "./basic-info-types";
import { AgePreferenceStep } from "./steps/age-preference-step";
import { AgeStep } from "./steps/age-step";
import { EthnicityStep } from "./steps/ethnicity-step";
import { IdentityPreferenceStep } from "./steps/identity-preference-step";

function isStepComplete(step: number, draft: BasicInfoDraft) {
  switch (step) {
    case 0:
      return draft.age.trim().length > 0 && draft.phoneNumber.trim().length > 0;
    case 1:
      return (
        Number(draft.preferredAgeMin) >= 18 &&
        Number(draft.preferredAgeMax) <= 80 &&
        Number(draft.preferredAgeMin) <= Number(draft.preferredAgeMax)
      );
    case 2:
      return Boolean(
        draft.genderIdentity &&
          (draft.genderIdentity !== "custom" || draft.genderIdentityCustom.trim()) &&
          draft.interestedIn &&
          (draft.interestedIn !== "custom" || draft.interestedInCustom.trim()),
      );
    case 3:
      return Boolean(draft.ethnicity && draft.preferredEthnicities.length > 0);
    default:
      return false;
  }
}

function hasDraftContent(draft: BasicInfoDraft, currentStep: number) {
  return (
    currentStep > 0 ||
    Boolean(
      draft.age ||
        draft.phoneNumber ||
        draft.preferredAgeMin ||
        draft.preferredAgeMax ||
        draft.genderIdentity ||
        draft.genderIdentityCustom ||
        draft.interestedIn ||
        draft.interestedInCustom ||
        draft.ethnicity ||
        draft.preferredEthnicities.length > 0,
    )
  );
}

export function BasicInfoOnboarding() {
  const isClientReady = useClientReady();

  if (!isClientReady) {
    return (
      <BasicInfoLayout
        currentStep={0}
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
      </BasicInfoLayout>
    );
  }

  return <BasicInfoOnboardingClient />;
}

function BasicInfoOnboardingClient() {
  const router = useRouter();
  const [isAgeLocked, setIsAgeLocked] = useState(false);
  const readStoredState = useCallback(readStoredBasicInfoStateFromIdb, []);
  const persistState = useCallback(
    async (args: { draft: BasicInfoDraft; progress: number }) => {
      await persistBasicInfoStateToIdb({
        draft: args.draft,
        progress: args.progress,
        isAgeLocked,
      });
    },
    [isAgeLocked],
  );
  const onStoredStateLoaded = useCallback((storedState: Awaited<ReturnType<typeof readStoredBasicInfoStateFromIdb>>) => {
    setIsAgeLocked(storedState.isAgeLocked);
  }, []);
  const {
    draft,
    setDraft,
    progress: currentStep,
    setProgress: setCurrentStep,
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
    initialProgress: 0,
    readStoredState,
    hasDraftContent,
    persistState,
    onStoredStateLoaded,
    hydrationErrorMessage: "We couldn't restore your saved basic info draft.",
    persistenceErrorMessage: "We couldn't save your basic info draft on this device.",
  });
  const { clearSaveFeedback } = useSectionSaveFeedback({
    setSaveError,
    setSaveMessage,
  });

  const canContinue = isStepComplete(currentStep, draft);
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  function updateDraft<K extends keyof BasicInfoDraft>(key: K, value: BasicInfoDraft[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function setAge(value: string) {
    updateDraft("age", value);
  }

  function updatePreferredAgeRange(key: "preferredAgeMin" | "preferredAgeMax", value: string) {
    setDraft((current) => {
      const next = { ...current, [key]: value };

      if (Number(next.preferredAgeMin) > Number(next.preferredAgeMax)) {
        if (key === "preferredAgeMin") {
          next.preferredAgeMax = value;
        } else {
          next.preferredAgeMin = value;
        }
      }

      return next;
    });
  }

  function goNext() {
    if (!canContinue || isLastStep) {
      return;
    }

    if (currentStep === 0 && Number(draft.age) < 18) {
      setIsAgeLocked(true);
      void markBasicInfoAgeLockedInIdb(draft).catch(() => {
        setSaveError("We couldn't update the local age gate on this device.");
      });
      return;
    }

    clearSaveFeedback();
    setCurrentStep((step) => Math.min(step + 1, TOTAL_STEPS - 1));
  }

  function goBack() {
    clearSaveFeedback();
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  function togglePreferredEthnicity(option: PreferredEthnicityOption) {
    setDraft((current) => {
      const currentValues = current.preferredEthnicities;

      if (option === "any-race") {
        return {
          ...current,
          preferredEthnicities: currentValues.includes("any-race") ? [] : ["any-race"],
        };
      }

      const withoutAnyRace = currentValues.filter((value) => value !== "any-race");
      const exists = withoutAnyRace.includes(option);

      return {
        ...current,
        preferredEthnicities: exists
          ? withoutAnyRace.filter((value) => value !== option)
          : [...withoutAnyRace, option],
      };
    });
  }

  const selectedEthnicitySummary =
    draft.preferredEthnicities.length === 0
      ? "Choose at least one option."
      : draft.preferredEthnicities.includes("any-race")
        ? "Open to every ethnicity."
        : `${draft.preferredEthnicities.length} preference${
            draft.preferredEthnicities.length === 1 ? "" : "s"
          } selected`;

  async function finishBasicInfo() {
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

      await upsertUserBasicInfo(user.id, draft);
      try {
        await upsertUserMatchesInfo({
          userId: user.id,
          basicInfo: draft,
        });
      } catch (error) {
        throw new Error(
          error instanceof Error && error.message
            ? `Basic info saved to user_basic_info, but user_matches_info could not be updated: ${error.message}`
            : "Basic info saved to user_basic_info, but user_matches_info could not be updated.",
        );
      }
      setSaveMessage("Basic info saved to user_basic_info.");
      router.push("/onboarding/2-mentality");
    } catch (error) {
      setSaveError(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't save your basic info right now.",
      );
    } finally {
      setIsSavingSection(false);
    }
  }

  if (isAgeLocked) {
    return (
      <BasicInfoLayout currentStep={0} draftStatus="" hideProgress>
        <div className={styles.warningCard}>
          <p className={styles.questionLabel}>Access restricted</p>
          <h1 className={styles.questionTitle}>You must be at least 18 to use Matcha.</h1>
          <p className={styles.questionCopy}>
            An age under 18 was entered on this device, so onboarding is now locked in local
            storage and cannot continue from this screen.
          </p>
        </div>
      </BasicInfoLayout>
    );
  }

  let stepContent = (
    <AgeStep
      age={draft.age}
      phoneNumber={draft.phoneNumber}
      onAgeChange={setAge}
      onPhoneNumberChange={(value) => updateDraft("phoneNumber", value)}
    />
  );

  if (currentStep === 1) {
    stepContent = (
      <AgePreferenceStep
        preferredAgeMin={draft.preferredAgeMin}
        preferredAgeMax={draft.preferredAgeMax}
        onMinChange={(value) => updatePreferredAgeRange("preferredAgeMin", value)}
        onMaxChange={(value) => updatePreferredAgeRange("preferredAgeMax", value)}
      />
    );
  } else if (currentStep === 2) {
    stepContent = (
      <IdentityPreferenceStep
        genderIdentity={draft.genderIdentity}
        genderIdentityCustom={draft.genderIdentityCustom}
        interestedIn={draft.interestedIn}
        interestedInCustom={draft.interestedInCustom}
        onGenderIdentityChange={(value) => updateDraft("genderIdentity", value)}
        onGenderIdentityCustomChange={(value) => updateDraft("genderIdentityCustom", value)}
        onInterestedInChange={(value) => updateDraft("interestedIn", value)}
        onInterestedInCustomChange={(value) => updateDraft("interestedInCustom", value)}
      />
    );
  } else if (currentStep === 3) {
    stepContent = (
      <EthnicityStep
        ethnicity={draft.ethnicity}
        preferredEthnicities={draft.preferredEthnicities}
        selectedEthnicitySummary={selectedEthnicitySummary}
        onEthnicityChange={(value) => updateDraft("ethnicity", value)}
        onPreferredEthnicityToggle={togglePreferredEthnicity}
      />
    );
  }

  return (
    <BasicInfoLayout
      currentStep={currentStep}
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
            disabled={currentStep === 0 || isSavingSection || isHydrating}
          >
            Back
          </button>
          <button
            className={styles.nextButton}
            type="button"
            onClick={isLastStep ? finishBasicInfo : goNext}
            disabled={!canContinue || isSavingSection || isHydrating}
          >
            {isSavingSection ? "Saving..." : isLastStep ? "Finish basic info" : "Next"}
          </button>
        </>
      }
    >
      {stepContent}
    </BasicInfoLayout>
  );
}
