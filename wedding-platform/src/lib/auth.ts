import type { AppRole, DemoSession } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { setStorageItem } from "@/lib/store";

export type AuthIdentity = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
};

const DEMO_CREDENTIALS: Record<string, { role: AppRole; fullName: string; id: string; password: string }> = {
  "owner@occasio.local": { role: "owner", fullName: "Occasio Owner", id: "usr-1", password: "OccasioOwner123!" },
  "owner@occasio.app": { role: "owner", fullName: "Occasio Owner", id: "usr-1", password: "OccasioOwner123!" },
  "client@occasio.local": { role: "client", fullName: "Sheila & Yoga", id: "usr-client-1", password: "OccasioClient123!" },
  "client@occasio.app": { role: "client", fullName: "Sheila & Yoga", id: "usr-client-1", password: "OccasioClient123!" },
};

function readRole(value: unknown): AppRole | null {
  return value === "owner" || value === "client" ? value : null;
}

function setDemoCookie(role: string) {
  if (typeof document !== "undefined") {
    document.cookie = `occasio_demo_role=${role}; path=/; max-age=86400; SameSite=Lax`;
  }
}

function clearDemoCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "occasio_demo_role=; path=/; max-age=0; SameSite=Lax";
  }
}

function syncStoreSession(identity: AuthIdentity, source: "demo" | "supabase" = "demo") {
  if (typeof window === "undefined") return;
  const session: DemoSession = {
    userId: identity.id,
    email: identity.email,
    fullName: identity.fullName,
    role: identity.role,
    loggedInAt: new Date().toISOString(),
    source,
  };
  setStorageItem("occasio_current_session", session);
  setStorageItem("occasio_user", identity);
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
  const normalizedEmail = email.trim().toLowerCase();
  let supabaseAuthFailed = false;

  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

    if (!error && data.user) {
      const identity = identityFromUser(data.user);
      setDemoCookie(identity.role);
      syncStoreSession(identity, "supabase");
      return identity;
    }

    if (error?.code === "invalid_credentials") {
      // Allow fallback if demo password matches
      supabaseAuthFailed = true;
    } else if (error) {
      console.warn("Supabase Auth unreachable or returned error:", error.message);
      supabaseAuthFailed = true;
    }
  } catch (err) {
    console.warn("Supabase client connection exception:", err);
    supabaseAuthFailed = true;
  }

  // Graceful fallback to demo accounts for showcase/preview/offline testing
  const demoAccount = DEMO_CREDENTIALS[normalizedEmail];
  if (demoAccount && demoAccount.password === password) {
    const identity: AuthIdentity = {
      id: demoAccount.id,
      email: normalizedEmail,
      fullName: demoAccount.fullName,
      role: demoAccount.role,
    };
    setDemoCookie(identity.role);
    syncStoreSession(identity);
    return identity;
  }

  if (supabaseAuthFailed) {
    throw new Error("Email atau password salah.");
  }

  throw new Error("Email atau password salah.");
}

export async function getAuthenticatedUser(): Promise<AuthIdentity | null> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getUser();

    if (!error && data.user) {
      const identity = identityFromUser(data.user);
      setDemoCookie(identity.role);
      syncStoreSession(identity, "supabase");
      return identity;
    }
  } catch {
    // Supabase unreachable, check client storage
  }

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("occasio_user");
      if (stored) {
        const parsed = JSON.parse(stored) as AuthIdentity;
        if (parsed?.role) {
          setDemoCookie(parsed.role);
          return parsed;
        }
      }
    } catch {
      // Ignore JSON parse error
    }
  }

  return null;
}

export async function signOut(): Promise<void> {
  clearDemoCookie();
  if (typeof window !== "undefined") {
    localStorage.removeItem("occasio_user");
    localStorage.removeItem("occasio_current_session");
  }
  try {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore sign out error when backend is offline
  }
}
