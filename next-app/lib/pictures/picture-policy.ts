import "server-only";

import { MAX_GALLERY_PHOTOS, isValidGallerySlot } from "@/lib/supabase/user-picture";

export const DEFAULT_PICTURE_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_PICTURE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export function getPictureMaxUploadBytes() {
  const rawValue = process.env.PICTURE_MAX_UPLOAD_BYTES;
  const parsedValue = rawValue ? Number(rawValue) : DEFAULT_PICTURE_MAX_UPLOAD_BYTES;

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_PICTURE_MAX_UPLOAD_BYTES;
  }

  return Math.floor(parsedValue);
}

export function assertValidPictureFile(file: File) {
  if (!ALLOWED_PICTURE_MIME_TYPES.has(file.type)) {
    throw new Error("Please upload a JPEG, PNG, WebP, or HEIC image.");
  }

  if (file.size <= 0) {
    throw new Error("The uploaded image was empty.");
  }

  if (file.size > getPictureMaxUploadBytes()) {
    throw new Error("That image is too large to upload right now.");
  }
}

export function parseGallerySlot(value: FormDataEntryValue | string | null) {
  const rawValue = typeof value === "string" ? value : value ?? "";
  const slot = Number(rawValue);

  if (!isValidGallerySlot(slot)) {
    throw new Error(`Gallery photo slot must be between 1 and ${MAX_GALLERY_PHOTOS}.`);
  }

  return slot;
}
