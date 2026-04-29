import "server-only";

import { createOpenAiCompatibleChatCompletion } from "@/lib/llm/openai-compatible";
import { getLlmEnv } from "@/lib/llm/env";
import {
  createMemory,
  listMemoriesForUser,
  updateMemoryForUser,
} from "@/lib/supabase/agent-memories";
import { updateUserAgentProfileMemorySummary } from "@/lib/supabase/user-agent-profile-admin";

type ExtractedMemory = {
  kind: string;
  content: string;
  confidence: number;
};

function extractJsonObject(rawText: string) {
  const trimmed = rawText.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : trimmed;
  const firstBraceIndex = candidate.indexOf("{");
  const lastBraceIndex = candidate.lastIndexOf("}");

  if (firstBraceIndex === -1 || lastBraceIndex === -1 || lastBraceIndex <= firstBraceIndex) {
    throw new Error("Memory extractor response did not contain a JSON object.");
  }

  return JSON.parse(candidate.slice(firstBraceIndex, lastBraceIndex + 1)) as {
    memories?: Array<{
      kind?: unknown;
      content?: unknown;
      confidence?: unknown;
    }>;
  };
}

function normalizeExtractedMemories(value: ReturnType<typeof extractJsonObject>) {
  return (value.memories ?? [])
    .map((memory) => ({
      kind: typeof memory.kind === "string" ? memory.kind.trim() : "",
      content: typeof memory.content === "string" ? memory.content.trim() : "",
      confidence:
        typeof memory.confidence === "number" && Number.isFinite(memory.confidence)
          ? Math.max(0, Math.min(1, memory.confidence))
          : 0.6,
    }))
    .filter((memory): memory is ExtractedMemory => Boolean(memory.kind && memory.content))
    .slice(0, 4);
}

function buildExtractorSystemPrompt(existingMemories: Array<{ kind: string; content: string }>) {
  return `You extract durable user memories from a dating assistant conversation.

Return valid JSON only in this exact format:
{
  "memories": [
    {
      "kind": "preference | value | goal | boundary | trait | concern | pattern",
      "content": "short durable memory statement",
      "confidence": 0.0
    }
  ]
}

Rules:
- Extract only durable user-specific facts that will likely help future conversations.
- Do not extract temporary logistics or one-off wording.
- Keep each memory short, plain, and reusable.
- Do not repeat memories that already exist.
- If nothing durable was learned, return an empty array.

Existing memories:
${JSON.stringify(existingMemories, null, 2)}`;
}

function buildExtractorUserPrompt(userMessage: string, assistantMessage: string) {
  return JSON.stringify(
    {
      latestUserMessage: userMessage,
      latestAssistantMessage: assistantMessage,
    },
    null,
    2,
  );
}

function buildFallbackMemories(userMessage: string) {
  const normalized = userMessage.trim();

  if (!normalized || normalized.length < 24) {
    return [] as ExtractedMemory[];
  }

  const lowered = normalized.toLowerCase();

  if (/(i want|i'm looking for|i am looking for|prefer|i prefer)/.test(lowered)) {
    return [
      {
        kind: "preference",
        content: normalized.slice(0, 180),
        confidence: 0.66,
      },
    ];
  }

  if (/(i need|i care about|important to me|matters to me)/.test(lowered)) {
    return [
      {
        kind: "value",
        content: normalized.slice(0, 180),
        confidence: 0.64,
      },
    ];
  }

  if (/(i don't want|i do not want|deal breaker|boundary)/.test(lowered)) {
    return [
      {
        kind: "boundary",
        content: normalized.slice(0, 180),
        confidence: 0.67,
      },
    ];
  }

  return [];
}

function dedupeMemories(
  extracted: ExtractedMemory[],
  existing: Array<{ kind: string; content: string }>,
) {
  const existingKeys = new Set(
    existing.map((memory) => `${memory.kind.toLowerCase()}::${memory.content.toLowerCase()}`),
  );

  return extracted.filter((memory) => {
    const key = `${memory.kind.toLowerCase()}::${memory.content.toLowerCase()}`;
    return !existingKeys.has(key);
  });
}

async function syncProfileMemorySummary(userId: string) {
  const activeMemories = await listMemoriesForUser(userId, "active");
  const summary = activeMemories.slice(0, 10).reduce<Record<string, string[]>>((accumulator, memory) => {
    const bucket = accumulator[memory.kind] ?? [];
    bucket.push(memory.content);
    accumulator[memory.kind] = bucket;
    return accumulator;
  }, {});

  await updateUserAgentProfileMemorySummary({
    userId,
    agentMemory: summary,
  });
}

export async function extractAndSaveMemories(args: {
  userId: string;
  sourceThreadId: string;
  sourceMessageId: string;
  userMessage: string;
  assistantMessage: string;
}) {
  const existingMemories = await listMemoriesForUser(args.userId, "active");
  const existingCompact = existingMemories.map((memory) => ({
    kind: memory.kind,
    content: memory.content,
  }));
  const env = getLlmEnv();

  let extracted: ExtractedMemory[] = [];

  if (!env.apiKey) {
    extracted = buildFallbackMemories(args.userMessage);
  } else {
    try {
      const rawOutput = await createOpenAiCompatibleChatCompletion({
        model: env.extractorModel,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: buildExtractorSystemPrompt(existingCompact),
          },
          {
            role: "user",
            content: buildExtractorUserPrompt(args.userMessage, args.assistantMessage),
          },
        ],
      });
      extracted = normalizeExtractedMemories(extractJsonObject(rawOutput));
    } catch {
      extracted = buildFallbackMemories(args.userMessage);
    }
  }

  const deduped = dedupeMemories(extracted, existingCompact);

  for (const memory of deduped) {
    await createMemory({
      userId: args.userId,
      kind: memory.kind,
      content: memory.content,
      sourceThreadId: args.sourceThreadId,
      sourceMessageId: args.sourceMessageId,
      confidence: memory.confidence,
      metadata: {
        source: "dashboard-chat",
      },
    });
  }

  await syncProfileMemorySummary(args.userId);

  return deduped;
}

export async function clearAllMemoriesForUser(userId: string) {
  const allMemories = await listMemoriesForUser(userId, "all");

  for (const memory of allMemories) {
    if (memory.status !== "discarded") {
      await updateMemoryForUser(userId, memory.id, {
        status: "discarded",
      });
    }
  }

  await syncProfileMemorySummary(userId);
}
