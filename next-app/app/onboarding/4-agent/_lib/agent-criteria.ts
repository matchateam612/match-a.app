import type { AgentCriterionDefinition, AgentCriterionState } from "./agent-types";

export const defaultAgentCriteria: AgentCriterionDefinition[] = [
{
  id: "openness_availability",
  label: "Openness and availability",
  description: "How emotionally and practically available someone is to start something now.",
  required: true,
  placeholderSummary: "Still learning how available they are to start something.",
},
{
  id: "early_stage_pacing",
  label: "Early-stage pacing and momentum",
  description: "How fast they like conversations, replies, and first meetings to develop.",
  required: true,
  placeholderSummary: "Still learning what pace feels right for them early on.",
},
{
  id: "attraction_threshold",
  label: "Attraction and selectivity threshold",
  description: "How much they need an initial spark versus growing into interest over time.",
  required: true,
  placeholderSummary: "Still learning how quickly attraction tends to show up for them.",
},
{
  id: "emotional_security",
  label: "Emotional security and risk tolerance",
  description: "How cautious they are, what reassures them, and what makes them pull back.",
  required: true,
  placeholderSummary: "Still learning what makes them feel safe or hesitant.",
},
{
  id: "closeness_style",
  label: "Closeness style in relationships",
  description: "Whether they lean toward intensity, balance, autonomy, or flexibility in intimacy.",
  required: true,
  placeholderSummary: "Still learning how they naturally experience closeness.",
}
];

export function createCriterionState(
  definition: AgentCriterionDefinition,
): AgentCriterionState {
  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    required: Boolean(definition.required),
    summary: null,
    structuredValue: null,
    confidence: 0,
    status: "missing",
    source: "unknown",
    evidence: [],
    needsConfirmation: false,
    updatedAt: null,
  };
}

export function createCriterionStates(
  definitions: AgentCriterionDefinition[],
): AgentCriterionState[] {
  return definitions.map(createCriterionState);
}

export function mergeCriterionDefinitions(
  definitions: AgentCriterionDefinition[],
  existingState: AgentCriterionState[],
): AgentCriterionState[] {
  const existingStateById = new Map(existingState.map((item) => [item.id, item]));

  return definitions.map((definition) => {
    const existing = existingStateById.get(definition.id);

    if (!existing) {
      return createCriterionState(definition);
    }

    return {
      ...existing,
      id: definition.id,
      label: definition.label,
      description: definition.description,
      required: Boolean(definition.required),
    };
  });
}
