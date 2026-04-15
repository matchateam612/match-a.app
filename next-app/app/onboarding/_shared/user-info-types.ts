import type { BasicInfoDraft } from "../1-basics/_components/basic-info-types";
import type { MentalityDraft, MentalityProgress } from "../2-mentality/_components/mentality-types";

export type UserInfo = {
  basic_info?: BasicInfoDraft;
  mentality?: MentalityDraft;
  mentality_progress?: MentalityProgress;
  [key: string]: unknown;
};
