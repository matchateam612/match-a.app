import { defaultAgentCriteria } from "@/app/onboarding/4-agent/_lib/agent-criteria";
import { defaultPromptSettings } from "@/app/onboarding/4-agent/_lib/agent-prompts";
import { initialDraft as basicInfoInitialDraft } from "@/app/onboarding/1-basics/_components/basic-info-data";
import { initialDraft as mentalityInitialDraft } from "@/app/onboarding/2-mentality/_components/mentality-data";
import { initialDraft as pictureInitialDraft } from "@/app/onboarding/3-picture/_components/picture-data";
import type { OnboardingMetaRecord, OnboardingSyncRecord } from "./types";
import { ONBOARDING_DRAFT_ID, ONBOARDING_SYNC_ID } from "./types";

function nowIso() {
  return new Date().toISOString();
}

export function createDefaultOnboardingMetaRecord(): OnboardingMetaRecord {
  return {
    id: ONBOARDING_DRAFT_ID,
    version: 1,
    updatedAt: nowIso(),
    sections: {
      basicInfo: {
        currentStep: 0,
        completed: false,
        flags: {
          ageLocked: false,
        },
        answers: { ...basicInfoInitialDraft },
      },
      mentality: {
        selectedTrack: "",
        completed: false,
        shared: {
          currentStepId: "relationship_intent",
          completedStepIds: [],
          answers: {
            relationshipIntent: "",
          },
        },
        seriousLongterm: {
          currentStepId: "serious_openness",
          completedStepIds: [],
          answers: {
            ...mentalityInitialDraft.serious.answers,
          },
        },
        casualShortterm: {
          currentStepId: "casual_frequency",
          completedStepIds: [],
          answers: {
            ...mentalityInitialDraft.casual,
          },
        },
        openToBoth: {
          currentStepId: "open_style",
          completedStepIds: [],
          answers: {
            ...mentalityInitialDraft.open,
          },
        },
      },
      picture: {
        currentStep: 0,
        completed: false,
        metadata: {
          ...pictureInitialDraft,
        },
        galleryOrder: [],
      },
      agent: {
        status: "collecting",
        completed: false,
        selectedMode: null,
        turnCount: 0,
        lastAskedCriterionId: null,
        systemPrompt: defaultPromptSettings.interviewerSystemPrompt,
        criteriaDefinitions: defaultAgentCriteria,
        criteria: [],
        chatHistory: [],
        finalSummary: null,
        agentMemory: null,
        completedAt: null,
      },
    },
  };
}

function createDefaultSectionSyncState() {
  return {
    lastSyncedAt: null,
    dirty: false,
    syncError: null,
  };
}

export function createDefaultOnboardingSyncRecord(): OnboardingSyncRecord {
  return {
    id: ONBOARDING_SYNC_ID,
    migration: {
      localStorageImportedAt: null,
      legacyPictureDraftImportedAt: null,
      completedVersion: null,
    },
    sections: {
      basicInfo: createDefaultSectionSyncState(),
      mentality: createDefaultSectionSyncState(),
      picture: createDefaultSectionSyncState(),
      agent: createDefaultSectionSyncState(),
    },
  };
}
