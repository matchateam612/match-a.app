"use client";

import { createDefaultOnboardingSyncRecord } from "./defaults";
import { withOnboardingStore } from "./open-db";
import {
  ONBOARDING_SYNC_ID,
  ONBOARDING_SYNC_STORE,
  type OnboardingSyncRecord,
} from "./types";

export async function getOnboardingSyncRecord() {
  return withOnboardingStore<OnboardingSyncRecord | null>(
    ONBOARDING_SYNC_STORE,
    "readonly",
    (store, resolve, reject) => {
      const request = store.get(ONBOARDING_SYNC_ID);
      request.onsuccess = () =>
        resolve((request.result as OnboardingSyncRecord | undefined) ?? null);
      request.onerror = () => reject(request.error);
    },
  );
}

export async function getOrCreateOnboardingSyncRecord() {
  const existing = await getOnboardingSyncRecord();

  if (existing) {
    return existing;
  }

  const next = createDefaultOnboardingSyncRecord();
  await saveOnboardingSyncRecord(next);
  return next;
}

export async function saveOnboardingSyncRecord(record: OnboardingSyncRecord) {
  await withOnboardingStore<void>(ONBOARDING_SYNC_STORE, "readwrite", (store, resolve, reject) => {
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  return record;
}

export async function updateOnboardingSyncRecord(
  updater: (current: OnboardingSyncRecord) => OnboardingSyncRecord,
) {
  const current = await getOrCreateOnboardingSyncRecord();
  const next = updater(current);
  return saveOnboardingSyncRecord(next);
}
