import { NextResponse } from "next/server";

import { createOpenAiCompatibleChatCompletion } from "@/lib/llm/openai-compatible";
import { extractAndSaveMemories } from "@/lib/dashboard/memory-extractor";
import { buildThreadSummary } from "@/lib/dashboard/thread-summary";
import { getLlmEnv } from "@/lib/llm/env";
import { loadAgentTurnContext } from "@/lib/supabase/agent-context";
import {
  createAssistantMessage,
  createUserMessage,
  listMessagesForThread,
} from "@/lib/supabase/agent-messages";
import {
  createGeneralThread,
  findOrCreateMatchThread,
  touchThreadAfterMessage,
  updateThreadForUser,
} from "@/lib/supabase/agent-threads";
import { requireAuthenticatedUser } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

type ChatTurnRequest =
  | {
      threadId: string;
      message: string;
      source: "thread";
    }
  | {
      matchId: string;
      message: string;
      source: "match";
    }
  | {
      message: string;
      source: "new-chat";
    };

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isValidBody(body: unknown): body is ChatTurnRequest {
  if (!body || typeof body !== "object") {
    return false;
  }

  const candidate = body as Partial<ChatTurnRequest>;

  if (typeof candidate.message !== "string" || !candidate.message.trim()) {
    return false;
  }

  if (candidate.source === "thread") {
    return typeof candidate.threadId === "string";
  }

  if (candidate.source === "match") {
    return typeof candidate.matchId === "string";
  }

  return candidate.source === "new-chat";
}

function compactText(value: string, maxLength = 140) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 1)}…`;
}

function buildThreadTitleFromMessage(value: string) {
  return compactText(value, 60);
}

function buildSystemPrompt(context: Awaited<ReturnType<typeof loadAgentTurnContext>>) {
  const profile = context.profile;
  const basicInfo = profile.basicInfo
    ? {
        age: profile.basicInfo.age,
        genderIdentity:
          profile.basicInfo.gender_identity_custom || profile.basicInfo.gender_identity,
        interestedIn:
          profile.basicInfo.interested_in_custom || profile.basicInfo.interested_in,
        ethnicity: profile.basicInfo.ethnicity,
        preferredAgeRange:
          profile.basicInfo.preferred_age_min || profile.basicInfo.preferred_age_max
            ? {
                min: profile.basicInfo.preferred_age_min,
                max: profile.basicInfo.preferred_age_max,
              }
            : null,
        preferredEthnicities: profile.basicInfo.preferred_ethnicities,
      }
    : null;

  const mentality = profile.mentality
    ? {
        relationshipIntent: profile.mentality.relationship_intent,
        selectedTrack: profile.mentality.selected_track,
        answers: profile.mentality.answers,
      }
    : null;

  const memoryFacts = context.memories.slice(0, 12).map((memory) => ({
    kind: memory.kind,
    content: memory.content,
    confidence: memory.confidence,
  }));

  const matchContext = context.matchContext
    ? {
        matchReason: context.matchContext.match.match_reason,
        status: {
          user1: context.matchContext.match.user1_match_status,
          user2: context.matchContext.match.user2_match_status,
        },
        matchedPerson: context.matchContext.counterparty
          ? {
              age: context.matchContext.counterparty.age,
              genderIdentity: context.matchContext.counterparty.gender_identity,
              interestedIn: context.matchContext.counterparty.interested_in,
              ethnicity: context.matchContext.counterparty.ethnicity,
              relationshipIntent: context.matchContext.counterparty.relationship_intent,
              mentalitySummary: context.matchContext.counterparty.mentality_summary,
              agentSummary: context.matchContext.counterparty.agent_summary,
              visiblePayload: context.matchContext.counterparty.visible_payload,
            }
          : null,
      }
    : null;

  return `You are Glint, an emotionally intelligent dating and relationship assistant inside a matchmaking product.

You are chatting with one signed-in user inside their dashboard.

Rules:
- Be warm, direct, and helpful.
- Keep most replies to 2-5 sentences unless the user asks for more depth.
- Use the user's saved context and memories when helpful, but do not sound robotic or cite internal storage.
- If this is a match-scoped chat, use the matched person's approved information to answer the user's questions.
- Never claim knowledge that is not present in the provided context.
- Do not mention JSON, databases, routes, policies, or internal implementation details.
- If information is missing, say so naturally and still try to help.

User profile context:
${JSON.stringify(
    {
      basicInfo,
      mentality,
      finalSummary: profile.agentProfile?.final_summary ?? null,
      savedMemories: memoryFacts,
      threadKind: context.thread.kind,
      threadSummary: context.thread.summary ?? null,
      matchContext,
    },
    null,
    2,
  )}`;
}

async function generateAssistantReply(context: Awaited<ReturnType<typeof loadAgentTurnContext>>) {
  const recentMessages = await listMessagesForThread(context.thread.user_id, context.thread.id);
  const env = getLlmEnv();
  const transcript = recentMessages.slice(-10).map((message) => ({
    role: message.role,
    content: message.content,
  }));

  if (!env.apiKey) {
    if (context.thread.kind === "match" && context.matchContext?.counterparty) {
      const summary =
        context.matchContext.counterparty.agent_summary ??
        context.matchContext.counterparty.mentality_summary ??
        context.matchContext.match.match_reason ??
        "I can help you think through this match.";

      return `I’m looking at this match through the context I have so far. ${summary} Ask me about compatibility, what stands out, or how you might start the conversation.`;
    }

    return "I’m here with you. Tell me a little more about what you want help thinking through, and I’ll help you sort it out.";
  }

  return createOpenAiCompatibleChatCompletion({
    model: env.interviewerModel,
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(context),
      },
      ...transcript,
    ],
  });
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = (await request.json()) as unknown;

    if (!isValidBody(body)) {
      return jsonError("Invalid dashboard chat payload.");
    }

    let threadId: string;
    let routeKind: "thread" | "match";
    let routeId: string;

    if (body.source === "new-chat") {
      const thread = await createGeneralThread(user.id);
      threadId = thread.id;
      routeKind = "thread";
      routeId = thread.id;
    } else if (body.source === "match") {
      const thread = await findOrCreateMatchThread(user.id, body.matchId);
      threadId = thread.id;
      routeKind = "match";
      routeId = body.matchId;
    } else {
      threadId = body.threadId;
      routeKind = "thread";
      routeId = body.threadId;
    }

    const userMessage = await createUserMessage(threadId, user.id, body.message, {
      source: body.source,
    });
    await touchThreadAfterMessage(user.id, threadId, compactText(userMessage.content));

    if (body.source === "new-chat") {
      await updateThreadForUser(user.id, threadId, {
        title: buildThreadTitleFromMessage(body.message),
      });
    }

    const context = await loadAgentTurnContext(user.id, threadId);
    const assistantReply = await generateAssistantReply(context);
    const assistantMessage = await createAssistantMessage(threadId, user.id, assistantReply, {
      source: body.source,
    });
    await touchThreadAfterMessage(user.id, threadId, compactText(assistantMessage.content));
    const updatedMessages = await listMessagesForThread(user.id, threadId);

    if (updatedMessages.length >= 6 && updatedMessages.length % 4 === 0) {
      const summary = await buildThreadSummary(updatedMessages);

      if (summary) {
        await updateThreadForUser(user.id, threadId, {
          summary,
          summary_updated_at: new Date().toISOString(),
        });
      }
    }

    await extractAndSaveMemories({
      userId: user.id,
      sourceThreadId: threadId,
      sourceMessageId: userMessage.id,
      userMessage: userMessage.content,
      assistantMessage: assistantMessage.content,
    });

    return NextResponse.json({
      threadId,
      routeKind,
      routeId,
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "We couldn't process that message right now.",
      500,
    );
  }
}
