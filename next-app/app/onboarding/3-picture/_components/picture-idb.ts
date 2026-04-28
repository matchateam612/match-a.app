"use client";

import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
import { migrateLegacyOnboardingStorageIfNeeded } from "@/lib/onboarding-idb/migrate-legacy";
import { updateOnboardingMetaRecord } from "@/lib/onboarding-idb/meta-store";
import { markOnboardingSectionDirty } from "@/lib/onboarding-idb/section-sync";
import { initialDraft } from "./picture-data";
import type { PictureDraft } from "./picture-types";

export type StoredPictureState = {
  progress: number;
  draft: PictureDraft;
  hasSavedDraft: boolean;
  userInfo: UserInfo;
};

export async function readStoredPictureStateFromIdb(): Promise<StoredPictureState> {
  const draftRecord = await migrateLegacyOnboardingStorageIfNeeded();
  const section = draftRecord.sections.picture;

  return {
    progress: Number.isFinite(section.currentStep) ? section.currentStep : 0,
    draft: {
      ...initialDraft,
      ...section.metadata,
    },
    hasSavedDraft: Boolean(section.metadata.fileName || section.metadata.source),
    userInfo: {
      picture: section.metadata,
    },
  };
}

export async function persistPictureStateToIdb(args: {
  draft: PictureDraft;
  progress: number;
}) {
  const { draft, progress } = args;

  await updateOnboardingMetaRecord((current) => ({
    ...current,
    sections: {
      ...current.sections,
      picture: {
        ...current.sections.picture,
        currentStep: progress,
        completed: Boolean(draft.fileName && draft.mimeType),
        metadata: {
          ...draft,
        },
      },
    },
  }));

  await markOnboardingSectionDirty("picture");
}

export function hasPictureDraftContent(draft: PictureDraft) {
  return Boolean(
    draft.fileName ||
    draft.source ||
    draft.originalAssetKey ||
    draft.generatedAssetKey
  );
}

export function isPictureReady(draft: PictureDraft) {
  return Boolean(draft.source && draft.fileName && draft.mimeType);
}
