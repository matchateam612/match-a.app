"use client";

import { withOnboardingStore } from "./open-db";
import {
  ONBOARDING_FILES_STORE,
  type OnboardingFileRecord,
  type OnboardingFileRecordId,
} from "./types";

function nowIso() {
  return new Date().toISOString();
}

export async function getOnboardingFileRecord(id: OnboardingFileRecordId) {
  return withOnboardingStore<OnboardingFileRecord | null>(
    ONBOARDING_FILES_STORE,
    "readonly",
    (store, resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () =>
        resolve((request.result as OnboardingFileRecord | undefined) ?? null);
      request.onerror = () => reject(request.error);
    },
  );
}

export async function setOnboardingFileRecord(record: OnboardingFileRecord) {
  const nextRecord = {
    ...record,
    updatedAt: nowIso(),
  };

  await withOnboardingStore<void>(ONBOARDING_FILES_STORE, "readwrite", (store, resolve, reject) => {
    const request = store.put(nextRecord);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  return nextRecord;
}

export async function clearOnboardingFileRecord(id: OnboardingFileRecordId) {
  await withOnboardingStore<void>(ONBOARDING_FILES_STORE, "readwrite", (store, resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
