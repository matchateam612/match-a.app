import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
import {
  createOpenAiCompatibleChatCompletion,
  createOpenAiCompatibleChatCompletionStream,
} from "@/lib/llm/openai-compatible";
import { getLlmEnv } from "@/lib/llm/env";
import { summarizeCompletion } from "./agent-completion";
import { buildDraftSummary, getNextCriterionToExplore } from "./agent-orchestrator";
import type {
  CreateInitialAgentTurnRequest,
  CreateInitialAgentTurnResponse,
  CreateVoiceTurnContextResponse,
  ResolveAgentTurnExtractionResponse,
  SubmitAgentTurnRequest,
} from "./agent-api-types";
import type {
  AgentCriterionDefinition,
  AgentCriterionState,
  AgentCriterionStatus,
} from "./agent-types";

type ExtractorUpdate = {
  id: string;
  summary: string | null;
  structuredValue: unknown;
  confidence: number;
  status: AgentCriterionStatus;
  source: "explicit" | "inferred" | "unknown";
  evidence: string[];
  needsConfirmation: boolean;
};

type ExtractorResult = {
  criteria: ExtractorUpdate[];
  notes?: string;
};

function clipConfidence(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function normalizeEvidence(evidence: unknown) {
  if (!Array.isArray(evidence)) {
    return [];
  }

  return evidence.filter((item): item is string => typeof item === "string").slice(0, 3);
}

function mergeCriteria(
  currentCriteria: AgentCriterionState[],
  extractorResult: ExtractorResult,
): AgentCriterionState[] {
  const updateById = new Map(extractorResult.criteria.map((criterion) => [criterion.id, criterion]));

  return currentCriteria.map((criterion) => {
    const update = updateById.get(criterion.id);

    if (!update) {
      return criterion;
    }

    return {
      ...criterion,
      summary: update.summary,
      structuredValue: update.structuredValue,
      confidence: clipConfidence(update.confidence),
      status: update.status,
      source: update.source,
      evidence: normalizeEvidence(update.evidence),
      needsConfirmation: Boolean(update.needsConfirmation),
      updatedAt: new Date().toISOString(),
    };
  });
}

function buildExtractorSystemPrompt(definitions: AgentCriterionDefinition[]) {
  return `You extract structured dating preference signals from a transcript.

Return valid JSON only with this exact shape:
{
  "criteria": [
    {
      "id": "criterion_id",
      "summary": "short summary or null",
      "structuredValue": any,
      "confidence": 0.0,
      "status": "missing" | "tentative" | "confirmed",
      "source": "explicit" | "inferred" | "unknown",
      "evidence": ["short supporting quote or paraphrase"],
      "needsConfirmation": true
    }
  ],
  "notes": "optional short note"
}

Rules:
- Prefer explicit user statements over inference.
- Use "missing" when evidence is weak.
- Use "confirmed" only when the user is very clear or has effectively confirmed it.
- Keep summaries short and useful for matching.
- Only include criterion ids from this list: ${definitions.map((criterion) => criterion.id).join(", ")}.
- Return one object for every provided criterion id.`;
}

function buildExtractorUserPrompt(request: SubmitAgentTurnRequest) {
  return JSON.stringify(
    {
      criteriaDefinitions: request.criteriaDefinitions,
      existingCriteria: request.criteria,
      transcript: request.transcript,
      latestUserMessage: request.userMessage,
    },
    null,
    2,
  );
}

function buildInterviewerSystemPrompt() {
  return `You are the interviewer model for a dating app onboarding flow.

You receive:
- the app's interviewer system prompt
- the updated structured criteria state
- which criterion is still missing or weak
- a draft summary

Your job is to produce the next best assistant message.

Rules:
- Sound natural and warm.
- Ask one focused thing at a time.
- Do not mention internal scores or JSON.
- If every criterion is strongly confirmed, stop asking new questions and give a concise confirmation summary of what you heard.
- The confirmation message should clearly invite the user to review and confirm before the app ends the process.
- Keep the response concise.`;
}

function buildPriorOnboardingContext(userInfo: UserInfo) {
  return {
    basicInfo: userInfo.basic_info ?? null,
    mentality: userInfo.mentality ?? null,
    mentalityProgress: userInfo.mentality_progress ?? null,
    picture: userInfo.picture
      ? {
          source: typeof userInfo.picture === "object" ? (userInfo.picture as Record<string, unknown>).source ?? null : null,
          hasSelectedImage: typeof userInfo.picture === "object"
            ? Boolean((userInfo.picture as Record<string, unknown>).selectedImageUrl)
            : false,
        }
      : null,
  };
}

function buildInterviewerUserPrompt({
  request,
  updatedCriteria,
  draftSummary,
}: {
  request: SubmitAgentTurnRequest;
  updatedCriteria: AgentCriterionState[];
  draftSummary: string;
}) {
  const nextCriterion = getNextCriterionToExplore(updatedCriteria);
  const completion = summarizeCompletion(updatedCriteria);

  return JSON.stringify(
    {
      productSystemPrompt: request.interviewerSystemPrompt,
      selectedMode: request.selectedMode,
      transcript: request.transcript,
      updatedCriteria,
      draftSummary,
      completion,
      nextCriterion: nextCriterion
        ? {
            id: nextCriterion.id,
            label: nextCriterion.label,
            description: nextCriterion.description,
          }
        : null,
    },
    null,
    2,
  );
}

function extractJsonObject(rawText: string) {
  const trimmed = rawText.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : trimmed;
  const firstBraceIndex = candidate.indexOf("{");
  const lastBraceIndex = candidate.lastIndexOf("}");

  if (firstBraceIndex === -1 || lastBraceIndex === -1 || lastBraceIndex <= firstBraceIndex) {
    console.error("[agent-turn][extractor] Failed to locate JSON object in extractor output.", {
      rawText,
    });
    throw new Error("Extractor response did not contain a JSON object.");
  }

  return JSON.parse(candidate.slice(firstBraceIndex, lastBraceIndex + 1)) as ExtractorResult;
}

function buildFallbackExtractorResult(
  currentCriteria: AgentCriterionState[],
  userMessage: string,
): ExtractorResult {
  const nextMissingCriterion =
    currentCriteria.find((criterion) => criterion.status === "missing") ?? currentCriteria[0];

  if (!nextMissingCriterion) {
    return { criteria: [] };
  }

  return {
    criteria: currentCriteria.map((criterion) =>
      criterion.id === nextMissingCriterion.id
        ? {
            id: criterion.id,
            summary: userMessage.slice(0, 180),
            structuredValue: userMessage,
            confidence: 0.6,
            status: "tentative",
            source: "explicit",
            evidence: [userMessage],
            needsConfirmation: true,
          }
        : {
            id: criterion.id,
            summary: criterion.summary,
            structuredValue: criterion.structuredValue,
            confidence: criterion.confidence,
            status: criterion.status,
            source: criterion.source,
            evidence: criterion.evidence,
            needsConfirmation: criterion.needsConfirmation,
          },
    ),
    notes: "Fallback extractor used because the LLM provider is not configured.",
  };
}

async function runExtractor(request: SubmitAgentTurnRequest) {
  const env = getLlmEnv();

  console.log("[agent-turn][extractor] Starting extractor step.", {
    provider: env.provider,
    baseUrl: env.baseUrl,
    model: env.extractorModel,
    hasApiKey: Boolean(env.apiKey),
    criteriaCount: request.criteriaDefinitions.length,
    transcriptCount: request.transcript.length,
  });

  if (!env.apiKey) {
    console.warn("[agent-turn][extractor] No LLM API key found. Using fallback extractor.");
    return {
      rawOutput: JSON.stringify(buildFallbackExtractorResult(request.criteria, request.userMessage)),
      parsedResult: buildFallbackExtractorResult(request.criteria, request.userMessage),
    };
  }

  const rawOutput = await createOpenAiCompatibleChatCompletion({
    model: env.extractorModel,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: buildExtractorSystemPrompt(request.criteriaDefinitions),
      },
      {
        role: "user",
        content: buildExtractorUserPrompt(request),
      },
    ],
  });

  console.log("[agent-turn][extractor] Extractor raw output received.", {
    rawOutput,
  });

  try {
    return {
      rawOutput,
      parsedResult: extractJsonObject(rawOutput),
    };
  } catch (error) {
    console.error("[agent-turn][extractor] Failed to parse extractor output.", {
      error: error instanceof Error ? error.message : String(error),
      rawOutput,
    });
    throw error;
  }
}

async function runInterviewer({
  request,
  updatedCriteria,
  draftSummary,
}: {
  request: SubmitAgentTurnRequest;
  updatedCriteria: AgentCriterionState[];
  draftSummary: string;
}) {
  const env = getLlmEnv();

  console.log("[agent-turn][interviewer] Starting interviewer step.", {
    provider: env.provider,
    baseUrl: env.baseUrl,
    model: env.interviewerModel,
    hasApiKey: Boolean(env.apiKey),
  });

  if (!env.apiKey) {
    const nextCriterion = getNextCriterionToExplore(updatedCriteria);

    if (!nextCriterion) {
      return `Here’s what I’m hearing so far: ${draftSummary}. Did I get that right?`;
    }

    return `Thanks, that helps. I’d like to understand ${nextCriterion.label.toLowerCase()} next. What matters most to you there?`;
  }

  return createOpenAiCompatibleChatCompletion({
    model: env.interviewerModel,
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: buildInterviewerSystemPrompt(),
      },
      {
        role: "user",
        content: buildInterviewerUserPrompt({
          request,
          updatedCriteria,
          draftSummary,
        }),
      },
    ],
  });
}

async function runInterviewerStream({
  request,
  updatedCriteria,
  draftSummary,
}: {
  request: SubmitAgentTurnRequest;
  updatedCriteria: AgentCriterionState[];
  draftSummary: string;
}) {
  const env = getLlmEnv();

  console.log("[agent-turn][interviewer] Starting streaming interviewer step.", {
    provider: env.provider,
    baseUrl: env.baseUrl,
    model: env.interviewerModel,
    hasApiKey: Boolean(env.apiKey),
  });

  if (!env.apiKey) {
    const fallbackMessage = await runInterviewer({
      request,
      updatedCriteria,
      draftSummary,
    });

    async function* fallbackStream() {
      yield fallbackMessage;
    }

    return fallbackStream();
  }

  return createOpenAiCompatibleChatCompletionStream({
    model: env.interviewerModel,
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: buildInterviewerSystemPrompt(),
      },
      {
        role: "user",
        content: buildInterviewerUserPrompt({
          request,
          updatedCriteria,
          draftSummary,
        }),
      },
    ],
  });
}

async function runInitialInterviewer(request: CreateInitialAgentTurnRequest) {
  const env = getLlmEnv();
  const draftSummary = buildDraftSummary(request.criteria);
  const nextCriterion = getNextCriterionToExplore(request.criteria);
  const priorOnboardingContext = buildPriorOnboardingContext(request.userInfo);

  console.log("[agent-turn][initial] Starting initial interviewer step.", {
    provider: env.provider,
    baseUrl: env.baseUrl,
    model: env.interviewerModel,
    hasApiKey: Boolean(env.apiKey),
    selectedMode: request.selectedMode,
    hasBasicInfo: Boolean(request.userInfo.basic_info),
    hasMentality: Boolean(request.userInfo.mentality),
  });

  if (!env.apiKey) {
    if (!nextCriterion) {
      return "I have a strong starting picture of what you're looking for. I'll reflect it back so we can confirm the details together.";
    }

    return `I’ve got some context from your earlier onboarding answers. To get this conversation started, tell me a little about ${nextCriterion.label.toLowerCase()}.`;
  }

  return createOpenAiCompatibleChatCompletion({
    model: env.interviewerModel,
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: buildInterviewerSystemPrompt(),
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            isFirstTurn: true,
            selectedMode: request.selectedMode,
            productSystemPrompt: request.interviewerSystemPrompt,
            criteriaDefinitions: request.criteriaDefinitions,
            criteria: request.criteria,
            draftSummary,
            nextCriterion: nextCriterion
              ? {
                  id: nextCriterion.id,
                  label: nextCriterion.label,
                  description: nextCriterion.description,
                }
              : null,
            priorOnboardingContext,
            transcript: [],
            latestUserMessage: null,
          },
          null,
          2,
        ),
      },
    ],
  });
}

export async function processAgentTurn(request: SubmitAgentTurnRequest) {
  console.log("[agent-turn] Processing new agent turn.", {
    selectedMode: request.selectedMode,
    userMessage: request.userMessage,
    transcriptCount: request.transcript.length,
    criteriaCount: request.criteria.length,
  });

  const extractor = await runExtractor(request);
  const updatedCriteria = mergeCriteria(request.criteria, extractor.parsedResult);
  const draftSummary = buildDraftSummary(updatedCriteria);
  const completion = summarizeCompletion(updatedCriteria);

  console.log("[agent-turn] Criteria merged after extraction.", {
    updatedCriteria,
    draftSummary,
    readyToConfirm: completion.readyToConfirm,
  });

  const assistantMessage = await runInterviewer({
    request,
    updatedCriteria,
    draftSummary,
  });

  const responsePayload = {
    criteria: updatedCriteria,
    assistantMessage,
    draftSummary,
    status: completion.readyToConfirm ? "confirming" : "collecting",
    lastAskedCriterionId: getNextCriterionToExplore(updatedCriteria)?.id ?? null,
    extractorRawOutput: extractor.rawOutput,
  } as const;

  console.log("[agent-turn] Agent turn completed successfully.", responsePayload);

  return responsePayload;
}

export async function prepareAgentTurn(request: SubmitAgentTurnRequest) {
  console.log("[agent-turn] Preparing agent turn for streaming.", {
    selectedMode: request.selectedMode,
    userMessage: request.userMessage,
    transcriptCount: request.transcript.length,
    criteriaCount: request.criteria.length,
  });

  const extractor = await runExtractor(request);
  const updatedCriteria = mergeCriteria(request.criteria, extractor.parsedResult);
  const draftSummary = buildDraftSummary(updatedCriteria);
  const completion = summarizeCompletion(updatedCriteria);

  return {
    updatedCriteria,
    draftSummary,
    status: completion.readyToConfirm ? "confirming" as const : "collecting" as const,
    lastAskedCriterionId: getNextCriterionToExplore(updatedCriteria)?.id ?? null,
    extractorRawOutput: extractor.rawOutput,
  };
}

export function prepareAgentTurnSnapshot(request: SubmitAgentTurnRequest) {
  const draftSummary = buildDraftSummary(request.criteria);
  const completion = summarizeCompletion(request.criteria);

  return {
    snapshotCriteria: request.criteria,
    draftSummary,
    status: completion.readyToConfirm ? "confirming" as const : "collecting" as const,
    lastAskedCriterionId: getNextCriterionToExplore(request.criteria)?.id ?? null,
  };
}

export function createVoiceTurnContext(
  request: SubmitAgentTurnRequest,
): CreateVoiceTurnContextResponse {
  const snapshot = prepareAgentTurnSnapshot(request);
  const nextCriterion = getNextCriterionToExplore(snapshot.snapshotCriteria);

  return {
    instructions:
      "You are the spoken interviewer for a dating app onboarding flow. Read the provided app-generated turn context and produce the next spoken assistant reply. Sound warm and natural. Ask one focused question at a time. Do not mention JSON, internal state, or scores. If the context indicates the user is ready to confirm, give a concise spoken confirmation summary and invite confirmation.",
    inputText: JSON.stringify(
      {
        productSystemPrompt: request.interviewerSystemPrompt,
        selectedMode: request.selectedMode,
        transcript: request.transcript,
        currentCriteria: snapshot.snapshotCriteria,
        draftSummary: snapshot.draftSummary,
        latestUserMessage: request.userMessage,
        nextCriterion: nextCriterion
          ? {
              id: nextCriterion.id,
              label: nextCriterion.label,
              description: nextCriterion.description,
            }
          : null,
        isFirstTurn: false,
      },
      null,
      2,
    ),
    draftSummary: snapshot.draftSummary,
    status: snapshot.status,
    lastAskedCriterionId: snapshot.lastAskedCriterionId,
  };
}

export async function resolveAgentTurnExtraction(request: SubmitAgentTurnRequest) {
  try {
    const extractor = await runExtractor(request);
    const updatedCriteria = mergeCriteria(request.criteria, extractor.parsedResult);
    const draftSummary = buildDraftSummary(updatedCriteria);
    const completion = summarizeCompletion(updatedCriteria);

    return {
      criteria: updatedCriteria,
      draftSummary,
      status: completion.readyToConfirm ? "confirming" as const : "collecting" as const,
      lastAskedCriterionId: getNextCriterionToExplore(updatedCriteria)?.id ?? null,
      extractorRawOutput: extractor.rawOutput,
    } satisfies ResolveAgentTurnExtractionResponse;
  } catch (error) {
    console.error("[agent-turn] Extraction resolution failed. Falling back to turn snapshot criteria.", {
      error: error instanceof Error ? error.message : String(error),
    });

    const snapshot = prepareAgentTurnSnapshot(request);

    return {
      criteria: snapshot.snapshotCriteria,
      draftSummary: snapshot.draftSummary,
      status: snapshot.status,
      lastAskedCriterionId: snapshot.lastAskedCriterionId,
      extractorRawOutput: "",
    } satisfies ResolveAgentTurnExtractionResponse;
  }
}

export async function streamPreparedAgentTurn({
  request,
  updatedCriteria,
  draftSummary,
}: {
  request: SubmitAgentTurnRequest;
  updatedCriteria: AgentCriterionState[];
  draftSummary: string;
}) {
  return runInterviewerStream({
    request,
    updatedCriteria,
    draftSummary,
  });
}

export async function createInitialAgentTurn(
  request: CreateInitialAgentTurnRequest,
): Promise<CreateInitialAgentTurnResponse> {
  const assistantMessage = await runInitialInterviewer(request);
  const completion = summarizeCompletion(request.criteria);

  return {
    assistantMessage,
    draftSummary: buildDraftSummary(request.criteria),
    status: completion.readyToConfirm ? "confirming" : "collecting",
    lastAskedCriterionId: getNextCriterionToExplore(request.criteria)?.id ?? null,
  };
}
