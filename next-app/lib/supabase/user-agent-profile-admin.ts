import "server-only";

import { getSupabaseAdminClient } from "./admin";
import type { Json } from "./database.types";

function toJsonValue(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? {})) as Json;
}

export async function updateUserAgentProfileMemorySummary(args: {
  userId: string;
  agentMemory: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_agent_profile")
    .upsert(
      {
        user_id: args.userId,
        agent_memory: toJsonValue(args.agentMemory),
      },
      {
        onConflict: "user_id",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
