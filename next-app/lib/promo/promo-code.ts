"use client";

import { ONBOARDING_META_STORE } from "@/lib/onboarding-idb/types";
import { withOnboardingStore } from "@/lib/onboarding-idb/open-db";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const PROMO_CODE_RECORD_ID = "promo-code";

type PromoCodeRecord = {
  id: typeof PROMO_CODE_RECORD_ID;
  code: string;
  updatedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

export async function savePromoCode(code: string) {
  const normalizedCode = code.trim();

  if (!normalizedCode) {
    return;
  }

  await withOnboardingStore<void>(ONBOARDING_META_STORE, "readwrite", (store, resolve, reject) => {
    const request = store.put({
      id: PROMO_CODE_RECORD_ID,
      code: normalizedCode,
      updatedAt: nowIso(),
    } satisfies PromoCodeRecord);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function readPromoCode() {
  return withOnboardingStore<string | null>(ONBOARDING_META_STORE, "readonly", (store, resolve, reject) => {
    const request = store.get(PROMO_CODE_RECORD_ID);
    request.onsuccess = () => {
      const record = (request.result as PromoCodeRecord | undefined) ?? null;
      resolve(record?.code ?? null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearPromoCode() {
  await withOnboardingStore<void>(ONBOARDING_META_STORE, "readwrite", (store, resolve, reject) => {
    const request = store.delete(PROMO_CODE_RECORD_ID);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function syncPromoCodeForCurrentUser() {
  const code = await readPromoCode();

  if (!code) {
    return false;
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (error || !accessToken) {
    return false;
  }

  const response = await fetch("/api/promo-code", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  const payload = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || "We couldn't attach your promo code right now.");
  }

  await clearPromoCode();
  return true;
}
