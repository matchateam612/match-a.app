import { getSupabaseBrowserClient } from "./client";
import type { Database } from "./database.types";
import type { BasicInfoDraft } from "@/app/onboarding/1-basics/_components/basic-info-types";

type UserBasicInfoInsert = Database["public"]["Tables"]["user_basic_info"]["Insert"];

function parseOptionalInteger(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapBasicInfoDraftToInsert(userId: string, draft: BasicInfoDraft): UserBasicInfoInsert {
  return {
    user_id: userId,
    age: parseOptionalInteger(draft.age),
    phone_number: draft.phoneNumber.trim() || null,
    preferred_age_min: parseOptionalInteger(draft.preferredAgeMin),
    preferred_age_max: parseOptionalInteger(draft.preferredAgeMax),
    gender_identity: draft.genderIdentity || null,
    gender_identity_custom: draft.genderIdentityCustom.trim() || null,
    interested_in: draft.interestedIn || null,
    interested_in_custom: draft.interestedInCustom.trim() || null,
    ethnicity: draft.ethnicity || null,
    preferred_ethnicities: Array.isArray(draft.preferredEthnicities)
      ? draft.preferredEthnicities
      : [],
  };
}

export async function upsertUserBasicInfo(userId: string, draft: BasicInfoDraft) {
  const supabase = getSupabaseBrowserClient();
  const payload = mapBasicInfoDraftToInsert(userId, draft);
  const { data, error } = await supabase
    .from("user_basic_info")
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
