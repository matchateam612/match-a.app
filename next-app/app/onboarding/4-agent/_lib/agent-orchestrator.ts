import type { AgentCriterionState, AgentTranscriptItem } from "./agent-types";

export function getNextCriterionToExplore(criteria: AgentCriterionState[]) {
  return (
    criteria.find((criterion) => criterion.required && criterion.status === "missing") ??
    criteria.find((criterion) => criterion.status !== "confirmed") ??
    null
  );
}

export function buildStarterAssistantMessage(criteria: AgentCriterionState[]) {
  const firstCriterion = getNextCriterionToExplore(criteria);

  if (!firstCriterion) {
    return "I already have enough to summarize what you're looking for.";
  }

  return `Let's make this feel natural. I'll learn your preferences step by step, starting with ${firstCriterion.label.toLowerCase()}.`;
}

export function buildDraftSummary(criteria: AgentCriterionState[]) {
  const completedCriteria = criteria.filter((criterion) => criterion.summary);

  if (!completedCriteria.length) {
    return "We are still learning the user's preferences.";
  }

  return completedCriteria
    .map((criterion) => `${criterion.label}: ${criterion.summary}`)
    .join(" ");
}

export function createTranscriptItem(
  item: Omit<AgentTranscriptItem, "id" | "createdAt">,
): AgentTranscriptItem {
  return {
    id: `${item.role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...item,
  };
}
