"use client";

import { removeLocalStorageItem, readLocalStorageItem, writeLocalStorageItem } from "./onboarding-storage";
import type { UserInfo } from "./user-info-types";

export function readStoredUserInfo(userInfoStorageKey: string): UserInfo {
  const rawUserInfo = readLocalStorageItem(userInfoStorageKey);

  if (!rawUserInfo) {
    return {};
  }

  try {
    return JSON.parse(rawUserInfo) as UserInfo;
  } catch {
    removeLocalStorageItem(userInfoStorageKey);
    return {};
  }
}

export function writeStoredUserInfo(userInfoStorageKey: string, userInfo: UserInfo) {
  writeLocalStorageItem(userInfoStorageKey, JSON.stringify(userInfo));
}

export function readStoredProgressValue(progressStorageKey: string) {
  return readLocalStorageItem(progressStorageKey);
}

export function writeStoredProgressValue(progressStorageKey: string, value: string) {
  writeLocalStorageItem(progressStorageKey, value);
}
