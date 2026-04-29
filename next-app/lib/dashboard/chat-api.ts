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
