import { createClient } from "@supabase/supabase-js";

import { getSupabaseBrowserEnv } from "./env";

let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey } = getSupabaseBrowserEnv();

  browserClient = createClient("https://dnkfrxavhtcvruclkcmp.supabase.co", "sb_publishable_RodGIQugdUqI94XDqCe6FQ_9BkZ1XIP", {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
