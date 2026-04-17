import type { AgentCriterionState } from "./agent-types";

export function buildExtractorPreview(criteria: AgentCriterionState[]) {
  return criteria.map((criterion) => ({
    id: criterion.id,
    label: criterion.label,
    status: criterion.status,
    confidence: criterion.confidence,
    needsConfirmation: criterion.needsConfirmation,
    summary: criterion.summary,
  }));
}
