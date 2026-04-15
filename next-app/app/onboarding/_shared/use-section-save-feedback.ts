"use client";

import { useCallback } from "react";

type UseSectionSaveFeedbackOptions = {
  setSaveError: (value: string) => void;
  setSaveMessage: (value: string) => void;
};

export function useSectionSaveFeedback({
  setSaveError,
  setSaveMessage,
}: UseSectionSaveFeedbackOptions) {
  const clearSaveFeedback = useCallback(() => {
    setSaveError("");
    setSaveMessage("");
  }, [setSaveError, setSaveMessage]);

  return {
    clearSaveFeedback,
  };
}
