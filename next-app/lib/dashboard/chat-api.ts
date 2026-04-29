"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

export type DashboardThread = Database["public"]["Tables"]["agent_threads"]["Row"];
export type DashboardMessage = Database["public"]["Tables"]["agent_messages"]["Row"];
export type DashboardMemory = Database["public"]["Tables"]["agent_memories"]["Row"];

type MatchContextResponse = {
  match: Database["public"]["Tables"]["matches"]["Row"];
  counterparty: Database["public"]["Tables"]["user_matches_info"]["Row"] | null;
  counterpartyUserId: string;
};

async function buildAuthHeaders() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (error || !accessToken) {
    throw error ?? new Error("Please sign in before using chat.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | T
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && payload.error
        ? payload.error
        : "We couldn't complete that dashboard chat request.";
    throw new Error(message);
  }

  return payload as T;
}

export async function listDashboardThreadsRequest() {
  const headers = await buildAuthHeaders();
  const response = await fetch("/api/dashboard/threads", {
    method: "GET",
    headers,
    cache: "no-store",
  });

  return parseJsonResponse<{ threads: DashboardThread[] }>(response);
}

export async function getDashboardThreadRequest(threadId: string) {
  const headers = await buildAuthHeaders();
  const response = await fetch(`/api/dashboard/threads/${threadId}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  return parseJsonResponse<{
    thread: DashboardThread;
    messages: DashboardMessage[];
  }>(response);
}

export async function renameDashboardThreadRequest(threadId: string, title: string) {
  const headers = await buildAuthHeaders();
  const response = await fetch(`/api/dashboard/threads/${threadId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ title }),
  });

  return parseJsonResponse<{
    thread: DashboardThread;
  }>(response);
}

export async function archiveDashboardThreadRequest(threadId: string) {
  const headers = await buildAuthHeaders();
  const response = await fetch(`/api/dashboard/threads/${threadId}`, {
    method: "DELETE",
    headers,
  });

  return parseJsonResponse<{
    thread: DashboardThread;
  }>(response);
}

export async function getDashboardMatchThreadRequest(matchId: string) {
  const headers = await buildAuthHeaders();
  const response = await fetch(`/api/dashboard/matches/${matchId}/thread`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  return parseJsonResponse<{
    thread: DashboardThread;
    messages: DashboardMessage[];
    matchContext: MatchContextResponse;
  }>(response);
}

export async function submitDashboardChatTurnRequest(
  body:
    | {
        source: "new-chat";
        message: string;
      }
    | {
        source: "thread";
        threadId: string;
        message: string;
      }
    | {
        source: "match";
        matchId: string;
        message: string;
      },
) {
  const headers = await buildAuthHeaders();
  const response = await fetch("/api/dashboard/chat/turn", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  return parseJsonResponse<{
    threadId: string;
    routeKind: "thread" | "match";
    routeId: string;
    userMessage: DashboardMessage;
    assistantMessage: DashboardMessage;
  }>(response);
}

export async function submitDashboardChatTurnStreamRequest(
  body:
    | {
        source: "new-chat";
        message: string;
      }
    | {
        source: "thread";
        threadId: string;
        message: string;
      }
    | {
        source: "match";
        matchId: string;
        message: string;
      },
  handlers: {
    onMeta?: (payload: {
      threadId: string;
      routeKind: "thread" | "match";
      routeId: string;
      userMessage: DashboardMessage;
    }) => void;
    onAssistantDelta?: (delta: string) => void;
    onAssistantDone?: (payload: {
      threadId: string;
      routeKind: "thread" | "match";
      routeId: string;
      assistantMessage: DashboardMessage;
    }) => void;
  } = {},
) {
  const headers = await buildAuthHeaders();
  const response = await fetch("/api/dashboard/chat/stream", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await parseJsonResponse(response);
  }

  if (!response.body) {
    throw new Error("The chat stream did not include a response body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

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

      const data = line.slice("data:".length).trim();

      if (!data) {
        continue;
      }

      const parsed = JSON.parse(data) as
        | {
            type: "meta";
            payload: {
              threadId: string;
              routeKind: "thread" | "match";
              routeId: string;
              userMessage: DashboardMessage;
            };
          }
        | {
            type: "assistant.delta";
            delta: string;
          }
        | {
            type: "assistant.done";
            payload: {
              threadId: string;
              routeKind: "thread" | "match";
              routeId: string;
              assistantMessage: DashboardMessage;
            };
          }
        | {
            type: "error";
            message: string;
          };

      if (parsed.type === "meta") {
        handlers.onMeta?.(parsed.payload);
      } else if (parsed.type === "assistant.delta") {
        handlers.onAssistantDelta?.(parsed.delta);
      } else if (parsed.type === "assistant.done") {
        handlers.onAssistantDone?.(parsed.payload);
      } else if (parsed.type === "error") {
        throw new Error(parsed.message);
      }
    }
  }
}

export async function listDashboardMemoriesRequest() {
  const headers = await buildAuthHeaders();
  const response = await fetch("/api/dashboard/memories", {
    method: "GET",
    headers,
    cache: "no-store",
  });

  return parseJsonResponse<{ memories: DashboardMemory[] }>(response);
}

export async function deleteDashboardMemoryRequest(memoryId: string) {
  const headers = await buildAuthHeaders();
  const response = await fetch(`/api/dashboard/memories/${memoryId}`, {
    method: "DELETE",
    headers,
  });

  return parseJsonResponse<{ ok: true }>(response);
}

export async function clearDashboardMemoriesRequest() {
  const headers = await buildAuthHeaders();
  const response = await fetch("/api/dashboard/memories", {
    method: "DELETE",
    headers,
  });

  return parseJsonResponse<{ ok: true }>(response);
}
