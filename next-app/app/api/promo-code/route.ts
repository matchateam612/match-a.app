import { NextResponse } from "next/server";

import { updateUserPromotedBy } from "@/lib/supabase/user-system-state-admin";
import { requireAuthenticatedUser } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

type PromoCodeRequest = {
  code?: string;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const payload = (await request.json().catch(() => null)) as PromoCodeRequest | null;
    const code = payload?.code?.trim();

    if (!code) {
      return jsonError("A promo code is required.");
    }

    await updateUserPromotedBy(user.id, code);

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error && error.message
        ? error.message
        : "We couldn't save your promo code right now.",
      500,
    );
  }
}
