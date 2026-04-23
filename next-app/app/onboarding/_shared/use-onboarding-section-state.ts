"use client";

import { useEffect, useMemo, useState } from "react";

type StoredSectionState<TDraft, TProgress> = {
  draft: TDraft;
  progress: TProgress;
  hasSavedDraft: boolean;
};

type UseOnboardingSectionStateOptions<
  TDraft,
  TProgress,
  TStoredState extends StoredSectionState<TDraft, TProgress>,
> = {
  initialDraft: TDraft;
  initialProgress: TProgress;
  readStoredState: () => Promise<TStoredState>;
  hasDraftContent: (draft: TDraft, progress: TProgress) => boolean;
  persistState: (args: {
    draft: TDraft;
    progress: TProgress;
  }) => Promise<void>;
  onStoredStateLoaded?: (storedState: TStoredState) => void;
  hydrationErrorMessage: string;
  persistenceErrorMessage: string;
  emptyDraftStatus?: string;
  savedDraftStatus?: string;
};

export function getLocalDraftStatus(hasSavedDraft: boolean, args?: {
  emptyDraftStatus?: string;
  savedDraftStatus?: string;
}) {
  if (hasSavedDraft) {
    return args?.savedDraftStatus ?? "Saved on this device as you go.";
  }

  return args?.emptyDraftStatus ?? "Your answers will be saved on this device.";
}

export function useOnboardingSectionState<
  TDraft,
  TProgress,
  TStoredState extends StoredSectionState<TDraft, TProgress>,
>({
  initialDraft,
  initialProgress,
  readStoredState,
  hasDraftContent,
  persistState,
  onStoredStateLoaded,
  hydrationErrorMessage,
  persistenceErrorMessage,
  emptyDraftStatus,
  savedDraftStatus,
}: UseOnboardingSectionStateOptions<TDraft, TProgress, TStoredState>) {
  const [draft, setDraft] = useState<TDraft>(initialDraft);
  const [progress, setProgress] = useState<TProgress>(initialProgress);
  const [initialHasSavedDraft, setInitialHasSavedDraft] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    void readStoredState()
      .then((storedState) => {
        if (isCancelled) {
          return;
        }

        setDraft(storedState.draft);
        setProgress(storedState.progress);
        setInitialHasSavedDraft(storedState.hasSavedDraft);
        onStoredStateLoaded?.(storedState);
      })
      .catch(() => {
        if (!isCancelled) {
          setSaveError(hydrationErrorMessage);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsHydrating(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [hydrationErrorMessage, onStoredStateLoaded, readStoredState]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    void persistState({
      draft,
      progress,
    }).catch(() => {
      setSaveError(persistenceErrorMessage);
    });
  }, [draft, hasDraftContent, isHydrating, persistState, persistenceErrorMessage, progress]);

  const hasSavedDraft = initialHasSavedDraft || hasDraftContent(draft, progress);

  const draftStatus = useMemo(() => {
    if (isHydrating) {
      return "Preparing your saved draft...";
    }

    return getLocalDraftStatus(hasSavedDraft, {
      emptyDraftStatus,
      savedDraftStatus,
    });
  }, [emptyDraftStatus, hasSavedDraft, isHydrating, savedDraftStatus]);

  return {
    draft,
    setDraft,
    progress,
    setProgress,
    hasSavedDraft,
    isHydrating,
    draftStatus,
    isSavingSection,
    setIsSavingSection,
    saveMessage,
    setSaveMessage,
    saveError,
    setSaveError,
  };
}
