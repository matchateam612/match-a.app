import { getSupabaseBrowserClient } from "./client";
import type { SignInPayload } from "./types";

export async function signInWithEmailPassword({
  email,
  password
}: SignInPayload) {
  const supabase = getSupabaseBrowserClient();
  console.log(email, password)
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getCurrentUser() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

export async function signOutCurrentUser() {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
