import { getSupabaseBrowserClient } from "./client";
import type { Database } from "./database.types";
import type { BasicInfoDraft } from "@/app/onboarding/1-basics/_components/basic-info-types";
import type { MentalityDraft, MentalityProgress } from "@/app/onboarding/2-mentality/_components/mentality-types";

type UserMatchesInfoInsert = Database["public"]["Tables"]["user_matches_info"]["Insert"];

function parseOptionalInteger(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildMentalitySummary(
  draft: MentalityDraft | null | undefined,
  progress?: MentalityProgress | null,
) {
  if (!draft?.relationshipIntent) {
    return null;
  }

  if (draft.relationshipIntent === "serious_longterm") {
    const seriousAnswerCount = Object.values(draft.serious.answers).filter(Boolean).length;
    const mostRelevantSignals = [
      draft.serious.answers.openness,
      draft.serious.answers.chatFrequency,
      draft.serious.answers.riskTolerance,
      draft.serious.answers.closenessBalance,
    ].filter(Boolean);

    return [
      "Serious / longterm",
      seriousAnswerCount > 0 ? `${seriousAnswerCount} signals captured` : null,
      mostRelevantSignals.length > 0 ? `highlights: ${mostRelevantSignals.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join(" | ");
  }

  if (draft.relationshipIntent === "casual_shortterm") {
    const boundaries =
      draft.casual.boundaries.length > 0 ? draft.casual.boundaries.join(", ") : null;
    return [
      "Casual / shortterm",
      draft.casual.frequency ? `frequency: ${draft.casual.frequency}` : null,
      boundaries ? `boundaries: ${boundaries}` : null,
    ]
      .filter(Boolean)
      .join(" | ");
  }

  const clarity = draft.open.needsClarity.length > 0 ? draft.open.needsClarity.join(", ") : null;
  return [
    "Open to both",
    draft.open.style ? `style: ${draft.open.style}` : null,
    clarity ? `clarity: ${clarity}` : null,
    progress?.branch ? `track: ${progress.branch}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

export function mapMatchesInfoInsert(args: {
  userId: string;
  basicInfo?: BasicInfoDraft | null;
  mentality?: MentalityDraft | null;
  mentalityProgress?: MentalityProgress | null;
  agentSummary?: string | null;
  profilePicturePath?: string | null;
}): UserMatchesInfoInsert {
  const { userId, basicInfo, mentality, mentalityProgress, agentSummary, profilePicturePath } = args;

  return {
    user_id: userId,
    age: basicInfo ? parseOptionalInteger(basicInfo.age) : null,
    gender_identity: basicInfo?.genderIdentity || null,
    interested_in: basicInfo?.interestedIn || null,
    ethnicity: basicInfo?.ethnicity || null,
    relationship_intent: mentality?.relationshipIntent || null,
    mentality_summary: buildMentalitySummary(mentality, mentalityProgress),
    agent_summary: agentSummary ?? null,
    profile_picture_path: profilePicturePath ?? null,
    visible_payload: {
      basicInfo: basicInfo
        ? {
            age: parseOptionalInteger(basicInfo.age),
            genderIdentity: basicInfo.genderIdentity || null,
            interestedIn: basicInfo.interestedIn || null,
            ethnicity: basicInfo.ethnicity || null,
            preferredEthnicities: Array.isArray(basicInfo.preferredEthnicities)
              ? basicInfo.preferredEthnicities
              : [],
          }
        : null,
      mentality: mentality
        ? {
            relationshipIntent: mentality.relationshipIntent || null,
            summary: buildMentalitySummary(mentality, mentalityProgress),
          }
        : null,
      profile: {
        profilePicturePath: profilePicturePath ?? null,
      },
    },
  };
}

export async function upsertUserMatchesInfo(args: {
  userId: string;
  basicInfo?: BasicInfoDraft | null;
  mentality?: MentalityDraft | null;
  mentalityProgress?: MentalityProgress | null;
  agentSummary?: string | null;
  profilePicturePath?: string | null;
}) {
  const supabase = getSupabaseBrowserClient();
  const payload = mapMatchesInfoInsert(args);
  const { data, error } = await supabase
    .from("user_matches_info")
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
