import { NextResponse } from "next/server";

import { logPictureError } from "@/lib/pictures/picture-logging";
import { moderatePictureBuffer } from "@/lib/pictures/picture-moderation";
import { assertValidPictureFile } from "@/lib/pictures/picture-policy";
import { normalizePictureFile } from "@/lib/pictures/picture-processing";
import { getProfilePictureSignedUrl, uploadProfilePicture } from "@/lib/pictures/picture-server";
import { requireAuthenticatedUser } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const profilePicture = await getProfilePictureSignedUrl(user.id);

    return NextResponse.json(profilePicture);
  } catch (error) {
    logPictureError("Profile picture signed URL request failed.", error);
    return jsonError(
      error instanceof Error && error.message
        ? error.message
        : "We couldn't load your private profile photo right now.",
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const formData = await request.formData();
    const image = formData.get("image");

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

    const uploadedPicture = await uploadProfilePicture(user.id, normalizedPicture.buffer);

    return NextResponse.json(uploadedPicture);
  } catch (error) {
    logPictureError("Profile picture upload request failed.", error);
    return jsonError(
      error instanceof Error && error.message
        ? error.message
        : "We couldn't upload that profile photo right now.",
      500,
    );
  }
}
