import { getSupabaseBrowserClient } from "./client";

const supabase = getSupabaseBrowserClient();
const USER_PICTURE_BUCKET = "user_pfp";
const MAX_GALLERY_PHOTOS = 9;

export type UserGalleryPhoto = {
  slot: number;
  path: string;
  signedUrl: string;
};

function isValidGallerySlot(slot: number) {
  return Number.isInteger(slot) && slot >= 1 && slot <= MAX_GALLERY_PHOTOS;
}

function formatGalleryPhotoName(slot: number) {
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

export const uploadUserPfp = async (userId: string, file: File) => {
  const filePath = getUserPfpPath(userId);

  const { error: uploadError } = await supabase.storage
    .from(USER_PICTURE_BUCKET)
    .upload(filePath, file, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  return { success: true, path: filePath };
};

export async function uploadUserGalleryPhoto(userId: string, slot: number, file: File) {
  const filePath = getUserGalleryPhotoPath(userId, slot);

  const { error: uploadError } = await supabase.storage
    .from(USER_PICTURE_BUCKET)
    .upload(filePath, file, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  return createSignedGalleryPhotoUrl(filePath);
}

export async function deleteUserGalleryPhoto(userId: string, slot: number) {
  const filePath = getUserGalleryPhotoPath(userId, slot);
  const { error } = await supabase.storage.from(USER_PICTURE_BUCKET).remove([filePath]);

  if (error) {
    throw error;
  }
}

async function createSignedGalleryPhotoUrl(path: string) {
  const { data, error } = await supabase.storage.from(USER_PICTURE_BUCKET).createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    throw error ?? new Error("We couldn't generate a private photo preview.");
  }

  return data.signedUrl;
}

export async function listUserGalleryPhotos(userId: string): Promise<UserGalleryPhoto[]> {
  const { data, error } = await supabase.storage
    .from(USER_PICTURE_BUCKET)
    .list(`${userId}/gallery`, {
      limit: MAX_GALLERY_PHOTOS,
      sortBy: { column: "name", order: "asc" },
    });

  if (error) {
    throw error;
  }

  const galleryPhotos = (data ?? [])
    .map((entry) => {
      const match = /^picture_(\d{3})\.jpg$/i.exec(entry.name);

      if (!match) {
        return null;
      }

      const slot = Number(match[1]);

      if (!isValidGallerySlot(slot)) {
        return null;
      }

      return {
        slot,
        path: `${userId}/gallery/${entry.name}`,
      };
    })
    .filter((entry): entry is { slot: number; path: string } => Boolean(entry));

  const signedUrls = await Promise.all(
    galleryPhotos.map(async (photo) => ({
      ...photo,
      signedUrl: await createSignedGalleryPhotoUrl(photo.path),
    })),
  );

  return signedUrls.sort((left, right) => left.slot - right.slot);
}

// 2. DISPLAY USER'S PHOTOS
// const viewMyPhotos = async (userId: string) => {
  
//   // Get all photo paths for this user
//   const { data: photos } = await supabase
//     .from('user_photos')
//     .select('id, file_path, original_filename')
//     .eq('user_id', userId);
  
//   // Generate fresh signed URLs (valid for 1 hour)
//   const photosWithUrls = await Promise.all(photos.map(async (photo) => {
//     const { data } = await supabase.storage
//       .from('user-photos')
//       .createSignedUrl(photo.file_path, 3600); // 1 hour
    
//     return {
//       ...photo,
//       viewUrl: data.signedUrl
//     };
//   }));
  
//   return photosWithUrls;
// };
