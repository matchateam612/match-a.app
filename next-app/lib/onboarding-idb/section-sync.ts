"use client";

import { updateOnboardingSyncRecord } from "./sync-store";
import type { OnboardingSyncRecord } from "./types";

export type OnboardingSectionKey = keyof OnboardingSyncRecord["sections"];

export async function markOnboardingSectionDirty(sectionKey: OnboardingSectionKey) {
  await updateOnboardingSyncRecord((current) => ({
    ...current,
    sections: {
      ...current.sections,
      [sectionKey]: {
        ...current.sections[sectionKey],
        dirty: true,
        syncError: null,
      },
    },
  }));
}
