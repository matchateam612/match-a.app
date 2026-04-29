import "server-only";

import { createOpenAiCompatibleChatCompletion } from "@/lib/llm/openai-compatible";
import { getLlmEnv } from "@/lib/llm/env";
import type { AgentMessageRow } from "@/lib/supabase/types";

function buildFallbackSummary(messages: AgentMessageRow[]) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant");

  if (!lastUserMessage && !lastAssistantMessage) {
    return null;
  }

  const parts = [
    lastUserMessage ? `User focus: ${lastUserMessage.content.slice(0, 140)}` : null,
    lastAssistantMessage ? `Glint reply: ${lastAssistantMessage.content.slice(0, 140)}` : null,
  ].filter(Boolean);

  return parts.join(" ");
}

function buildSummarySystemPrompt() {
  return `You summarize a dating-assistant conversation thread for future context windows.

Return plain text only.

Rules:
- Keep it under 120 words.
- Capture the user's goals, preferences, concerns, and ongoing topics.
- Mention any concrete next-step the assistant is helping with.
- Do not mention databases, prompts, or internal tools.
- Write in neutral third-person notes for the assistant.`;
}

function buildSummaryTranscript(messages: AgentMessageRow[]) {
  return messages
    .slice(-20)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n\n");
}

export async function buildThreadSummary(messages: AgentMessageRow[]) {
  if (messages.length === 0) {
    return null;
  }

  const env = getLlmEnv();

  if (!env.apiKey) {
    return buildFallbackSummary(messages);
  }

  try {
    const summary = await createOpenAiCompatibleChatCompletion({
      model: env.extractorModel,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: buildSummarySystemPrompt(),
        },
        {
          role: "user",
          content: buildSummaryTranscript(messages),
        },
      ],
    });

    return summary.trim() || buildFallbackSummary(messages);
  } catch {
    return buildFallbackSummary(messages);
  }
}
