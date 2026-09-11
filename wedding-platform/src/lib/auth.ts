import type { AppRole } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type AuthIdentity = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
};

function readRole(value: unknown): AppRole | null {
  return value === "owner" || value === "client" ? value : null;
}

function identityFromUser(user: {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): AuthIdentity {
  const role = readRole(user.app_metadata?.role);
  if (!role) {
    throw new Error("Role akun belum dikonfigurasi oleh owner Occasio.");
  }

  return {
    id: user.id,
    email: user.email || "",
    fullName:
      typeof user.app_metadata?.full_name === "string"
        ? user.app_metadata.full_name
        : typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : user.email || "Pengguna Occasio",
    role,
  };
}

export async function signInWithPassword(email: string, password: string): Promise<AuthIdentity> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    throw new Error("Email atau password salah.");
  }

  try {
    return identityFromUser(data.user);
  } catch (identityError) {
    await supabase.auth.signOut();
    throw identityError;
  }
}

export async function getAuthenticatedUser(): Promise<AuthIdentity | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;
  return identityFromUser(data.user);
}

export async function signOut(): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Logout gagal. Silakan coba lagi.");
}
