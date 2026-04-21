"use client";

import type { BasicInfoDraft } from "@/app/onboarding/1-basics/_components/basic-info-types";
import { initialDraft as basicInfoInitialDraft } from "@/app/onboarding/1-basics/_components/basic-info-data";
import type { AgentOnboardingState, AgentCriterionDefinition } from "@/app/onboarding/4-agent/_lib/agent-types";
import { createDefaultOnboardingMetaRecord } from "./defaults";
import { getOnboardingMetaRecord, saveOnboardingMetaRecord } from "./meta-store";
import { setOnboardingFileRecord } from "./file-store";
import { getOrCreateOnboardingSyncRecord, saveOnboardingSyncRecord } from "./sync-store";

const USER_INFO_KEY = "user_info";
const LEGACY_BASIC_INFO_KEY = "matcha.onboarding.basic-info";
const LEGACY_BASIC_INFO_STEP_KEY = "user_info.basic_info.current_step";
const LEGACY_BASIC_INFO_LOCK_KEY = "user_info.basic_info.age_locked";
const LEGACY_MENTALITY_STEP_KEY = "user_info.mentality.current_step_id";
const LEGACY_PICTURE_STEP_KEY = "user_info.picture.current_step";
const LEGACY_AGENT_STATUS_KEY = "user_info.agent.status";
const LEGACY_AGENT_PROMPT_KEY = "user_info.agent.interviewer_system_prompt";
const LEGACY_AGENT_CRITERIA_KEY = "user_info.agent.testing.criteria";

type LegacyUserInfo = {
  basic_info?: Partial<BasicInfoDraft>;
  mentality?: Record<string, unknown>;
  mentality_progress?: {
    branch?: string;
    completedStepIds?: string[];
  };
  picture?: Record<string, unknown>;
  agent?: AgentOnboardingState;
};

type LegacyPictureFileRecord = {
  id: string;
  originalFile: File | null;
  generatedFile: File | null;
};

function readLocalStorageValue(key: string) {
  return window.localStorage.getItem(key);
}

function readJson<T>(rawValue: string | null): T | null {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

function sanitizeBasicInfoAnswers(value: Partial<BasicInfoDraft> | undefined): BasicInfoDraft {
  return {
    ...basicInfoInitialDraft,
    ...value,
    preferredEthnicities: Array.isArray(value?.preferredEthnicities)
      ? value.preferredEthnicities
      : basicInfoInitialDraft.preferredEthnicities,
  };
}

async function readLegacyPictureDraftRecord() {
  return new Promise<LegacyPictureFileRecord | null>((resolve) => {
    const request = window.indexedDB.open("matcha-onboarding", 1);

    request.onerror = () => resolve(null);
    request.onsuccess = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains("picture-drafts")) {
        database.close();
        resolve(null);
        return;
      }

      const transaction = database.transaction("picture-drafts", "readonly");
      const store = transaction.objectStore("picture-drafts");
      const getRequest = store.get("current");

      getRequest.onsuccess = () => {
        resolve((getRequest.result as LegacyPictureFileRecord | undefined) ?? null);
      };
      getRequest.onerror = () => resolve(null);

      transaction.oncomplete = () => database.close();
      transaction.onerror = () => database.close();
      transaction.onabort = () => database.close();
    };
  });
}

export async function migrateLegacyOnboardingStorageIfNeeded() {
  const existing = await getOnboardingMetaRecord();

  if (existing) {
    return existing;
  }

  const nextDraft = createDefaultOnboardingMetaRecord();
  const syncRecord = await getOrCreateOnboardingSyncRecord();
  const importedAt = new Date().toISOString();
  const legacyUserInfo = readJson<LegacyUserInfo>(readLocalStorageValue(USER_INFO_KEY)) ?? {};
  const legacyBasicInfo =
    readJson<Partial<BasicInfoDraft> & { currentStep?: number }>(
      readLocalStorageValue(LEGACY_BASIC_INFO_KEY),
    ) ?? null;

  const basicInfoAnswers = sanitizeBasicInfoAnswers(
    legacyUserInfo.basic_info ?? legacyBasicInfo ?? undefined,
  );
  const rawBasicInfoStep =
    readLocalStorageValue(LEGACY_BASIC_INFO_STEP_KEY) ??
    (typeof legacyBasicInfo?.currentStep === "number" ? String(legacyBasicInfo.currentStep) : null);
  const parsedBasicInfoStep = rawBasicInfoStep ? Number(rawBasicInfoStep) : 0;

  nextDraft.sections.basicInfo = {
    currentStep: Number.isFinite(parsedBasicInfoStep) ? parsedBasicInfoStep : 0,
    completed: false,
    flags: {
      ageLocked: readLocalStorageValue(LEGACY_BASIC_INFO_LOCK_KEY) === "true",
    },
    answers: basicInfoAnswers,
  };

  const mentalityProgress = legacyUserInfo.mentality_progress;
  const legacyMentalityStep = readLocalStorageValue(LEGACY_MENTALITY_STEP_KEY);
  nextDraft.sections.mentality = {
    ...nextDraft.sections.mentality,
    selectedTrack:
      (typeof mentalityProgress?.branch === "string" ? mentalityProgress.branch : "") as
        | ""
        | "serious_longterm"
        | "casual_shortterm"
        | "open_to_both",
    shared: {
      currentStepId: "relationship_intent",
      completedStepIds: Array.isArray(mentalityProgress?.completedStepIds)
        ? mentalityProgress.completedStepIds
        : [],
      answers: {
        relationshipIntent:
          typeof legacyUserInfo.mentality?.relationshipIntent === "string"
            ? (legacyUserInfo.mentality.relationshipIntent as
                | ""
                | "serious_longterm"
                | "casual_shortterm"
                | "open_to_both")
            : "",
      },
    },
    seriousLongterm: {
      currentStepId:
        legacyMentalityStep && legacyMentalityStep.startsWith("serious_")
          ? legacyMentalityStep
          : "serious_pace",
      completedStepIds: [],
      answers:
        legacyUserInfo.mentality && typeof legacyUserInfo.mentality.serious === "object"
          ? (legacyUserInfo.mentality.serious as Record<string, unknown>)
          : {},
    },
    casualShortterm: {
      currentStepId:
        legacyMentalityStep && legacyMentalityStep.startsWith("casual_")
          ? legacyMentalityStep
          : "casual_frequency",
      completedStepIds: [],
      answers:
        legacyUserInfo.mentality && typeof legacyUserInfo.mentality.casual === "object"
          ? (legacyUserInfo.mentality.casual as Record<string, unknown>)
          : {},
    },
    openToBoth: {
      currentStepId:
        legacyMentalityStep && legacyMentalityStep.startsWith("open_")
          ? legacyMentalityStep
          : "open_style",
      completedStepIds: [],
      answers:
        legacyUserInfo.mentality && typeof legacyUserInfo.mentality.open === "object"
          ? (legacyUserInfo.mentality.open as Record<string, unknown>)
          : {},
    },
  };

  const picture = legacyUserInfo.picture ?? {};
  const rawPictureStep = readLocalStorageValue(LEGACY_PICTURE_STEP_KEY);
  nextDraft.sections.picture = {
    ...nextDraft.sections.picture,
    currentStep: rawPictureStep ? Number(rawPictureStep) || 0 : 0,
    metadata: {
      ...nextDraft.sections.picture.metadata,
      ...(picture as Partial<typeof nextDraft.sections.picture.metadata>),
    },
  };

  const savedAgent = legacyUserInfo.agent;
  const criteriaDefinitions =
    readJson<AgentCriterionDefinition[]>(readLocalStorageValue(LEGACY_AGENT_CRITERIA_KEY)) ?? [];

  nextDraft.sections.agent = {
    ...nextDraft.sections.agent,
    status:
      readLocalStorageValue(LEGACY_AGENT_STATUS_KEY) === "complete"
        ? "complete"
        : savedAgent?.status ?? "collecting",
    selectedMode: savedAgent?.selectedMode ?? null,
    turnCount: savedAgent?.turnCount ?? 0,
    lastAskedCriterionId: savedAgent?.lastAskedCriterionId ?? null,
    systemPrompt:
      readLocalStorageValue(LEGACY_AGENT_PROMPT_KEY) ?? nextDraft.sections.agent.systemPrompt,
    criteriaDefinitions:
      criteriaDefinitions.length > 0
        ? criteriaDefinitions
        : nextDraft.sections.agent.criteriaDefinitions,
    criteria: savedAgent?.criteria ?? [],
    chatHistory: savedAgent?.transcript ?? [],
    finalSummary: savedAgent?.finalSummary ?? null,
    completedAt: savedAgent?.completedAt ?? null,
    completed: savedAgent?.status === "complete",
  };

  const legacyPictureDraft = await readLegacyPictureDraftRecord();

  if (legacyPictureDraft?.originalFile) {
    await setOnboardingFileRecord({
      id: "pfp-original",
      file: legacyPictureDraft.originalFile,
      updatedAt: importedAt,
    });
  }

  if (legacyPictureDraft?.generatedFile) {
    await setOnboardingFileRecord({
      id: "pfp-ai",
      file: legacyPictureDraft.generatedFile,
      updatedAt: importedAt,
    });
  }

  await saveOnboardingMetaRecord(nextDraft);
  await saveOnboardingSyncRecord({
    ...syncRecord,
    migration: {
      localStorageImportedAt: importedAt,
      legacyPictureDraftImportedAt: legacyPictureDraft ? importedAt : null,
      completedVersion: 1,
    },
  });

  return nextDraft;
}
