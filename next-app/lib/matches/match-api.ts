"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type MatchThread = {
  id: string;
  label: string;
  targetUserId: string;
  age: number | null;
  genderIdentity: string | null;
  interestedIn: string | null;
  ethnicity: string | null;
  relationshipIntent: string | null;
  mentalitySummary: string | null;
  agentSummary: string | null;
  matchReason: string | null;
  profilePictureUrl: string | null;
  statusLabel: string | null;
  unread: boolean;
};

async function buildAuthHeaders() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (error || !accessToken) {
    throw error ?? new Error("Please sign in before viewing matches.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
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
        : "We couldn't complete that match request right now.";
    throw new Error(message);
  }

  return payload as T;
}

export async function listMatchThreadsRequest() {
  const headers = await buildAuthHeaders();
  const response = await fetch("/api/matches/threads", {
    method: "GET",
    headers,
    cache: "no-store",
  });

  return parseJsonResponse<{ threads: MatchThread[] }>(response);
}
