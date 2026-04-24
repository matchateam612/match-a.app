"use client";

import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
import { getOrCreateOnboardingMetaRecord, updateOnboardingMetaRecord } from "@/lib/onboarding-idb/meta-store";
import { markOnboardingSectionDirty } from "@/lib/onboarding-idb/section-sync";
import { getFirstBranchQuestionId, getMentalityQuestions } from "./mentality-questions";
import { initialDraft, initialProgress } from "./mentality-data";
import type { MentalityDraft, MentalityProgress, MentalityQuestionId } from "./mentality-types";

export type StoredMentalityState = {
  draft: MentalityDraft;
  progress: MentalityProgress;
  hasSavedDraft: boolean;
  userInfo: UserInfo;
};

type RawMentalityProgress = {
  branch?: MentalityProgress["branch"];
  currentStepId?: string;
  completedStepIds?: string[];
};

function isMentalityQuestionId(value: string): value is MentalityQuestionId {
  return value.length > 0;
}

export function sanitizeMentalityProgress(
  draft: MentalityDraft,
  progress?: RawMentalityProgress,
): MentalityProgress {
  const branch = draft.relationshipIntent || progress?.branch || "";
  const flow = getMentalityQuestions(branch);
  const fallbackStepId = branch ? getFirstBranchQuestionId(branch) : "relationship_intent";
  const requestedStepId =
    progress?.currentStepId && isMentalityQuestionId(progress.currentStepId)
      ? progress.currentStepId
      : fallbackStepId;
  const currentStepId = flow.some((step) => step.id === requestedStepId)
    ? requestedStepId
    : branch
      ? getFirstBranchQuestionId(branch)
      : "relationship_intent";

  return {
    branch,
    currentStepId,
    completedStepIds: Array.isArray(progress?.completedStepIds)
      ? progress.completedStepIds.filter((stepId): stepId is MentalityQuestionId =>
          isMentalityQuestionId(stepId) && flow.some((step) => step.id === stepId),
        )
      : [],
  };
}

function toMentalityDraft(section: Awaited<ReturnType<typeof getOrCreateOnboardingMetaRecord>>["sections"]["mentality"]): MentalityDraft {
  const seriousAnswers =
    section.seriousLongterm.answers &&
    typeof section.seriousLongterm.answers === "object" &&
    !Array.isArray(section.seriousLongterm.answers)
      ? Object.fromEntries(
          Object.entries(section.seriousLongterm.answers).filter(
            ([, value]): value is string => typeof value === "string",
          ),
        )
      : initialDraft.serious.answers;

  return {
    relationshipIntent: section.shared.answers.relationshipIntent,
    serious: {
      answers: seriousAnswers,
    },
    casual: {
      ...initialDraft.casual,
      ...(section.casualShortterm.answers as Partial<MentalityDraft["casual"]>),
      boundaries: Array.isArray((section.casualShortterm.answers as { boundaries?: unknown }).boundaries)
        ? ((section.casualShortterm.answers as { boundaries: string[] }).boundaries)
        : initialDraft.casual.boundaries,
    },
    open: {
      ...initialDraft.open,
      ...(section.openToBoth.answers as Partial<MentalityDraft["open"]>),
      needsClarity: Array.isArray((section.openToBoth.answers as { needsClarity?: unknown }).needsClarity)
        ? ((section.openToBoth.answers as { needsClarity: string[] }).needsClarity)
        : initialDraft.open.needsClarity,
    },
  };
}

export async function readStoredMentalityStateFromIdb(): Promise<StoredMentalityState> {
  const draftRecord = await getOrCreateOnboardingMetaRecord();
  const draft = toMentalityDraft(draftRecord.sections.mentality);
  const progress = sanitizeMentalityProgress(draft, {
    branch: draftRecord.sections.mentality.selectedTrack,
    currentStepId:
      draft.relationshipIntent === "serious_longterm"
        ? draftRecord.sections.mentality.seriousLongterm.currentStepId
        : draft.relationshipIntent === "casual_shortterm"
          ? draftRecord.sections.mentality.casualShortterm.currentStepId
          : draft.relationshipIntent === "open_to_both"
            ? draftRecord.sections.mentality.openToBoth.currentStepId
            : draftRecord.sections.mentality.shared.currentStepId,
    completedStepIds: [
      ...draftRecord.sections.mentality.shared.completedStepIds,
      ...(draft.relationshipIntent === "serious_longterm"
        ? draftRecord.sections.mentality.seriousLongterm.completedStepIds
        : draft.relationshipIntent === "casual_shortterm"
          ? draftRecord.sections.mentality.casualShortterm.completedStepIds
          : draft.relationshipIntent === "open_to_both"
            ? draftRecord.sections.mentality.openToBoth.completedStepIds
            : []),
    ],
  });

  return {
    draft,
    progress,
    hasSavedDraft: hasMentalityDraftContent(draft),
    userInfo: {
      mentality: draft,
      mentality_progress: progress,
    },
  };
}

export async function persistMentalityStateToIdb(args: {
  draft: MentalityDraft;
  progress: MentalityProgress;
}) {
  const sanitizedProgress = sanitizeMentalityProgress(args.draft, args.progress);

  await updateOnboardingMetaRecord((current) => ({
    ...current,
    sections: {
      ...current.sections,
      mentality: {
        ...current.sections.mentality,
        selectedTrack: sanitizedProgress.branch,
        completed: Boolean(
          sanitizedProgress.branch &&
            sanitizedProgress.completedStepIds.includes(sanitizedProgress.currentStepId),
        ),
        shared: {
          currentStepId: "relationship_intent",
          completedStepIds: sanitizedProgress.completedStepIds.includes("relationship_intent")
            ? ["relationship_intent"]
            : [],
          answers: {
            relationshipIntent: args.draft.relationshipIntent,
          },
        },
        seriousLongterm: {
          currentStepId:
            sanitizedProgress.branch === "serious_longterm"
              ? sanitizedProgress.currentStepId
              : current.sections.mentality.seriousLongterm.currentStepId,
          completedStepIds:
            sanitizedProgress.branch === "serious_longterm"
              ? sanitizedProgress.completedStepIds.filter((stepId) => stepId.startsWith("serious_"))
              : current.sections.mentality.seriousLongterm.completedStepIds,
          answers: {
            ...args.draft.serious,
          },
        },
        casualShortterm: {
          currentStepId:
            sanitizedProgress.branch === "casual_shortterm"
              ? sanitizedProgress.currentStepId
              : current.sections.mentality.casualShortterm.currentStepId,
          completedStepIds:
            sanitizedProgress.branch === "casual_shortterm"
              ? sanitizedProgress.completedStepIds.filter((stepId) => stepId.startsWith("casual_"))
              : current.sections.mentality.casualShortterm.completedStepIds,
          answers: {
            ...args.draft.casual,
          },
        },
        openToBoth: {
          currentStepId:
            sanitizedProgress.branch === "open_to_both"
              ? sanitizedProgress.currentStepId
              : current.sections.mentality.openToBoth.currentStepId,
          completedStepIds:
            sanitizedProgress.branch === "open_to_both"
              ? sanitizedProgress.completedStepIds.filter((stepId) => stepId.startsWith("open_"))
              : current.sections.mentality.openToBoth.completedStepIds,
          answers: {
            ...args.draft.open,
          },
        },
      },
    },
  }));

  await markOnboardingSectionDirty("mentality");
}

export function hasMentalityDraftContent(draft: MentalityDraft) {
  return Boolean(
    draft.relationshipIntent ||
      Object.values(draft.serious.answers).some(Boolean) ||
      draft.casual.frequency ||
      draft.casual.boundaries.length > 0 ||
      draft.open.style ||
      draft.open.needsClarity.length > 0,
  );
}

export { initialProgress };
