import { createBrowserClient } from "@supabase/ssr";

export function hasSupabaseBrowserConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabasePublicKey) {
    throw new Error("Konfigurasi publik Supabase belum lengkap.");
  }

  return createBrowserClient(supabaseUrl, supabasePublicKey);
}

export function tryCreateSupabaseBrowserClient() {
  if (!hasSupabaseBrowserConfig()) return null;

  try {
    return createSupabaseBrowserClient();
  } catch {
    return null;
  }
}
