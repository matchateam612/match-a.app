const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function assertEnvValue(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing Supabase environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseBrowserEnv() {
  return {
    url: assertEnvValue(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: assertEnvValue(supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}
