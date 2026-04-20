"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserGalleryPhoto } from "@/lib/supabase/user-picture";

async function buildAuthHeaders() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (error || !accessToken) {
    throw error ?? new Error("Please sign in before uploading photos.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | T
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && payload.error
        ? payload.error
        : "We couldn't complete that photo request right now.";
    throw new Error(message);
  }

  return payload as T;
}

export async function uploadProfilePictureRequest(file: File) {
  const headers = await buildAuthHeaders();
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/pictures/profile", {
    method: "POST",
    headers,
    body: formData,
  });

  return parseJsonResponse<{ path: string; signedUrl: string }>(response);
}

export async function getProfilePictureRequest() {
  const headers = await buildAuthHeaders();
  const response = await fetch("/api/pictures/profile", {
    method: "GET",
    headers,
    cache: "no-store",
  });

  return parseJsonResponse<{ path: string; signedUrl: string }>(response);
}

export async function listGalleryPicturesRequest() {
  const headers = await buildAuthHeaders();
  const response = await fetch("/api/pictures/gallery", {
    method: "GET",
    headers,
    cache: "no-store",
  });

  return parseJsonResponse<{ photos: UserGalleryPhoto[] }>(response);
}

export async function uploadGalleryPictureRequest(slot: number, file: File) {
  const headers = await buildAuthHeaders();
  const formData = new FormData();
  formData.append("image", file);
  formData.append("slot", String(slot));

  const response = await fetch("/api/pictures/gallery", {
    method: "POST",
    headers,
    body: formData,
  });

  return parseJsonResponse<{ path: string; signedUrl: string; slot: number }>(response);
}

export async function deleteGalleryPictureRequest(slot: number) {
  const headers = await buildAuthHeaders();
  const response = await fetch(`/api/pictures/gallery?slot=${slot}`, {
    method: "DELETE",
    headers,
  });

  return parseJsonResponse<{ success: true; slot: number }>(response);
}
