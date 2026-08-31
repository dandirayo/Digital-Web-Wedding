"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { tryCreateSupabaseBrowserClient } from "@/lib/supabase/browser";
import { initStore, getCurrentSession } from "@/lib/store";
type AuthGateProps = {
  role: "client" | "owner";
  children: ReactNode;
};

type GateState = "checking" | "allowed" | "blocked" | "setup";

export function AuthGate({ role, children }: AuthGateProps) {
  const router = useRouter();
  const [state, setState] = useState<GateState>("checking");
  const [message, setMessage] = useState("Memeriksa session...");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        await initStore();
        const session = await getCurrentSession();

        if (session?.role) {
          if (session.role !== role) {
            router.replace(session.role === "owner" ? "/owner/dashboard" : "/client/dashboard");
            return;
          }

          if (!active) return;
          setState("allowed");
          return;
        }

        if (!active) return;
        setState("blocked");
        setMessage("Silakan login demo terlebih dahulu dari halaman utama.");
      } catch (error) {
        if (!active) return;
        setState("setup");
        setMessage(error instanceof Error ? error.message : "Session demo belum siap.");
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [role, router]);

  if (state === "allowed") return <>{children}</>;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f3ed] px-5 text-[#241f1a]">
      <div className="w-full max-w-lg rounded-md border border-[#e0d4c7] bg-white p-6 text-center shadow-[0_18px_48px_rgba(82,57,38,0.08)]">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a6a3a]">
          Occasio Demo Auth
        </div>
        <h1 className="mt-4 text-3xl font-semibold">
          {state === "checking" ? "Memeriksa akses" : "Dashboard terkunci"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#6b6056]">{message}</p>

        {state !== "checking" ? (
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#241f1a] px-5 text-sm font-semibold text-white transition hover:bg-[#3a3129]"
          >
            Kembali ke halaman utama
          </Link>
        ) : null}
      </div>
    </main>
  );
}
