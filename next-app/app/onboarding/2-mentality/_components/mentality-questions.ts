import type {
  MentalityQuestionDefinition,
  MentalityQuestionGroup,
  MentalityQuestionId,
  RelationshipIntent,
} from "./mentality-types";
import { casualShorttermMentalityQuestions } from "./questions/casual-shortterm";
import { openToBothMentalityQuestions } from "./questions/open-to-both";
import { seriousLongtermMentalityQuestions } from "./questions/serious-longterm";
import { sharedMentalityQuestions } from "./questions/shared";

export const mentalityQuestionGroups: MentalityQuestionGroup[] = [
  {
    branch: "shared",
    questions: sharedMentalityQuestions,
  },
  {
    branch: "serious_longterm",
    questions: seriousLongtermMentalityQuestions,
  },
  {
    branch: "casual_shortterm",
    questions: casualShorttermMentalityQuestions,
  },
  {
    branch: "open_to_both",
    questions: openToBothMentalityQuestions,
  },
];

export function getMentalityQuestions(intent: RelationshipIntent | ""): MentalityQuestionDefinition[] {
  const sharedQuestions =
    mentalityQuestionGroups.find((group) => group.branch === "shared")?.questions ?? [];

  if (!intent) {
    return sharedQuestions;
  }

  const branchQuestions =
    mentalityQuestionGroups.find((group) => group.branch === intent)?.questions ?? [];

  return [...sharedQuestions, ...branchQuestions];
}

export function getFirstBranchQuestionId(intent: RelationshipIntent): MentalityQuestionId {
  const branchQuestions = getMentalityQuestions(intent).filter((question) => question.branch === intent);
  return branchQuestions[0]?.id ?? "relationship_intent";
}
