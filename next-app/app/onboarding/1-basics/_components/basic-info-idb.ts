"use client";

import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
import { migrateLegacyOnboardingStorageIfNeeded } from "@/lib/onboarding-idb/migrate-legacy";
import { updateOnboardingMetaRecord } from "@/lib/onboarding-idb/meta-store";
import { markOnboardingSectionDirty } from "@/lib/onboarding-idb/section-sync";
import { initialDraft, TOTAL_STEPS } from "./basic-info-data";
import type { BasicInfoDraft } from "./basic-info-types";

export type StoredBasicInfoState = {
  progress: number;
  draft: BasicInfoDraft;
  hasSavedDraft: boolean;
  isAgeLocked: boolean;
  userInfo: UserInfo;
};

function isValidStep(step: number) {
  return step >= 0 && step < TOTAL_STEPS;
}

function hasContent(draft: BasicInfoDraft) {
  return Boolean(
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
  );
}

export async function readStoredBasicInfoStateFromIdb(): Promise<StoredBasicInfoState> {
  const draftRecord = await migrateLegacyOnboardingStorageIfNeeded();
  const section = draftRecord.sections.basicInfo;

  return {
    progress: isValidStep(section.currentStep) ? section.currentStep : 0,
    draft: {
      ...initialDraft,
      ...section.answers,
      preferredEthnicities: Array.isArray(section.answers.preferredEthnicities)
        ? section.answers.preferredEthnicities
        : initialDraft.preferredEthnicities,
    },
    hasSavedDraft: hasContent(section.answers),
    isAgeLocked: section.flags.ageLocked,
    userInfo: {
      basic_info: section.answers,
    },
  };
}

export async function persistBasicInfoStateToIdb(args: {
  draft: BasicInfoDraft;
  progress: number;
  isAgeLocked: boolean;
}) {
  const { draft, progress, isAgeLocked } = args;

  await updateOnboardingMetaRecord((current) => ({
    ...current,
    sections: {
      ...current.sections,
      basicInfo: {
        ...current.sections.basicInfo,
        currentStep: progress,
        completed: progress >= TOTAL_STEPS - 1,
        flags: {
          ageLocked: isAgeLocked,
        },
        answers: {
          ...draft,
          preferredEthnicities: Array.isArray(draft.preferredEthnicities)
            ? draft.preferredEthnicities
            : [],
        },
      },
    },
  }));

  await markOnboardingSectionDirty("basicInfo");
}

export async function markBasicInfoAgeLockedInIdb(draft: BasicInfoDraft) {
  await persistBasicInfoStateToIdb({
    draft,
    progress: 0,
    isAgeLocked: true,
  });
}
