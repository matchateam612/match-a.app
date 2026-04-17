import type { AgentCriterionState } from "./agent-types";

export function summarizeCompletion(criteria: AgentCriterionState[]) {
  const required = criteria.filter((criterion) => criterion.required);
  const confirmedRequiredCount = required.filter(
    (criterion) => criterion.status === "confirmed",
  ).length;
  const readyToConfirm = required.every(
    (criterion) => criterion.status !== "missing" && criterion.confidence >= 0.7,
  );

  return {
    totalCount: criteria.length,
    requiredCount: required.length,
    confirmedRequiredCount,
    readyToConfirm,
  };
}
