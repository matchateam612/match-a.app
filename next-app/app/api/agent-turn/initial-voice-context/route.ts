import { NextResponse } from "next/server";

import type { CreateInitialVoiceTurnContextRequest } from "@/app/onboarding/4-agent/_lib/agent-api-types";
import { createInitialVoiceTurnContext } from "@/app/onboarding/4-agent/_lib/agent-server";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isValidRequestBody(body: unknown): body is CreateInitialVoiceTurnContextRequest {
  if (!body || typeof body !== "object") {
    return false;
  }

  const candidate = body as Partial<CreateInitialVoiceTurnContextRequest>;

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
      return jsonError("Invalid initial voice turn context payload.");
    }

    return NextResponse.json(createInitialVoiceTurnContext(body), { status: 200 });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "The initial voice turn context could not be created.",
      500,
    );
  }
}
