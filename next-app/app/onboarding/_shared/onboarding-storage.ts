"use client";

import { useSyncExternalStore } from "react";

export function subscribeToClientReady() {
  return () => {};
}

export function getServerClientReadySnapshot() {
  return false;
}

export function getClientReadySnapshot() {
  return true;
}

export function useClientReady() {
  return useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getServerClientReadySnapshot,
  );
}

export function readLocalStorageItem(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key);
}

export function writeLocalStorageItem(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, value);
}

export function removeLocalStorageItem(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}
