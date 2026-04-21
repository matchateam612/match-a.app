"use client";

import {
  ONBOARDING_DB_NAME,
  ONBOARDING_DB_VERSION,
  ONBOARDING_FILES_STORE,
  ONBOARDING_META_STORE,
  ONBOARDING_SYNC_STORE,
} from "./types";

let openPromise: Promise<IDBDatabase> | null = null;

export function openOnboardingDatabase() {
  if (openPromise) {
    return openPromise;
  }

  openPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(ONBOARDING_DB_NAME, ONBOARDING_DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(ONBOARDING_META_STORE)) {
        database.createObjectStore(ONBOARDING_META_STORE, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(ONBOARDING_FILES_STORE)) {
        database.createObjectStore(ONBOARDING_FILES_STORE, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(ONBOARDING_SYNC_STORE)) {
        database.createObjectStore(ONBOARDING_SYNC_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      openPromise = null;
      reject(request.error ?? new Error("We couldn't open onboarding storage."));
    };
    request.onblocked = () => {
      reject(new Error("Onboarding storage upgrade is blocked in another tab."));
    };
  });

  return openPromise;
}

export async function withOnboardingStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (
    store: IDBObjectStore,
    resolve: (value: T) => void,
    reject: (error?: unknown) => void,
  ) => void,
) {
  const database = await openOnboardingDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);

    transaction.onerror = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction was aborted."));
    };

    run(store, resolve, reject);
  });
}
