"use client";

import { useCallback } from "react";

import styles from "../page.module.scss";
import {
  removeLocalStorageItem,
  readLocalStorageItem,
  useClientReady,
  writeLocalStorageItem,
} from "@/app/onboarding/_shared/onboarding-storage";
import {
  readStoredProgressValue,
  readStoredUserInfo,
  writeStoredProgressValue,
  writeStoredUserInfo,
} from "@/app/onboarding/_shared/onboarding-persistence";
import { OnboardingSectionStatus } from "@/app/onboarding/_shared/onboarding-section-status";
import { useOnboardingSectionState } from "@/app/onboarding/_shared/use-onboarding-section-state";
import { useSectionSaveFeedback } from "@/app/onboarding/_shared/use-section-save-feedback";
import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
import { getCurrentUser } from "@/lib/supabase/auth";
import { upsertUserPrivateInfo } from "@/lib/supabase/user-private-info";
import { BasicInfoLayout } from "./basic-info-layout";
import {
  BASIC_INFO_LOCK_STORAGE_KEY,
  BASIC_INFO_STEP_STORAGE_KEY,
  initialDraft,
  TOTAL_STEPS,
  USER_INFO_STORAGE_KEY,
} from "./basic-info-data";
import type { BasicInfoDraft, PreferredEthnicityOption } from "./basic-info-types";
import { AgePreferenceStep } from "./steps/age-preference-step";
import { AgeStep } from "./steps/age-step";
import { EthnicityStep } from "./steps/ethnicity-step";
import { IdentityPreferenceStep } from "./steps/identity-preference-step";

type StoredBasicInfoState = {
  progress: number;
  draft: BasicInfoDraft;
  hasSavedDraft: boolean;
  isAgeLocked: boolean;
  userInfo: UserInfo;
};

const emptyStoredState: StoredBasicInfoState = {
  progress: 0,
  draft: initialDraft,
  hasSavedDraft: false,
  isAgeLocked: false,
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
  const ageLock = readLocalStorageItem(BASIC_INFO_LOCK_STORAGE_KEY) === "true";
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
          preferredAgeMin: parsedLegacy.preferredAgeMin ?? initialDraft.preferredAgeMin,
          preferredAgeMax: parsedLegacy.preferredAgeMax ?? initialDraft.preferredAgeMax,
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
    preferredAgeMin: userInfo.basic_info?.preferredAgeMin ?? initialDraft.preferredAgeMin,
    preferredAgeMax: userInfo.basic_info?.preferredAgeMax ?? initialDraft.preferredAgeMax,
    preferredEthnicities: Array.isArray(userInfo.basic_info?.preferredEthnicities)
      ? userInfo.basic_info.preferredEthnicities
      : initialDraft.preferredEthnicities,
  };

  const parsedCurrentStep = rawCurrentStep ? Number(rawCurrentStep) : 0;
  const derivedAgeLock = draft.age.trim().length > 0 && Number(draft.age) < 18;

  if (derivedAgeLock && !ageLock) {
    writeLocalStorageItem(BASIC_INFO_LOCK_STORAGE_KEY, "true");
  }

  return {
    progress: isValidStep(parsedCurrentStep) ? parsedCurrentStep : 0,
    draft,
    hasSavedDraft: Boolean(userInfo.basic_info),
    isAgeLocked: ageLock || derivedAgeLock,
    userInfo,
  };
}

function isStepComplete(step: number, draft: BasicInfoDraft) {
  switch (step) {
    case 0:
      return draft.age.trim().length > 0;
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
    isAgeLocked,
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

  function setAgeAndLockState(value: string) {
    updateDraft("age", value);

    if (value.trim() && Number(value) < 18) {
      writeLocalStorageItem(BASIC_INFO_LOCK_STORAGE_KEY, "true");
    }
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

  let stepContent = <AgeStep age={draft.age} onChange={setAgeAndLockState} />;

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
            {isSavingSection ? "Saving..." : isLastStep ? "Finish basic info" : "Next"}
          </button>
        </>
      }
    >
      {stepContent}
    </BasicInfoLayout>
  );
}
