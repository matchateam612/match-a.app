"use client";

import {
  readStoredProgressValue,
  readStoredUserInfo,
  writeStoredProgressValue,
  writeStoredUserInfo,
} from "@/app/onboarding/_shared/onboarding-persistence";
import { readLocalStorageItem, writeLocalStorageItem } from "@/app/onboarding/_shared/onboarding-storage";
import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
import { createCriterionStates, defaultAgentCriteria, mergeCriterionDefinitions } from "./agent-criteria";
import { defaultPromptSettings } from "./agent-prompts";
import type {
  AgentCriterionDefinition,
  AgentOnboardingState,
  AgentPromptSettings,
} from "./agent-types";

export const USER_INFO_STORAGE_KEY = "user_info";
export const AGENT_STEP_STORAGE_KEY = "user_info.agent.status";
export const AGENT_PROMPT_STORAGE_KEY = "user_info.agent.interviewer_system_prompt";
export const AGENT_TESTING_CRITERIA_STORAGE_KEY = "user_info.agent.testing.criteria";

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

export function readAgentPromptSettings(): AgentPromptSettings {
  const storedPrompt = readLocalStorageItem(AGENT_PROMPT_STORAGE_KEY);

  if (!storedPrompt) {
    return defaultPromptSettings;
  }

  return {
    interviewerSystemPrompt: storedPrompt,
  };
}

export function writeAgentPromptSettings(settings: AgentPromptSettings) {
  writeLocalStorageItem(AGENT_PROMPT_STORAGE_KEY, settings.interviewerSystemPrompt);
}

export function readTestingCriteriaDefinitions(): AgentCriterionDefinition[] {
  const rawValue = readLocalStorageItem(AGENT_TESTING_CRITERIA_STORAGE_KEY);

  if (!rawValue) {
    return defaultAgentCriteria;
  }

  try {
    const parsed = JSON.parse(rawValue) as AgentCriterionDefinition[];

    if (!Array.isArray(parsed) || !parsed.length) {
      return defaultAgentCriteria;
    }

    return parsed.filter(
      (criterion) =>
        typeof criterion.id === "string" &&
        Boolean(criterion.id.trim()) &&
        typeof criterion.label === "string" &&
        Boolean(criterion.label.trim()) &&
        typeof criterion.description === "string",
    );
  } catch {
    return defaultAgentCriteria;
  }
}

export function writeTestingCriteriaDefinitions(
  definitions: AgentCriterionDefinition[],
) {
  writeLocalStorageItem(
    AGENT_TESTING_CRITERIA_STORAGE_KEY,
    JSON.stringify(definitions, null, 2),
  );
}

export function readStoredAgentState(
  definitions: AgentCriterionDefinition[] = readTestingCriteriaDefinitions(),
): {
  draft: AgentOnboardingState;
  progress: string;
  hasSavedDraft: boolean;
  userInfo: UserInfo;
} {
  const userInfo = readStoredUserInfo(USER_INFO_STORAGE_KEY);
  const progress = readStoredProgressValue(AGENT_STEP_STORAGE_KEY) ?? "collecting";
  const savedAgent = userInfo.agent as AgentOnboardingState | undefined;
  const hasSavedDraft = Boolean(savedAgent);

  if (!savedAgent) {
    return {
      draft: createDefaultAgentState(definitions),
      progress,
      hasSavedDraft,
      userInfo,
    };
  }

  return {
    draft: {
      ...savedAgent,
      criteria: mergeCriterionDefinitions(definitions, savedAgent.criteria ?? []),
    },
    progress,
    hasSavedDraft,
    userInfo,
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

export function persistAgentState({
  draft,
  progress,
  userInfo,
}: {
  draft: AgentOnboardingState;
  progress: string;
  userInfo: UserInfo;
}) {
  writeStoredUserInfo(USER_INFO_STORAGE_KEY, {
    ...userInfo,
    agent: draft,
  });
  writeStoredProgressValue(AGENT_STEP_STORAGE_KEY, progress);
}
