"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import styles from "../page.module.scss";
import { getCurrentUser } from "@/lib/supabase/auth";
import { upsertUserPrivateInfo } from "@/lib/supabase/user-private-info";
import { BasicInfoLayout } from "./basic-info-layout";
import {
  BASIC_INFO_STEP_STORAGE_KEY,
  initialDraft,
  TOTAL_STEPS,
  USER_INFO_STORAGE_KEY,
} from "./basic-info-data";
import type { BasicInfoDraft, PreferredEthnicityOption, UserInfo } from "./basic-info-types";
import { AgeStep } from "./steps/age-step";
import { EthnicityStep } from "./steps/ethnicity-step";
import { GenderIdentityStep } from "./steps/gender-identity-step";
import { InterestedInStep } from "./steps/interested-in-step";
import { LocationStep } from "./steps/location-step";

type StoredBasicInfoState = {
  currentStep: number;
  draft: BasicInfoDraft;
  hasSavedDraft: boolean;
  userInfo: UserInfo;
};

const emptyStoredState: StoredBasicInfoState = {
  currentStep: 0,
  draft: initialDraft,
  hasSavedDraft: false,
  userInfo: {},
};

function subscribeToClientReady() {
  return () => {};
}

function getServerClientReadySnapshot() {
  return false;
}

function getClientReadySnapshot() {
  return true;
}

function isValidStep(step: number) {
  return step >= 0 && step < TOTAL_STEPS;
}

function readStoredState(): StoredBasicInfoState {
  if (typeof window === "undefined") {
    return emptyStoredState;
  }

  const rawUserInfo = window.localStorage.getItem(USER_INFO_STORAGE_KEY);
  const rawCurrentStep = window.localStorage.getItem(BASIC_INFO_STEP_STORAGE_KEY);
  const legacyBasicInfo = window.localStorage.getItem("matcha.onboarding.basic-info");

  let userInfo: UserInfo = {};

  if (rawUserInfo) {
    try {
      userInfo = JSON.parse(rawUserInfo) as UserInfo;
    } catch {
      window.localStorage.removeItem(USER_INFO_STORAGE_KEY);
    }
  }

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
        window.localStorage.setItem(
          BASIC_INFO_STEP_STORAGE_KEY,
          String(parsedLegacy.currentStep),
        );
      }

      window.localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(userInfo));
      window.localStorage.removeItem("matcha.onboarding.basic-info");
    } catch {
      window.localStorage.removeItem("matcha.onboarding.basic-info");
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
    currentStep: isValidStep(parsedCurrentStep) ? parsedCurrentStep : 0,
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

function getDraftStatus(hasSavedDraft: boolean) {
  if (hasSavedDraft) {
    return "Saved locally on this device as you go.";
  }

  return "Your answers will be saved locally on this device.";
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
  const isClientReady = useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getServerClientReadySnapshot,
  );

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
  const [storedState] = useState(readStoredState);
  const [draft, setDraft] = useState<BasicInfoDraft>(storedState.draft);
  const [currentStep, setCurrentStep] = useState(storedState.currentStep);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const userInfo: UserInfo = useMemo(
    () => ({
      ...storedState.userInfo,
      basic_info: draft,
    }),
    [draft, storedState.userInfo],
  );

  useEffect(() => {
    window.localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(userInfo));
    window.localStorage.setItem(BASIC_INFO_STEP_STORAGE_KEY, String(currentStep));
  }, [currentStep, userInfo]);

  const draftStatus = getDraftStatus(
    storedState.hasSavedDraft || hasDraftContent(draft, currentStep),
  );
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

    setSaveError("");
    setSaveMessage("");
    setCurrentStep((step) => Math.min(step + 1, TOTAL_STEPS - 1));
  }

  function goBack() {
    setSaveError("");
    setSaveMessage("");
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
      window.localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(userInfo));
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
        saveError ? (
          <p className={`${styles.statusMessage} ${styles.statusError}`}>{saveError}</p>
        ) : saveMessage ? (
          <p className={`${styles.statusMessage} ${styles.statusSuccess}`}>{saveMessage}</p>
        ) : null
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
