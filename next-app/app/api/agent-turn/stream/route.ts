import type { SubmitAgentTurnRequest } from "@/app/onboarding/4-agent/_lib/agent-api-types";
import {
  prepareAgentTurnSnapshot,
  resolveAgentTurnExtraction,
  streamPreparedAgentTurn,
} from "@/app/onboarding/4-agent/_lib/agent-server";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
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

function toSseData(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (!isValidRequestBody(body)) {
      console.error("[agent-turn][stream-route] Invalid request body.", { body });
      return jsonError("Invalid streaming agent turn payload.");
    }

    if (!body.userMessage.trim()) {
      console.error("[agent-turn][stream-route] Missing user message.", { body });
      return jsonError("A user message is required.");
    }

    const turnSnapshot = prepareAgentTurnSnapshot(body);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let assistantMessage = "";
        const extractionPromise = resolveAgentTurnExtraction(body);

        try {
          const interviewerStream = await streamPreparedAgentTurn({
            request: body,
            updatedCriteria: turnSnapshot.snapshotCriteria,
            draftSummary: turnSnapshot.draftSummary,
          });

          for await (const delta of interviewerStream) {
            assistantMessage += delta;
            controller.enqueue(
              encoder.encode(
                toSseData({
                  type: "assistant.delta",
                  delta,
                }),
              ),
            );
          }

          const extractedTurn = await extractionPromise;

          controller.enqueue(
            encoder.encode(
              toSseData({
                type: "assistant.done",
                payload: {
                  criteria: extractedTurn.criteria,
                  assistantMessage,
                  draftSummary: extractedTurn.draftSummary,
                  status: extractedTurn.status,
                  lastAskedCriterionId: extractedTurn.lastAskedCriterionId,
                  extractorRawOutput: extractedTurn.extractorRawOutput,
                },
              }),
            ),
          );
          controller.close();
        } catch (error) {
          console.error("[agent-turn][stream-route] Streaming request failed.", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          controller.enqueue(
            encoder.encode(
              toSseData({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "The streamed agent turn could not be processed.",
              }),
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[agent-turn][stream-route] Request failed.", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return jsonError(
      error instanceof Error ? error.message : "The streamed agent turn could not be processed.",
      500,
    );
  }
}
