import { getSupabaseBrowserClient } from "./client";
import type { Database, Json } from "./database.types";
import type { AgentOnboardingState } from "@/app/onboarding/4-agent/_lib/agent-types";

type UserAgentProfileInsert = Database["public"]["Tables"]["user_agent_profile"]["Insert"];

function toJsonValue(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json;
}

export function mapAgentProfileInsert(
  userId: string,
  draft: AgentOnboardingState,
  agentMemory: Record<string, unknown> | null = null,
): UserAgentProfileInsert {
  return {
    user_id: userId,
    criteria: toJsonValue(draft.criteria),
    final_summary: draft.finalSummary,
    agent_memory: toJsonValue(agentMemory ?? {}),
  };
}

export async function upsertUserAgentProfile(
  userId: string,
  draft: AgentOnboardingState,
  agentMemory: Record<string, unknown> | null = null,
) {
  const supabase = getSupabaseBrowserClient();
  const payload = mapAgentProfileInsert(userId, draft, agentMemory);
  const { data, error } = await supabase
    .from("user_agent_profile")
    .upsert(payload, {
      onConflict: "user_id",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
