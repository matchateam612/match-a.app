import type {
  CreateInitialAgentTurnResponse,
  SubmitAgentTurnResponse,
} from "./agent-api-types";
import type { AgentOnboardingState } from "./agent-types";

export type StreamedAgentTurnEvent =
  | {
      type: "assistant.delta";
      delta: string;
    }
  | {
      type: "assistant.done";
      payload: SubmitAgentTurnResponse;
    }
  | {
      type: "error";
      message: string;
    };

export const MAX_AGENT_TURNS = 20;

export function isSubmitAgentTurnResponse(
  payload: SubmitAgentTurnResponse | { error?: string },
): payload is SubmitAgentTurnResponse {
  return (
    "criteria" in payload &&
    "assistantMessage" in payload &&
    "draftSummary" in payload &&
    "status" in payload
  );
}

export function isCreateInitialAgentTurnResponse(
  payload: CreateInitialAgentTurnResponse | { error?: string },
): payload is CreateInitialAgentTurnResponse {
  return (
    "assistantMessage" in payload &&
    "draftSummary" in payload &&
    "status" in payload
  );
}

export function getCappedStatus(
  turnCount: number,
  status: AgentOnboardingState["status"],
): AgentOnboardingState["status"] {
  return turnCount >= MAX_AGENT_TURNS ? "confirming" : status;
}

export async function readStreamedAgentTurn(args: {
  response: Response;
  onDelta: (deltaText: string) => void;
}): Promise<SubmitAgentTurnResponse> {
  if (!args.response.body) {
    throw new Error("The streamed agent turn request did not include a response body.");
  }

  const reader = args.response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completedPayload: SubmitAgentTurnResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const line = event
        .split("\n")
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith("data:"));

      if (!line) {
        continue;
      }

      const parsed = JSON.parse(line.slice("data:".length).trim()) as StreamedAgentTurnEvent;

      if (parsed.type === "assistant.delta") {
        args.onDelta(parsed.delta);
        continue;
      }

      if (parsed.type === "assistant.done") {
        completedPayload = parsed.payload;
        continue;
      }

      if (parsed.type === "error") {
        throw new Error(parsed.message);
      }
    }
  }

  if (!completedPayload || !isSubmitAgentTurnResponse(completedPayload)) {
    throw new Error("The streamed agent turn finished without a valid completion payload.");
  }

  return completedPayload;
}
