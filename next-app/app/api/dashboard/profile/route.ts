import { NextResponse } from "next/server";

import { logPictureError } from "@/lib/pictures/picture-logging";
import { getProfilePictureSignedUrl } from "@/lib/pictures/picture-server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { requireAuthenticatedUser } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

type BasicInfoRow = Database["public"]["Tables"]["user_basic_info"]["Row"];
type AgentProfileRow = Database["public"]["Tables"]["user_agent_profile"]["Row"];
type UserMentalityRow = Database["public"]["Tables"]["user_mentality"]["Row"];

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    const [basicInfoResponse, mentalityResponse, agentProfileResponse] =
      await Promise.all([
        supabase.from("user_basic_info").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_mentality").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_agent_profile").select("*").eq("user_id", user.id).maybeSingle(),
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

    let profilePictureUrl: string | null = null;

    try {
      profilePictureUrl = (await getProfilePictureSignedUrl(user.id)).signedUrl;
    } catch (error) {
      logPictureError("Failed to sign dashboard profile picture.", error, {
        userId: user.id,
      });
    }

    return NextResponse.json({
      profilePictureUrl,
      email: user.email ?? null,
      basicInfo: (basicInfoResponse.data as BasicInfoRow | null) ?? null,
      mentality: (mentalityResponse.data as UserMentalityRow | null) ?? null,
      agentProfile: (agentProfileResponse.data as AgentProfileRow | null) ?? null,
    });
  } catch (error) {
    logPictureError("Dashboard profile request failed.", error);

    return jsonError(
      error instanceof Error && error.message
        ? error.message
        : "We couldn't load your profile right now.",
      500,
    );
  }
}
