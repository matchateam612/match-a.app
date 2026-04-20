import { getSupabaseBrowserClient } from "./client";
import type { EmailPasswordAuthPayload } from "./types";

export async function signInWithEmailPassword({
  email,
  password,
}: EmailPasswordAuthPayload) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signUpWithEmailPassword({
  email,
  password,
}: EmailPasswordAuthPayload) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
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

export async function resendSignupVerificationEmail(email: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) {
    throw error;
  }

  return data;
}

function getBrowserOrigin() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.location.origin;
}

export async function sendPasswordResetEmail(email: string) {
  const supabase = getSupabaseBrowserClient();
  const origin = getBrowserOrigin();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin ? `${origin}/reset-password` : undefined,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function updateCurrentUserPassword(password: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function exchangeCodeForSession(code: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    throw error;
  }

  return data;
}

export async function setRecoverySession(accessToken: string, refreshToken: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw error;
  }

  return data;
}
