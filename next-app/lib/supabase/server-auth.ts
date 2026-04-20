import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

function getBearerToken(request: Request) {
  const authorizationHeader = request.headers.get("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new Error("Please sign in before uploading photos.");
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

function getSupabaseServerAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey) {
    throw new Error("Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function requireAuthenticatedUser(request: Request) {
  const accessToken = getBearerToken(request);
  const supabase = getSupabaseServerAuthClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw error ?? new Error("Please sign in before uploading photos.");
  }

  return data.user;
}
