import { NextResponse } from "next/server";

import type { SubmitAgentTurnRequest } from "@/app/onboarding/4-agent/_lib/agent-api-types";
import { resolveAgentTurnExtraction } from "@/app/onboarding/4-agent/_lib/agent-server";

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
      return jsonError("Invalid extraction payload.");
    }

    if (!body.userMessage.trim()) {
      return jsonError("A user message is required.");
    }

    return NextResponse.json(await resolveAgentTurnExtraction(body), { status: 200 });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "The extraction update could not be resolved.",
      500,
    );
  }
}
