"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/database.types";

export type DashboardProfile = {
  profilePictureUrl: string | null;
  email: string | null;
  basicInfo: Database["public"]["Tables"]["user_basic_info"]["Row"] | null;
  mentality: Database["public"]["Tables"]["user_mentality"]["Row"] | null;
  agentProfile: Database["public"]["Tables"]["user_agent_profile"]["Row"] | null;
};

export type DisplayField = {
  label: string;
  value: string;
};

async function buildAuthHeaders() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (error || !accessToken) {
    throw error ?? new Error("Please sign in before viewing your profile.");
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
        : "We couldn't complete that profile request right now.";
    throw new Error(message);
  }

  return payload as T;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(formatValue).join(", ") : "Not set";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value).replace(/_/g, " ");
}

function toTitle(label: string) {
  return label
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function jsonToFields(value: Json | Record<string, unknown> | null): DisplayField[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value).map(([key, entry]) => ({
    label: toTitle(key),
    value: formatValue(entry),
  }));
}

export function basicInfoToFields(profile: DashboardProfile): DisplayField[] {
  const info = profile.basicInfo;

  if (!info) {
    return [];
  }

  return [
    { label: "Email", value: formatValue(profile.email) },
    { label: "Age", value: formatValue(info.age) },
    { label: "Phone Number", value: formatValue(info.phone_number) },
    { label: "Gender Identity", value: formatValue(info.gender_identity_custom || info.gender_identity) },
    { label: "Interested In", value: formatValue(info.interested_in_custom || info.interested_in) },
    { label: "Ethnicity", value: formatValue(info.ethnicity) },
    { label: "Preferred Age", value: `${formatValue(info.preferred_age_min)} - ${formatValue(info.preferred_age_max)}` },
    { label: "Preferred Ethnicities", value: formatValue(info.preferred_ethnicities) },
  ];
}

export function mentalityToFields(profile: DashboardProfile): DisplayField[] {
  const mentality = profile.mentality;

  if (!mentality) {
    return [];
  }

  return [
    { label: "Relationship Intent", value: formatValue(mentality.relationship_intent) },
    { label: "Selected Track", value: formatValue(mentality.selected_track) },
    ...jsonToFields(mentality.answers),
  ];
}

export function agentMemoryToFields(profile: DashboardProfile): DisplayField[] {
  const agentProfile = profile.agentProfile;

  if (!agentProfile) {
    return [];
  }

  return [
    { label: "Final Summary", value: formatValue(agentProfile.final_summary) },
    ...jsonToFields(agentProfile.agent_memory),
  ];
}

export async function getDashboardProfileRequest() {
  const headers = await buildAuthHeaders();
  const response = await fetch("/api/dashboard/profile", {
    method: "GET",
    headers,
    cache: "no-store",
  });

  return parseJsonResponse<DashboardProfile>(response);
}
