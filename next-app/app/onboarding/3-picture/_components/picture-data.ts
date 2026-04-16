import type { PictureDraft } from "./picture-types";

export const USER_INFO_STORAGE_KEY = "user_info";
export const PICTURE_STEP_STORAGE_KEY = "user_info.picture.current_step";
export const TOTAL_SECTIONS = 4;
export const TOTAL_STEPS = 1;

export const initialDraft: PictureDraft = {
  source: "",
  originalDataUrl: "",
  stylizedDataUrl: "",
  previewDataUrl: "",
  fileName: "",
  mimeType: "",
  width: 0,
  height: 0,
  stylizedAt: "",
};
