import type { AppRole } from "@/lib/types";
export type AuthIdentity = {
    id: string;
    email: string;
    fullName: string;
    role: AppRole;
};
export async function signInWithPassword(email: string, password: string): Promise<AuthIdentity> {
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await r.json();
    if (!r.ok)
        throw new Error(data.error || "Login gagal.");
    return data.user;
}
export async function getAuthenticatedUser(): Promise<AuthIdentity | null> {
    const r = await fetch("/api/auth", { cache: "no-store" });
    if (!r.ok)
        throw new Error("Session tidak dapat diperiksa.");
    return (await r.json()).user;
}
export async function signOut(): Promise<void> { const r = await fetch("/api/auth", { method: "DELETE" }); if (!r.ok)
    throw new Error("Logout gagal."); }
