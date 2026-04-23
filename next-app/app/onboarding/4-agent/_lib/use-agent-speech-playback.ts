"use client";

import { useCallback, useEffect, useRef } from "react";

function findSpeakableBoundary(text: string, isFinal: boolean) {
  if (isFinal) {
    return text.length;
  }

  const sentenceMatches = [...text.matchAll(/[.!?]\s/g)];

  if (sentenceMatches.length > 0) {
    const lastMatch = sentenceMatches.at(-1);

    if (lastMatch?.index !== undefined && lastMatch.index + 2 >= 24) {
      return lastMatch.index + 2;
    }
  }

  const commaMatches = [...text.matchAll(/[,;:]\s/g)];

  if (commaMatches.length > 0) {
    const lastMatch = commaMatches.at(-1);

    if (lastMatch?.index !== undefined && lastMatch.index + 2 >= 80) {
      return lastMatch.index + 2;
    }
  }

  return 0;
}

export function useAgentSpeechPlayback({
  enabled,
  muted,
}: {
  enabled: boolean;
  muted: boolean;
}) {
  const queuedSpeechLengthRef = useRef(0);

  const cancelSpeech = useCallback(() => {
    queuedSpeechLengthRef.current = 0;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const queueSpeechFromText = useCallback(
    (text: string, isFinal: boolean) => {
      if (
        !enabled ||
        muted ||
        typeof window === "undefined" ||
        !("speechSynthesis" in window)
      ) {
        return;
      }

      while (queuedSpeechLengthRef.current < text.length) {
        const remaining = text.slice(queuedSpeechLengthRef.current);
        const boundary = findSpeakableBoundary(remaining, isFinal);

        if (boundary <= 0) {
          break;
        }

        const rawSegment = remaining.slice(0, boundary);
        queuedSpeechLengthRef.current += boundary;
        const segment = rawSegment.replace(/\s+/g, " ").trim();

        if (!segment) {
          continue;
        }

        const utterance = new SpeechSynthesisUtterance(segment);
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
      }
    },
    [enabled, muted],
  );

  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, [cancelSpeech]);

  useEffect(() => {
    if (muted) {
      cancelSpeech();
    }
  }, [cancelSpeech, muted]);

  return {
    cancelSpeech,
    queueSpeechFromText,
  };
}
