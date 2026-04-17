import type { AgentCriterionDefinition, AgentCriterionState } from "./agent-types";

export const defaultAgentCriteria: AgentCriterionDefinition[] = [
  {
    id: "relationship_intention",
    label: "Relationship intention",
    description: "What kind of connection the user hopes to build.",
    required: true,
    placeholderSummary: "Still learning what kind of relationship they want.",
  },
  {
    id: "communication_style",
    label: "Communication style",
    description: "How the user likes to communicate and be communicated with.",
    required: true,
    placeholderSummary: "Still learning how they want communication to feel.",
  },
  {
    id: "partner_traits",
    label: "Partner traits",
    description: "The qualities they most want in a match.",
    required: true,
    placeholderSummary: "Still learning what they want in a partner.",
  },
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
