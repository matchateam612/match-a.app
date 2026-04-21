import type { PictureDraft } from "./picture-types";

export const USER_INFO_STORAGE_KEY = "user_info";
export const PICTURE_STEP_STORAGE_KEY = "user_info.picture.current_step";
export const TOTAL_SECTIONS = 4;
export const TOTAL_STEPS = 3;
export const MAX_GALLERY_PHOTOS = 9;

export const initialDraft: PictureDraft = {
  source: "",
  prompt:
    "Turn this real profile photo into a clean, flattering dating profile portrait. Keep the same person, facial structure, skin tone, hair color, and overall identity. Improve lighting and polish the image while keeping it believable, warm, and natural.",
  fileName: "",
  mimeType: "",
  width: 0,
  height: 0,
  transformedAt: "",
  hasGeneratedImage: false,
};
