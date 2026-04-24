"use client";

import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
import type { MentalityDraft, MentalityProgress } from "@/app/onboarding/2-mentality/_components/mentality-types";
import type { PictureDraft } from "@/app/onboarding/3-picture/_components/picture-types";
import { migrateLegacyOnboardingStorageIfNeeded } from "@/lib/onboarding-idb/migrate-legacy";
import { updateOnboardingMetaRecord } from "@/lib/onboarding-idb/meta-store";
import { updateOnboardingSyncRecord } from "@/lib/onboarding-idb/sync-store";
import { createCriterionStates, defaultAgentCriteria, mergeCriterionDefinitions } from "./agent-criteria";
import { defaultPromptSettings } from "./agent-prompts";
import type {
  AgentCriterionDefinition,
  AgentOnboardingState,
  AgentPromptSettings,
} from "./agent-types";

function toMentalityDraft(
  section: Awaited<ReturnType<typeof migrateLegacyOnboardingStorageIfNeeded>>["sections"]["mentality"],
): MentalityDraft {
  const seriousAnswers =
    section.seriousLongterm.answers &&
    typeof section.seriousLongterm.answers === "object" &&
    !Array.isArray(section.seriousLongterm.answers)
      ? Object.entries(section.seriousLongterm.answers).reduce<Record<string, string>>(
          (result, [key, value]) => {
            if (typeof value === "string") {
              result[key] = value;
            }

            return result;
          },
          {},
        )
      : {};

  return {
    relationshipIntent: section.shared.answers.relationshipIntent,
    serious: {
      answers: seriousAnswers,
    },
    casual: {
      frequency:
        typeof (section.casualShortterm.answers as { frequency?: unknown }).frequency === "string"
          ? ((section.casualShortterm.answers as { frequency: MentalityDraft["casual"]["frequency"] }).frequency)
          : "",
      boundaries: Array.isArray((section.casualShortterm.answers as { boundaries?: unknown }).boundaries)
        ? ((section.casualShortterm.answers as { boundaries: string[] }).boundaries)
        : [],
    },
    open: {
      style:
        typeof (section.openToBoth.answers as { style?: unknown }).style === "string"
          ? ((section.openToBoth.answers as { style: MentalityDraft["open"]["style"] }).style)
          : "",
      needsClarity: Array.isArray((section.openToBoth.answers as { needsClarity?: unknown }).needsClarity)
        ? ((section.openToBoth.answers as { needsClarity: string[] }).needsClarity)
        : [],
    },
  };
}

function toMentalityProgress(
  section: Awaited<ReturnType<typeof migrateLegacyOnboardingStorageIfNeeded>>["sections"]["mentality"],
): MentalityProgress {
  const branch = section.selectedTrack;
  const currentStepId =
    branch === "serious_longterm"
      ? section.seriousLongterm.currentStepId
      : branch === "casual_shortterm"
        ? section.casualShortterm.currentStepId
        : branch === "open_to_both"
          ? section.openToBoth.currentStepId
          : section.shared.currentStepId;

  const completedStepIds = [
    ...section.shared.completedStepIds,
    ...(branch === "serious_longterm"
      ? section.seriousLongterm.completedStepIds
      : branch === "casual_shortterm"
        ? section.casualShortterm.completedStepIds
        : branch === "open_to_both"
          ? section.openToBoth.completedStepIds
          : []),
  ];

  return {
    branch,
    currentStepId,
    completedStepIds,
  };
}

function toPictureDraft(
  section: Awaited<ReturnType<typeof migrateLegacyOnboardingStorageIfNeeded>>["sections"]["picture"],
): PictureDraft {
  const metadata = section.metadata as PictureDraft & { selectedVariant?: "original" | "aiTransformed" };
  return metadata;
}

function createDefaultAgentState(
  definitions: AgentCriterionDefinition[] = defaultAgentCriteria,
): AgentOnboardingState {
  return {
    sessionId: `agent-session-${Date.now()}`,
    selectedMode: null,
    turnCount: 0,
    status: "collecting",
    lastAskedCriterionId: null,
    criteria: createCriterionStates(definitions),
    transcript: [],
    finalSummary: null,
    completedAt: null,
  };
}

export async function readStoredAgentStateFromIdb(
  definitions: AgentCriterionDefinition[] = defaultAgentCriteria,
  promptSettings: AgentPromptSettings = defaultPromptSettings,
): Promise<{
  draft: AgentOnboardingState;
  progress: string;
  hasSavedDraft: boolean;
  userInfo: UserInfo;
}> {
  const draftRecord = await migrateLegacyOnboardingStorageIfNeeded();
  const section = draftRecord.sections.agent;
  const hasSavedDraft = Boolean(
    section.selectedMode ||
      section.chatHistory.length ||
      section.criteria.length ||
      section.finalSummary ||
      section.completedAt,
  );

  if (!hasSavedDraft) {
    return {
      draft: createDefaultAgentState(definitions),
      progress: "collecting",
      hasSavedDraft: false,
      userInfo: {},
    };
  }

  return {
    userInfo: {
      basic_info: draftRecord.sections.basicInfo.answers,
      mentality: toMentalityDraft(draftRecord.sections.mentality),
      mentality_progress: toMentalityProgress(draftRecord.sections.mentality),
      picture: toPictureDraft(draftRecord.sections.picture),
      agent: {
        sessionId: `agent-session-${Date.now()}`,
        selectedMode: section.selectedMode,
        turnCount: section.turnCount,
        status: section.status,
        lastAskedCriterionId: section.lastAskedCriterionId,
        criteria: mergeCriterionDefinitions(definitions, section.criteria ?? []),
        transcript: section.chatHistory,
        finalSummary: section.finalSummary,
        completedAt: section.completedAt,
      },
      agent_system_prompt: promptSettings.interviewerSystemPrompt,
    },
    draft: {
      sessionId: `agent-session-${Date.now()}`,
      selectedMode: section.selectedMode,
      turnCount: section.turnCount,
      status: section.status,
      lastAskedCriterionId: section.lastAskedCriterionId,
      criteria: mergeCriterionDefinitions(definitions, section.criteria ?? []),
      transcript: section.chatHistory,
      finalSummary: section.finalSummary,
      completedAt: section.completedAt,
    },
    progress: section.status,
    hasSavedDraft: true,
  };
}

export function hasAgentDraftContent(draft: AgentOnboardingState, progress: string) {
  return Boolean(
    draft.selectedMode ||
      draft.transcript.length ||
      draft.criteria.some((criterion) => criterion.status !== "missing") ||
      progress,
  );
}

export async function persistAgentStateToIdb(args: {
  draft: AgentOnboardingState;
  progress: string;
  promptSettings: AgentPromptSettings;
  criteriaDefinitions: AgentCriterionDefinition[];
}) {
  const { draft, progress, promptSettings, criteriaDefinitions } = args;

  await updateOnboardingMetaRecord((current) => ({
    ...current,
    sections: {
      ...current.sections,
      agent: {
        ...current.sections.agent,
        status: draft.status,
        completed: draft.status === "complete",
        selectedMode: draft.selectedMode,
        turnCount: draft.turnCount,
        lastAskedCriterionId: draft.lastAskedCriterionId,
        systemPrompt: promptSettings.interviewerSystemPrompt,
        criteriaDefinitions,
        criteria: draft.criteria,
        chatHistory: draft.transcript,
        finalSummary: draft.finalSummary,
        agentMemory: current.sections.agent.agentMemory,
        completedAt: draft.completedAt,
      },
    },
  }));

  await updateOnboardingSyncRecord((current) => ({
    ...current,
    sections: {
      ...current.sections,
      agent: {
        ...current.sections.agent,
        dirty: true,
        syncError: null,
        lastSyncedAt: progress === "complete" ? current.sections.agent.lastSyncedAt : current.sections.agent.lastSyncedAt,
      },
    },
  }));
}
