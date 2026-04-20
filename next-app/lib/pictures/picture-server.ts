import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logPictureError } from "@/lib/pictures/picture-logging";
import {
  getPictureSignedUrlTtlSeconds,
  getUserGalleryPhotoPath,
  getUserPfpPath,
  USER_PICTURE_BUCKET,
  type UserGalleryPhoto,
} from "@/lib/supabase/user-picture";

async function createSignedUrl(path: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(USER_PICTURE_BUCKET)
    .createSignedUrl(path, getPictureSignedUrlTtlSeconds());

  if (error || !data?.signedUrl) {
    throw error ?? new Error("We couldn't create a private picture preview.");
  }

  return data.signedUrl;
}

export async function getProfilePictureSignedUrl(userId: string) {
  const path = getUserPfpPath(userId);

  try {
    return {
      path,
      signedUrl: await createSignedUrl(path),
    };
  } catch (error) {
    logPictureError("Failed to create signed URL for profile picture.", error, { userId, path });
    throw error;
  }
}

export async function uploadProfilePicture(userId: string, buffer: Buffer) {
  const supabase = getSupabaseAdminClient();
  const path = getUserPfpPath(userId);
  const { error } = await supabase.storage.from(USER_PICTURE_BUCKET).upload(path, buffer, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) {
    logPictureError("Failed to upload profile picture.", error, { userId, path });
    throw error;
  }

  return {
    path,
    signedUrl: await createSignedUrl(path),
  };
}

export async function uploadGalleryPicture(userId: string, slot: number, buffer: Buffer) {
  const supabase = getSupabaseAdminClient();
  const path = getUserGalleryPhotoPath(userId, slot);
  const { error } = await supabase.storage.from(USER_PICTURE_BUCKET).upload(path, buffer, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) {
    logPictureError("Failed to upload gallery picture.", error, { userId, path, slot });
    throw error;
  }

  return {
    path,
    signedUrl: await createSignedUrl(path),
  };
}

export async function deleteGalleryPicture(userId: string, slot: number) {
  const supabase = getSupabaseAdminClient();
  const path = getUserGalleryPhotoPath(userId, slot);
  const { error } = await supabase.storage.from(USER_PICTURE_BUCKET).remove([path]);

  if (error) {
    logPictureError("Failed to delete gallery picture.", error, { userId, path, slot });
    throw error;
  }
}

export async function listGalleryPictures(userId: string): Promise<UserGalleryPhoto[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(USER_PICTURE_BUCKET).list(`${userId}/gallery`, {
    limit: 100,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    logPictureError("Failed to list gallery pictures.", error, { userId });
    throw error;
  }

  const items = (data ?? [])
    .map((entry) => {
      const match = /^picture_(\d{3})\.jpg$/i.exec(entry.name);

      if (!match) {
        return null;
      }

      const slot = Number(match[1]);

      return {
        slot,
        path: `${userId}/gallery/${entry.name}`,
      };
    })
    .filter((entry): entry is { slot: number; path: string } => Boolean(entry))
    .sort((left, right) => left.slot - right.slot);

  return Promise.all(
    items.map(async (item) => ({
      ...item,
      signedUrl: await createSignedUrl(item.path),
    })),
  );
}
