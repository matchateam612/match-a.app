import { NextResponse } from "next/server";

import { createInitialAgentTurn } from "@/app/onboarding/4-agent/_lib/agent-server";
import type { CreateInitialAgentTurnRequest } from "@/app/onboarding/4-agent/_lib/agent-api-types";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isValidRequestBody(body: unknown): body is CreateInitialAgentTurnRequest {
  if (!body || typeof body !== "object") {
    return false;
  }

  const candidate = body as Partial<CreateInitialAgentTurnRequest>;

  return (
    (candidate.selectedMode === "text" || candidate.selectedMode === "voice") &&
    Array.isArray(candidate.criteriaDefinitions) &&
    Array.isArray(candidate.criteria) &&
    typeof candidate.interviewerSystemPrompt === "string" &&
    Boolean(candidate.userInfo && typeof candidate.userInfo === "object")
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (!isValidRequestBody(body)) {
      console.error("[agent-turn][initial-route] Invalid request body.", { body });
      return jsonError("Invalid initial agent turn payload.");
    }

    const result = await createInitialAgentTurn(body);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[agent-turn][initial-route] Request failed.", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return jsonError(
      error instanceof Error ? error.message : "The initial agent turn could not be created.",
      500,
    );
  }
}
