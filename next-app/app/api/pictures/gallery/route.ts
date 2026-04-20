import { NextResponse } from "next/server";

import { logPictureError } from "@/lib/pictures/picture-logging";
import { moderatePictureBuffer } from "@/lib/pictures/picture-moderation";
import { assertValidPictureFile, parseGallerySlot } from "@/lib/pictures/picture-policy";
import { normalizePictureFile } from "@/lib/pictures/picture-processing";
import {
  deleteGalleryPicture,
  listGalleryPictures,
  uploadGalleryPicture,
} from "@/lib/pictures/picture-server";
import { requireAuthenticatedUser } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const photos = await listGalleryPictures(user.id);

    return NextResponse.json({ photos });
  } catch (error) {
    logPictureError("Gallery picture list request failed.", error);
    return jsonError(
      error instanceof Error && error.message
        ? error.message
        : "We couldn't load your private gallery right now.",
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const formData = await request.formData();
    const image = formData.get("image");
    const slot = parseGallerySlot(formData.get("slot"));

    if (!(image instanceof File)) {
      return jsonError("An image file is required.");
    }

    assertValidPictureFile(image);
    const normalizedPicture = await normalizePictureFile(image);
    const moderation = await moderatePictureBuffer(normalizedPicture.buffer);

    if (!moderation.allowed) {
      return jsonError(
        moderation.reason ?? "This photo could not be uploaded because it appears unsafe.",
        422,
      );
    }

    const uploadedPicture = await uploadGalleryPicture(user.id, slot, normalizedPicture.buffer);

    return NextResponse.json({
      ...uploadedPicture,
      slot,
    });
  } catch (error) {
    logPictureError("Gallery picture upload request failed.", error);
    return jsonError(
      error instanceof Error && error.message
        ? error.message
        : "We couldn't upload that gallery photo right now.",
      500,
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const url = new URL(request.url);
    const slot = parseGallerySlot(url.searchParams.get("slot"));

    await deleteGalleryPicture(user.id, slot);

    return NextResponse.json({
      success: true,
      slot,
    });
  } catch (error) {
    logPictureError("Gallery picture delete request failed.", error);
    return jsonError(
      error instanceof Error && error.message
        ? error.message
        : "We couldn't remove that gallery photo right now.",
      500,
    );
  }
}
