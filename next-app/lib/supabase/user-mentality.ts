import { getSupabaseBrowserClient } from "./client";
import type { Database } from "./database.types";
import type { MentalityDraft, MentalityProgress } from "@/app/onboarding/2-mentality/_components/mentality-types";

type UserMentalityInsert = Database["public"]["Tables"]["user_mentality"]["Insert"];

export function mapMentalityToInsert(
  userId: string,
  draft: MentalityDraft,
  progress: MentalityProgress,
): UserMentalityInsert {
  return {
    user_id: userId,
    relationship_intent: draft.relationshipIntent || null,
    selected_track: progress.branch || draft.relationshipIntent || null,
    answers: {
      shared: {
        relationshipIntent: draft.relationshipIntent || null,
      },
      seriousLongterm: {
        ...draft.serious.answers,
      },
      casualShortterm: {
        frequency: draft.casual.frequency || null,
        boundaries: Array.isArray(draft.casual.boundaries) ? draft.casual.boundaries : [],
      },
      openToBoth: {
        style: draft.open.style || null,
        needsClarity: Array.isArray(draft.open.needsClarity) ? draft.open.needsClarity : [],
      },
      progress: {
        branch: progress.branch || null,
        currentStepId: progress.currentStepId,
        completedStepIds: Array.isArray(progress.completedStepIds)
          ? progress.completedStepIds
          : [],
      },
    },
  };
}

export async function upsertUserMentality(
  userId: string,
  draft: MentalityDraft,
  progress: MentalityProgress,
) {
  const supabase = getSupabaseBrowserClient();
  const payload = mapMentalityToInsert(userId, draft, progress);
  const { data, error } = await supabase
    .from("user_mentality")
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
