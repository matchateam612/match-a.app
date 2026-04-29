import "server-only";

import { getSupabaseAdminClient } from "./admin";
import { listMemoriesForUser } from "./agent-memories";
import { getAuthorizedMatchContext, getThreadByIdForUser } from "./agent-threads";
import type { Database } from "./database.types";
import type { AgentMemoryRow, AgentThreadRow } from "./types";

type BasicInfoRow = Database["public"]["Tables"]["user_basic_info"]["Row"];
type AgentProfileRow = Database["public"]["Tables"]["user_agent_profile"]["Row"];
type UserMentalityRow = Database["public"]["Tables"]["user_mentality"]["Row"];

export type AgentUserProfileContext = {
  basicInfo: BasicInfoRow | null;
  mentality: UserMentalityRow | null;
  agentProfile: AgentProfileRow | null;
};

export type AgentMatchContext = Awaited<ReturnType<typeof getAuthorizedMatchContext>>;

export type AgentTurnContext = {
  thread: AgentThreadRow;
  profile: AgentUserProfileContext;
  memories: AgentMemoryRow[];
  matchContext: AgentMatchContext | null;
};

export async function getAgentUserProfileContext(userId: string) {
  const supabase = getSupabaseAdminClient();
  const [basicInfoResponse, mentalityResponse, agentProfileResponse] =
    await Promise.all([
      supabase.from("user_basic_info").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_mentality").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_agent_profile").select("*").eq("user_id", userId).maybeSingle(),
    ]);

  if (basicInfoResponse.error) {
    throw basicInfoResponse.error;
  }

  if (mentalityResponse.error) {
    throw mentalityResponse.error;
  }

  if (agentProfileResponse.error) {
    throw agentProfileResponse.error;
  }

  return {
    basicInfo: (basicInfoResponse.data as BasicInfoRow | null) ?? null,
    mentality: (mentalityResponse.data as UserMentalityRow | null) ?? null,
    agentProfile: (agentProfileResponse.data as AgentProfileRow | null) ?? null,
  };
}

export async function loadAgentTurnContext(userId: string, threadId: string) {
  const thread = await getThreadByIdForUser(userId, threadId);

  if (!thread) {
    throw new Error("Thread not found.");
  }

  const [profile, memories, matchContext] = await Promise.all([
    getAgentUserProfileContext(userId),
    listMemoriesForUser(userId, "active"),
    thread.match_id ? getAuthorizedMatchContext(thread.match_id, userId) : Promise.resolve(null),
  ]);

  return {
    thread,
    profile,
    memories,
    matchContext,
  } satisfies AgentTurnContext;
}
