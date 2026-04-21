"use client";

import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
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
    userInfo: {
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
