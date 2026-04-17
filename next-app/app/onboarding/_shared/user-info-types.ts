import type { BasicInfoDraft } from "../1-basics/_components/basic-info-types";
import type { MentalityDraft, MentalityProgress } from "../2-mentality/_components/mentality-types";
import type { PictureDraft } from "../3-picture/_components/picture-types";

export type UserInfo = {
  basic_info?: BasicInfoDraft;
  mentality?: MentalityDraft;
  mentality_progress?: MentalityProgress;
  picture?: PictureDraft;
  [key: string]: unknown;
};
