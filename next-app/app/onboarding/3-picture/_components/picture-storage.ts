import {
  readStoredProgressValue,
  readStoredUserInfo,
} from "@/app/onboarding/_shared/onboarding-persistence";
import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
import {
  initialDraft,
  PICTURE_STEP_STORAGE_KEY,
} from "./picture-data";
import type { PictureDraft } from "./picture-types";

export type StoredPictureState = {
  progress: number;
  draft: PictureDraft;
  hasSavedDraft: boolean;
  userInfo: UserInfo;
};

const emptyStoredState: StoredPictureState = {
  progress: 0,
  draft: initialDraft,
  hasSavedDraft: false,
  userInfo: {},
};

export function readStoredPictureState(): StoredPictureState {
  if (typeof window === "undefined") {
    return emptyStoredState;
  }

  const rawCurrentStep = readStoredProgressValue(PICTURE_STEP_STORAGE_KEY);
  const userInfo = readStoredUserInfo("user_info");
  const parsedCurrentStep = rawCurrentStep ? Number(rawCurrentStep) : 0;

  return {
    progress: Number.isFinite(parsedCurrentStep) ? parsedCurrentStep : 0,
    draft: {
      ...initialDraft,
      ...(userInfo.picture as PictureDraft | undefined),
    },
    hasSavedDraft: Boolean(userInfo.picture),
    userInfo,
  };
}

export function hasPictureDraftContent(draft: PictureDraft) {
  return Boolean(draft.fileName || draft.source || draft.prompt.trim());
}

export function isPictureReady(draft: PictureDraft) {
  return Boolean(draft.source && draft.fileName && draft.mimeType);
}
