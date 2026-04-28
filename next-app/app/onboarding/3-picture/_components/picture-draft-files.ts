"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearOnboardingFileRecord,
  getOnboardingFileRecord,
  setOnboardingFileRecord,
} from "@/lib/onboarding-idb/file-store";
import { PICTURE_AI_FILE_IDS } from "@/lib/onboarding-idb/types";

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
  const [generatedFiles, setGeneratedFiles] = useState<(File | null)[]>([null, null, null]);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [generatedPreviewUrls, setGeneratedPreviewUrls] = useState<(string | null)[]>([null, null, null]);

  const setPreviewFile = useCallback(
    (kind: "original" | "generated", file: File | null, index = 0) => {
      const nextUrl = file ? URL.createObjectURL(file) : null;

      if (kind === "original") {
        setOriginalPreviewUrl((currentUrl) => {
          revokeUrl(currentUrl);
          return nextUrl;
        });
        setOriginalFile(file);
        return;
      }

      setGeneratedPreviewUrls((currentUrls) => {
        const nextUrls = [...currentUrls];
        revokeUrl(nextUrls[index] ?? null);
        nextUrls[index] = nextUrl;
        return nextUrls;
      });
      setGeneratedFiles((currentFiles) => {
        const nextFiles = [...currentFiles];
        nextFiles[index] = file;
        return nextFiles;
      });
    },
    [],
  );

  const replaceFiles = useCallback(
    async ({
      original,
      generated,
    }: {
      original: File | null;
      generated: [File | null, File | null, File | null];
    }) => {
      setPreviewFile("original", original);
      generated.forEach((file, index) => {
        setPreviewFile("generated", file, index);
      });

      await Promise.all([
        original
          ? setOnboardingFileRecord({
              id: "pfp-original",
              file: original,
              updatedAt: new Date().toISOString(),
            })
          : clearOnboardingFileRecord("pfp-original"),
        ...generated.map((file, index) =>
          file
            ? setOnboardingFileRecord({
                id: PICTURE_AI_FILE_IDS[index],
                file,
                updatedAt: new Date().toISOString(),
              })
            : clearOnboardingFileRecord(PICTURE_AI_FILE_IDS[index]),
        ),
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
      ...PICTURE_AI_FILE_IDS.map((id) => getOnboardingFileRecord(id)),
    ])
      .then(([originalRecord, ...generatedRecords]) => {
        if (isCancelled) {
          return;
        }

        setPreviewFile("original", originalRecord?.file ?? null);
        generatedRecords.forEach((record, index) => {
          setPreviewFile("generated", record?.file ?? null, index);
        });
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
      generatedPreviewUrls.forEach((url) => revokeUrl(url));
    };
  }, [generatedPreviewUrls, originalPreviewUrl]);

  return {
    isHydratingFiles: enabled && !hasHydratedFiles,
    originalFile,
    generatedFiles,
    originalPreviewUrl,
    generatedPreviewUrls,
    replaceFiles,
    setOriginalFile: useCallback(
      async (file: File | null) => {
        await replaceFiles({
          original: file,
          generated: [null, null, null],
        });
      },
      [replaceFiles],
    ),
    setGeneratedFiles: useCallback(
      async (files: [File | null, File | null, File | null]) => {
        await replaceFiles({
          original: originalFile,
          generated: files,
        });
      },
      [originalFile, replaceFiles],
    ),
    clearFiles: useCallback(async () => {
      await replaceFiles({
        original: null,
        generated: [null, null, null],
      });
    }, [replaceFiles]),
  };
}
