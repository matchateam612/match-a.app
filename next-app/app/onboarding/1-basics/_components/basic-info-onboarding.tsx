"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import styles from "../page.module.scss";
import { BasicInfoLayout } from "./basic-info-layout";
import { initialDraft, STORAGE_KEY, TOTAL_STEPS } from "./basic-info-data";
import type { BasicInfoDraft, PreferredEthnicityOption } from "./basic-info-types";
import { AgeStep } from "./steps/age-step";
import { EthnicityStep } from "./steps/ethnicity-step";
import { GenderIdentityStep } from "./steps/gender-identity-step";
import { InterestedInStep } from "./steps/interested-in-step";
import { LocationStep } from "./steps/location-step";

type StoredBasicInfoState = {
  currentStep: number;
  draft: BasicInfoDraft;
  hasSavedDraft: boolean;
};

const emptyStoredState: StoredBasicInfoState = {
  currentStep: 0,
  draft: initialDraft,
  hasSavedDraft: false,
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

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return emptyStoredState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<BasicInfoDraft> & {
      currentStep?: number;
    };

    return {
      currentStep:
        typeof parsed.currentStep === "number" && isValidStep(parsed.currentStep)
          ? parsed.currentStep
          : 0,
      draft: {
        ...initialDraft,
        ...parsed,
        preferredEthnicities: Array.isArray(parsed.preferredEthnicities)
          ? parsed.preferredEthnicities
          : initialDraft.preferredEthnicities,
      },
      hasSavedDraft: true,
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return emptyStoredState;
  }
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

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...draft,
        currentStep,
      }),
    );
  }, [currentStep, draft]);

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

    setCurrentStep((step) => Math.min(step + 1, TOTAL_STEPS - 1));
  }

  function goBack() {
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
      footer={
        <>
          <button
            className={styles.backButton}
            type="button"
            onClick={goBack}
            disabled={currentStep === 0}
          >
            Back
          </button>
          <button
            className={styles.nextButton}
            type="button"
            onClick={goNext}
            disabled={!canContinue}
          >
            {isLastStep ? "Finish basic info" : "Next"}
          </button>
        </>
      }
    >
      {stepContent}
    </BasicInfoLayout>
  );
}
