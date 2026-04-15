"use client";

import { useEffect, useMemo, useState } from "react";

import type { UserInfo } from "./user-info-types";

type StoredSectionState<TDraft, TProgress> = {
  draft: TDraft;
  progress: TProgress;
  hasSavedDraft: boolean;
  userInfo: UserInfo;
};

type UseOnboardingSectionStateOptions<TDraft, TProgress> = {
  readStoredState: () => StoredSectionState<TDraft, TProgress>;
  hasDraftContent: (draft: TDraft, progress: TProgress) => boolean;
  buildUserInfo: (args: {
    draft: TDraft;
    progress: TProgress;
    storedUserInfo: UserInfo;
  }) => UserInfo;
  persistState: (args: {
    draft: TDraft;
    progress: TProgress;
    userInfo: UserInfo;
  }) => void;
};

export function getLocalDraftStatus(hasSavedDraft: boolean) {
  if (hasSavedDraft) {
    return "Saved locally on this device as you go.";
  }

  return "Your answers will be saved locally on this device.";
}

export function useOnboardingSectionState<TDraft, TProgress>({
  readStoredState,
  hasDraftContent,
  buildUserInfo,
  persistState,
}: UseOnboardingSectionStateOptions<TDraft, TProgress>) {
  const [storedState] = useState(readStoredState);
  const [draft, setDraft] = useState<TDraft>(storedState.draft);
  const [progress, setProgress] = useState<TProgress>(storedState.progress);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const userInfo = useMemo(
    () =>
      buildUserInfo({
        draft,
        progress,
        storedUserInfo: storedState.userInfo,
      }),
    [buildUserInfo, draft, progress, storedState.userInfo],
  );

  useEffect(() => {
    persistState({
      draft,
      progress,
      userInfo,
    });
  }, [draft, persistState, progress, userInfo]);

  const draftStatus = getLocalDraftStatus(
    storedState.hasSavedDraft || hasDraftContent(draft, progress),
  );

  return {
    storedState,
    draft,
    setDraft,
    progress,
    setProgress,
    userInfo,
    draftStatus,
    isSavingSection,
    setIsSavingSection,
    saveMessage,
    setSaveMessage,
    saveError,
    setSaveError,
  };
}
