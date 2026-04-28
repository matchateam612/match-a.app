import type { PictureDraft } from "./picture-types";

export const USER_INFO_STORAGE_KEY = "user_info";
export const PICTURE_STEP_STORAGE_KEY = "user_info.picture.current_step";
export const TOTAL_SECTIONS = 4;
export const TOTAL_STEPS = 3;
export const MAX_GALLERY_PHOTOS = 9;
export const AVATAR_GENERATION_PROMPTS = [
  "Transform the uploaded real-person photo into a cute stylized 3D avatar figure with a high-end cartoon CGI look. Keep the person’s identity recognizable, but simplify the features into a polished avatar style: large expressive eyes, smooth skin, soft facial contours, subtle natural smile, clean and delicate details. Use slightly chibi-inspired proportions with a somewhat larger head and a smaller body, while still keeping the character elegant and balanced. Preserve the original hairstyle, outfit, and key accessories from the photo, but reinterpret them in a clean, minimal, premium 3D animated style. Show the character as a full-body figure in a relaxed, friendly pose. Use soft studio lighting, smooth shading, pastel tones, and a simple minimal background or pedestal. The final result should feel like a modern collectible avatar / polished 3D character, adorable, refined, and visually clean, not too childish and not photorealistic.",
  "Transform the uploaded real-person photo into a cute stylized 3D avatar figure with a high-end cartoon CGI look. Keep the person’s identity recognizable, but simplify the features into a polished avatar style: large expressive eyes, smooth skin, soft facial contours, subtle natural smile, clean and delicate details. Use slightly chibi-inspired proportions with a somewhat larger head and a smaller body, while still keeping the character elegant and balanced. Preserve the original hairstyle, outfit, and key accessories from the photo, but reinterpret them in a clean, minimal, premium 3D animated style. Show the character as a full-body figure in a relaxed, friendly pose. Use soft studio lighting, smooth shading, pastel tones, and a simple minimal background or pedestal. The final result should feel like a modern collectible avatar / polished 3D character, adorable, refined, and visually clean, not too childish and not photorealistic.",
  "Transform the uploaded real-person photo into a cute stylized 3D avatar figure with a high-end cartoon CGI look. Keep the person’s identity recognizable, but simplify the features into a polished avatar style: large expressive eyes, smooth skin, soft facial contours, subtle natural smile, clean and delicate details. Use slightly chibi-inspired proportions with a somewhat larger head and a smaller body, while still keeping the character elegant and balanced. Preserve the original hairstyle, outfit, and key accessories from the photo, but reinterpret them in a clean, minimal, premium 3D animated style. Show the character as a full-body figure in a relaxed, friendly pose. Use soft studio lighting, smooth shading, pastel tones, and a simple minimal background or pedestal. The final result should feel like a modern collectible avatar / polished 3D character, adorable, refined, and visually clean, not too childish and not photorealistic.",
] as const;

export const initialDraft: PictureDraft = {
  source: "",
  fileName: "",
  mimeType: "",
  width: 0,
  height: 0,
  originalAssetKey: "",
  generatedAssetKey: "",
  generationStatus: "idle",
  generationError: "",
  selectedAvatarIndex: 0,
};
