import { NextResponse } from "next/server";

import { processAgentTurn } from "@/app/onboarding/4-agent/_lib/agent-server";
import type { SubmitAgentTurnRequest } from "@/app/onboarding/4-agent/_lib/agent-api-types";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isValidRequestBody(body: unknown): body is SubmitAgentTurnRequest {
  if (!body || typeof body !== "object") {
    return false;
  }

  const candidate = body as Partial<SubmitAgentTurnRequest>;

  return (
    (candidate.selectedMode === "text" || candidate.selectedMode === "voice") &&
    typeof candidate.userMessage === "string" &&
    Array.isArray(candidate.transcript) &&
    Array.isArray(candidate.criteriaDefinitions) &&
    Array.isArray(candidate.criteria) &&
    typeof candidate.interviewerSystemPrompt === "string"
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (!isValidRequestBody(body)) {
      console.error("[agent-turn][route] Invalid request body.", { body });
      return jsonError("Invalid agent turn payload.");
    }

    if (!body.userMessage.trim()) {
      console.error("[agent-turn][route] Missing user message.", { body });
      return jsonError("A user message is required.");
    }

    console.log("[agent-turn][route] Received valid request.", {
      selectedMode: body.selectedMode,
      transcriptCount: body.transcript.length,
      criteriaCount: body.criteria.length,
      criteriaDefinitionCount: body.criteriaDefinitions.length,
    });

    const result = await processAgentTurn(body);
    console.log("[agent-turn][route] Returning successful response.");
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[agent-turn][route] Request failed.", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return jsonError(
      error instanceof Error ? error.message : "The agent turn could not be processed.",
      500,
    );
  }
}
