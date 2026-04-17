"use client";

import { useCallback, useEffect, useState } from "react";

const DATABASE_NAME = "matcha-onboarding";
const DATABASE_VERSION = 1;
const STORE_NAME = "picture-drafts";
const DRAFT_ID = "current";

type PictureFileRecord = {
  id: string;
  originalFile: File | null;
  generatedFile: File | null;
};

type UsePictureDraftFilesOptions = {
  enabled: boolean;
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("We couldn't open local storage."));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, resolve: (value: T) => void, reject: (error?: unknown) => void) => void,
) {
  const database = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);

    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("IndexedDB transaction was aborted."));
    };

    run(store, resolve, reject);
  });
}

async function readDraftFiles() {
  return withStore<PictureFileRecord | null>("readonly", (store, resolve, reject) => {
    const request = store.get(DRAFT_ID);
    request.onsuccess = () => resolve((request.result as PictureFileRecord | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function writeDraftFiles(record: PictureFileRecord) {
  return withStore<void>("readwrite", (store, resolve, reject) => {
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function clearDraftFiles() {
  return withStore<void>("readwrite", (store, resolve, reject) => {
    const request = store.delete(DRAFT_ID);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

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

      if (!original && !generated) {
        await clearDraftFiles();
        return;
      }

      await writeDraftFiles({
        id: DRAFT_ID,
        originalFile: original,
        generatedFile: generated,
      });
    },
    [setPreviewFile],
  );

  useEffect(() => {
    if (!enabled || hasHydratedFiles) {
      return;
    }

    let isCancelled = false;

    void readDraftFiles()
      .then((record) => {
        if (isCancelled || !record) {
          return;
        }

        setPreviewFile("original", record.originalFile);
        setPreviewFile("generated", record.generatedFile);
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
