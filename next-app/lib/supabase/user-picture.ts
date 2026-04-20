export const USER_PICTURE_BUCKET = "user_pfp";
export const MAX_GALLERY_PHOTOS = 9;
export const DEFAULT_PICTURE_SIGNED_URL_TTL_SECONDS = 3600;

export type UserGalleryPhoto = {
  slot: number;
  path: string;
  signedUrl: string;
};

export function isValidGallerySlot(slot: number) {
  return Number.isInteger(slot) && slot >= 1 && slot <= MAX_GALLERY_PHOTOS;
}

export function formatGalleryPhotoName(slot: number) {
  return `picture_${String(slot).padStart(3, "0")}.jpg`;
}

export function getUserPfpPath(userId: string) {
  return `${userId}/profile.jpg`;
}

export function getUserGalleryPhotoPath(userId: string, slot: number) {
  if (!isValidGallerySlot(slot)) {
    throw new Error("Invalid gallery photo slot.");
  }

  return `${userId}/gallery/${formatGalleryPhotoName(slot)}`;
}

export function getPictureSignedUrlTtlSeconds() {
  const rawValue = process.env.PICTURE_SIGNED_URL_TTL_SECONDS;
  const parsedValue = rawValue ? Number(rawValue) : DEFAULT_PICTURE_SIGNED_URL_TTL_SECONDS;

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_PICTURE_SIGNED_URL_TTL_SECONDS;
  }

  return Math.floor(parsedValue);
}
