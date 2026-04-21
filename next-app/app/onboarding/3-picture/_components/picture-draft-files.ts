"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearOnboardingFileRecord,
  getOnboardingFileRecord,
  setOnboardingFileRecord,
} from "@/lib/onboarding-idb/file-store";

type UsePictureDraftFilesOptions = {
  enabled: boolean;
};

function revokeUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

export function usePictureDraftFiles({ enabled }: UsePictureDraftFilesOptions) {
  const [hasHydratedFiles, setHasHydratedFiles] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [generatedFile, setGeneratedFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);

  const setPreviewFile = useCallback(
    (kind: "original" | "generated", file: File | null) => {
      const nextUrl = file ? URL.createObjectURL(file) : null;

      if (kind === "original") {
        setOriginalPreviewUrl((currentUrl) => {
          revokeUrl(currentUrl);
          return nextUrl;
        });
        setOriginalFile(file);
        return;
      }

      setGeneratedPreviewUrl((currentUrl) => {
        revokeUrl(currentUrl);
        return nextUrl;
      });
      setGeneratedFile(file);
    },
    [],
  );

  const replaceFiles = useCallback(
    async ({ original, generated }: { original: File | null; generated: File | null }) => {
      setPreviewFile("original", original);
      setPreviewFile("generated", generated);

      await Promise.all([
        original
          ? setOnboardingFileRecord({
              id: "pfp-original",
              file: original,
              updatedAt: new Date().toISOString(),
            })
          : clearOnboardingFileRecord("pfp-original"),
        generated
          ? setOnboardingFileRecord({
              id: "pfp-ai",
              file: generated,
              updatedAt: new Date().toISOString(),
            })
          : clearOnboardingFileRecord("pfp-ai"),
      ]);
    },
    [setPreviewFile],
  );

  useEffect(() => {
    if (!enabled || hasHydratedFiles) {
      return;
    }

    let isCancelled = false;

    void Promise.all([
      getOnboardingFileRecord("pfp-original"),
      getOnboardingFileRecord("pfp-ai"),
    ])
      .then(([originalRecord, generatedRecord]) => {
        if (isCancelled) {
          return;
        }

        setPreviewFile("original", originalRecord?.file ?? null);
        setPreviewFile("generated", generatedRecord?.file ?? null);
      })
      .finally(() => {
        if (!isCancelled) {
          setHasHydratedFiles(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [enabled, hasHydratedFiles, setPreviewFile]);

  useEffect(() => {
    return () => {
      revokeUrl(originalPreviewUrl);
      revokeUrl(generatedPreviewUrl);
    };
  }, [generatedPreviewUrl, originalPreviewUrl]);

  return {
    isHydratingFiles: enabled && !hasHydratedFiles,
    originalFile,
    generatedFile,
    originalPreviewUrl,
    generatedPreviewUrl,
    setOriginalFile: useCallback(
      async (file: File | null) => {
        await replaceFiles({
          original: file,
          generated: null,
        });
      },
      [replaceFiles],
    ),
    setGeneratedFile: useCallback(
      async (file: File | null) => {
        await replaceFiles({
          original: originalFile,
          generated: file,
        });
      },
      [originalFile, replaceFiles],
    ),
    clearFiles: useCallback(async () => {
      await replaceFiles({
        original: null,
        generated: null,
      });
    }, [replaceFiles]),
  };
}
