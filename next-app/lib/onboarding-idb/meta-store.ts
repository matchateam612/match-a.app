"use client";

import { createDefaultOnboardingMetaRecord } from "./defaults";
import { withOnboardingStore } from "./open-db";
import { ONBOARDING_DRAFT_ID, ONBOARDING_META_STORE, type OnboardingMetaRecord } from "./types";

function nowIso() {
  return new Date().toISOString();
}

export async function getOnboardingMetaRecord() {
  return withOnboardingStore<OnboardingMetaRecord | null>(
    ONBOARDING_META_STORE,
    "readonly",
    (store, resolve, reject) => {
      const request = store.get(ONBOARDING_DRAFT_ID);
      request.onsuccess = () =>
        resolve((request.result as OnboardingMetaRecord | undefined) ?? null);
      request.onerror = () => reject(request.error);
    },
  );
}

export async function getOrCreateOnboardingMetaRecord() {
  const existing = await getOnboardingMetaRecord();

  if (existing) {
    return existing;
  }

  const next = createDefaultOnboardingMetaRecord();
  await saveOnboardingMetaRecord(next);
  return next;
}

export async function saveOnboardingMetaRecord(record: OnboardingMetaRecord) {
  const nextRecord: OnboardingMetaRecord = {
    ...record,
    updatedAt: nowIso(),
  };

  await withOnboardingStore<void>(ONBOARDING_META_STORE, "readwrite", (store, resolve, reject) => {
    const request = store.put(nextRecord);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  return nextRecord;
}

export async function updateOnboardingMetaRecord(
  updater: (current: OnboardingMetaRecord) => OnboardingMetaRecord,
) {
  const current = await getOrCreateOnboardingMetaRecord();
  const next = updater(current);
  return saveOnboardingMetaRecord(next);
}
