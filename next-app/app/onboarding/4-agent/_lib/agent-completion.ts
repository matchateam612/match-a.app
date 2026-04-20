import type { AgentCriterionState } from "./agent-types";

export function summarizeCompletion(criteria: AgentCriterionState[]) {
  const required = criteria.filter((criterion) => criterion.required);
  const confirmedRequiredCount = required.filter(
    (criterion) => criterion.status === "confirmed",
  ).length;
  const allCriteriaStronglyConfirmed =
    criteria.length > 0 &&
    criteria.every(
      (criterion) => criterion.status === "confirmed" && criterion.confidence >= 0.8,
    );

  return {
    totalCount: criteria.length,
    requiredCount: required.length,
    confirmedRequiredCount,
    readyToConfirm: allCriteriaStronglyConfirmed,
  };
}
