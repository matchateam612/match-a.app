import { NextResponse } from "next/server";

import { logPictureError } from "@/lib/pictures/picture-logging";
import { getProfilePictureSignedUrl } from "@/lib/pictures/picture-server";
import { getAuthorizedMatchedProfilePictureUserId } from "@/lib/supabase/match-visibility";
import { requireAuthenticatedUser } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type RequestBody = {
  matchIds?: string[];
};

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = (await request.json().catch(() => null)) as RequestBody | null;
    const rawMatchIds = body?.matchIds;

    if (!Array.isArray(rawMatchIds) || rawMatchIds.length === 0) {
      return jsonError("At least one match ID is required.");
    }

    const matchIds = Array.from(
      new Set(
        rawMatchIds.filter(
          (matchId): matchId is string => typeof matchId === "string" && matchId.trim().length > 0,
        ),
      ),
    );

    const pictures = await Promise.all(
      matchIds.map(async (matchId) => {
        try {
          const targetUserId = await getAuthorizedMatchedProfilePictureUserId(matchId, user.id);
          const picture = await getProfilePictureSignedUrl(targetUserId);

          return {
            matchId,
            path: picture.path,
            signedUrl: picture.signedUrl,
            targetUserId,
          };
        } catch (error) {
          logPictureError("Matched profile picture request failed for one match.", error, {
            requesterUserId: user.id,
            matchId,
          });

          return {
            matchId,
            path: null,
            signedUrl: null,
            targetUserId: null,
          };
        }
      }),
    );

    return NextResponse.json({ pictures });
  } catch (error) {
    logPictureError("Matched profile picture batch request failed.", error);
    return jsonError(
      error instanceof Error && error.message
        ? error.message
        : "We couldn't load matched profile pictures right now.",
      500,
    );
  }
}
