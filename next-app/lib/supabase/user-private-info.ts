import { getSupabaseBrowserClient } from "./client";
import type { UserInfo } from "@/app/onboarding/1-basics/_components/basic-info-types";

export async function upsertUserPrivateInfo(userId: string, userInfo: UserInfo) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("user_private_info")
    .upsert(
      {
        id: userId,
        info: userInfo,
      },
      {
        onConflict: "id",
      },
    )
    .select("id, info")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
