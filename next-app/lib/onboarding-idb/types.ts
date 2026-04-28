import type { BasicInfoDraft } from "@/app/onboarding/1-basics/_components/basic-info-types";
import type { RelationshipIntent } from "@/app/onboarding/2-mentality/_components/mentality-types";
import type { PictureDraft } from "@/app/onboarding/3-picture/_components/picture-types";
import type {
  AgentConversationStatus,
  AgentConversationMode,
  AgentCriterionDefinition,
  AgentCriterionState,
  AgentTranscriptItem,
} from "@/app/onboarding/4-agent/_lib/agent-types";

export const ONBOARDING_DB_NAME = "matcha-onboarding";
export const ONBOARDING_DB_VERSION = 2;
export const ONBOARDING_META_STORE = "meta";
export const ONBOARDING_FILES_STORE = "files";
export const ONBOARDING_SYNC_STORE = "sync";
export const ONBOARDING_DRAFT_ID = "draft";
export const ONBOARDING_SYNC_ID = "sync";
export const PICTURE_AI_FILE_IDS = ["pfp-ai-1", "pfp-ai-2", "pfp-ai-3"] as const;

export type OnboardingFileRecordId =
  | "pfp-original"
  | (typeof PICTURE_AI_FILE_IDS)[number]
  | `gallery-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;

export type OnboardingMetaRecord = {
  id: typeof ONBOARDING_DRAFT_ID;
  version: 1;
  updatedAt: string;
  sections: {
    basicInfo: {
      currentStep: number;
      completed: boolean;
      flags: {
        ageLocked: boolean;
      };
      answers: BasicInfoDraft;
    };
    mentality: {
      selectedTrack: RelationshipIntent | "";
      completed: boolean;
      shared: {
        currentStepId: "relationship_intent";
        completedStepIds: string[];
        answers: {
          relationshipIntent: RelationshipIntent | "";
        };
      };
      seriousLongterm: {
        currentStepId: string;
        completedStepIds: string[];
        answers: Record<string, unknown>;
      };
      casualShortterm: {
        currentStepId: string;
        completedStepIds: string[];
        answers: Record<string, unknown>;
      };
      openToBoth: {
        currentStepId: string;
        completedStepIds: string[];
        answers: Record<string, unknown>;
      };
    };
    picture: {
      currentStep: number;
      completed: boolean;
      metadata: PictureDraft;
      galleryOrder: number[];
    };
    agent: {
      status: AgentConversationStatus;
      completed: boolean;
      selectedMode: AgentConversationMode | null;
      turnCount: number;
      lastAskedCriterionId: string | null;
      systemPrompt: string;
      criteriaDefinitions: AgentCriterionDefinition[];
      criteria: AgentCriterionState[];
      chatHistory: AgentTranscriptItem[];
      finalSummary: string | null;
      agentMemory: Record<string, unknown> | null;
      completedAt: string | null;
    };
  };
};

export type OnboardingFileRecord = {
  id: OnboardingFileRecordId;
  file: File | null;
  updatedAt: string;
  remotePath?: string | null;
  remoteSignedUrl?: string | null;
};

export type OnboardingSectionSyncState = {
  lastSyncedAt: string | null;
  dirty: boolean;
  syncError: string | null;
};

export type OnboardingSyncRecord = {
  id: typeof ONBOARDING_SYNC_ID;
  migration: {
    localStorageImportedAt: string | null;
    legacyPictureDraftImportedAt: string | null;
    completedVersion: number | null;
  };
  sections: {
    basicInfo: OnboardingSectionSyncState;
    mentality: OnboardingSectionSyncState;
    picture: OnboardingSectionSyncState;
    agent: OnboardingSectionSyncState;
  };
};
