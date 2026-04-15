"use client";

import { useCallback } from "react";

import styles from "../page.module.scss";
import {
  removeLocalStorageItem,
  readLocalStorageItem,
  useClientReady,
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
import { BasicInfoLayout } from "./basic-info-layout";
import {
  BASIC_INFO_STEP_STORAGE_KEY,
  initialDraft,
  TOTAL_STEPS,
  USER_INFO_STORAGE_KEY,
} from "./basic-info-data";
import type { BasicInfoDraft, PreferredEthnicityOption } from "./basic-info-types";
import { AgeStep } from "./steps/age-step";
import { EthnicityStep } from "./steps/ethnicity-step";
import { GenderIdentityStep } from "./steps/gender-identity-step";
import { InterestedInStep } from "./steps/interested-in-step";
import { LocationStep } from "./steps/location-step";

type StoredBasicInfoState = {
  progress: number;
  draft: BasicInfoDraft;
  hasSavedDraft: boolean;
  userInfo: UserInfo;
};

const emptyStoredState: StoredBasicInfoState = {
  progress: 0,
  draft: initialDraft,
  hasSavedDraft: false,
  userInfo: {},
};

function isValidStep(step: number) {
  return step >= 0 && step < TOTAL_STEPS;
}

function readStoredState(): StoredBasicInfoState {
  if (typeof window === "undefined") {
    return emptyStoredState;
  }

  const rawCurrentStep = readStoredProgressValue(BASIC_INFO_STEP_STORAGE_KEY);
  const legacyBasicInfo = readLocalStorageItem("matcha.onboarding.basic-info");
  let userInfo: UserInfo = readStoredUserInfo(USER_INFO_STORAGE_KEY);

  if (!userInfo.basic_info && legacyBasicInfo) {
    try {
      const parsedLegacy = JSON.parse(legacyBasicInfo) as Partial<BasicInfoDraft> & {
        currentStep?: number;
      };

      userInfo = {
        ...userInfo,
        basic_info: {
          ...initialDraft,
          ...parsedLegacy,
          preferredEthnicities: Array.isArray(parsedLegacy.preferredEthnicities)
            ? parsedLegacy.preferredEthnicities
            : initialDraft.preferredEthnicities,
        },
      };

      if (typeof parsedLegacy.currentStep === "number" && !rawCurrentStep) {
        writeStoredProgressValue(BASIC_INFO_STEP_STORAGE_KEY, String(parsedLegacy.currentStep));
      }

      writeStoredUserInfo(USER_INFO_STORAGE_KEY, userInfo);
      removeLocalStorageItem("matcha.onboarding.basic-info");
    } catch {
      removeLocalStorageItem("matcha.onboarding.basic-info");
    }
  }

  const draft = {
    ...initialDraft,
    ...userInfo.basic_info,
    preferredEthnicities: Array.isArray(userInfo.basic_info?.preferredEthnicities)
      ? userInfo.basic_info.preferredEthnicities
      : initialDraft.preferredEthnicities,
  };

  const parsedCurrentStep = rawCurrentStep ? Number(rawCurrentStep) : 0;

  return {
    progress: isValidStep(parsedCurrentStep) ? parsedCurrentStep : 0,
    draft,
    hasSavedDraft: Boolean(userInfo.basic_info),
    userInfo,
  };
}

function isStepComplete(step: number, draft: BasicInfoDraft) {
  switch (step) {
    case 0:
      return Number(draft.age) >= 18;
    case 1:
      return Boolean(
        draft.genderIdentity &&
          (draft.genderIdentity !== "custom" || draft.genderIdentityCustom.trim()),
      );
    case 2:
      return Boolean(
        draft.interestedIn &&
          (draft.interestedIn !== "custom" || draft.interestedInCustom.trim()),
      );
    case 3:
      return draft.city.trim().length > 1;
    case 4:
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
        draft.genderIdentity ||
        draft.genderIdentityCustom ||
        draft.interestedIn ||
        draft.interestedInCustom ||
        draft.city ||
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
  const buildUserInfo = useCallback(
    ({
      draft,
      storedUserInfo,
    }: {
      draft: BasicInfoDraft;
      progress: number;
      storedUserInfo: UserInfo;
    }) => ({
      ...storedUserInfo,
      basic_info: draft,
    }),
    [],
  );

  const persistState = useCallback(
    ({ progress, userInfo }: { draft: BasicInfoDraft; progress: number; userInfo: UserInfo }) => {
      writeStoredUserInfo(USER_INFO_STORAGE_KEY, userInfo);
      writeStoredProgressValue(BASIC_INFO_STEP_STORAGE_KEY, String(progress));
    },
    [],
  );

  const {
    draft,
    setDraft,
    progress: currentStep,
    setProgress: setCurrentStep,
    userInfo,
    draftStatus,
    isSavingSection,
    setIsSavingSection,
    saveMessage,
    setSaveMessage,
    saveError,
    setSaveError,
  } = useOnboardingSectionState({
    readStoredState,
    hasDraftContent,
    buildUserInfo,
    persistState,
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

  function goNext() {
    if (!canContinue || isLastStep) {
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

      await upsertUserPrivateInfo(user.id, userInfo);
      writeStoredUserInfo(USER_INFO_STORAGE_KEY, userInfo);
      setSaveMessage("Basic info saved. Your user_info row is up to date.");
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

  let stepContent = (
    <AgeStep age={draft.age} onChange={(value) => updateDraft("age", value)} />
  );

  if (currentStep === 1) {
    stepContent = (
      <GenderIdentityStep
        genderIdentity={draft.genderIdentity}
        genderIdentityCustom={draft.genderIdentityCustom}
        onChange={(value) => updateDraft("genderIdentity", value)}
        onCustomChange={(value) => updateDraft("genderIdentityCustom", value)}
      />
    );
  } else if (currentStep === 2) {
    stepContent = (
      <InterestedInStep
        interestedIn={draft.interestedIn}
        interestedInCustom={draft.interestedInCustom}
        onChange={(value) => updateDraft("interestedIn", value)}
        onCustomChange={(value) => updateDraft("interestedInCustom", value)}
      />
    );
  } else if (currentStep === 3) {
    stepContent = (
      <LocationStep city={draft.city} onChange={(value) => updateDraft("city", value)} />
    );
  } else if (currentStep === 4) {
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
            disabled={currentStep === 0 || isSavingSection}
          >
            Back
          </button>
          <button
            className={styles.nextButton}
            type="button"
            onClick={isLastStep ? finishBasicInfo : goNext}
            disabled={!canContinue || isSavingSection}
          >
            {isSavingSection
              ? "Saving..."
              : isLastStep
                ? "Finish basic info"
                : "Next"}
          </button>
        </>
      }
    >
      {stepContent}
    </BasicInfoLayout>
  );
}
