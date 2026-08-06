"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { tryCreateSupabaseBrowserClient } from "@/lib/supabase/browser";

type LoginStatus = "idle" | "loading" | "error";

const DEMO_USERS = {
  "owner@occasio.app": {
    password: "OccasioOwner123!",
    role: "owner",
    path: "/owner/dashboard",
  },
  "client@occasio.app": {
    password: "OccasioClient123!",
    role: "client",
    path: "/client/dashboard",
  },
} as const;

function withTimeout<T>(promise: Promise<T>, timeoutMs = 1800): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), timeoutMs);
    }),
  ]);
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@occasio.app");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const demoUser = DEMO_USERS[normalizedEmail as keyof typeof DEMO_USERS];
      const supabase = tryCreateSupabaseBrowserClient();

      if (demoUser && demoUser.password === password) {
        localStorage.setItem(
          "occasio_demo_session",
          JSON.stringify({
            email: normalizedEmail,
            role: demoUser.role,
            loggedInAt: new Date().toISOString(),
            source: "demo",
          }),
        );

        router.push(demoUser.path);
        return;
      }

      if (supabase) {
        const authResult = await withTimeout(
          supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          }),
        );
        const authData = authResult?.data;
        const authError = authResult?.error;

        if (!authError && authData?.user) {
          const profileResult = await withTimeout(
            Promise.resolve(
              supabase
                .from("profiles")
                .select("role")
                .eq("id", authData.user.id)
                .single(),
            ),
          );
          const profile = profileResult?.data;
          const role = profile?.role === "owner" ? "owner" : "client";

          localStorage.setItem(
            "occasio_demo_session",
            JSON.stringify({
              email: normalizedEmail,
              role,
              loggedInAt: new Date().toISOString(),
              source: "supabase",
            }),
          );

          router.push(role === "owner" ? "/owner/dashboard" : "/client/dashboard");
          return;
        }
      }

      throw new Error("Email atau password demo belum cocok.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Login gagal. Coba lagi.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-[#e0d4c7] bg-white p-6 shadow-[0_18px_48px_rgba(82,57,38,0.08)]">
      <div className="inline-flex rounded-full bg-[#efe5d8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9a6a3a]">
        Demo Login
      </div>

      <h3 className="mt-5 text-2xl font-semibold">Login akun Occasio</h3>
      <p className="mt-3 text-sm leading-6 text-[#6b6056]">
        Sementara Supabase Auth dinonaktifkan. Gunakan akun demo owner atau client,
        lalu dashboard akan terbuka sesuai role.
      </p>

      <div className="mt-5 grid gap-2 text-sm md:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            setEmail("owner@occasio.app");
            setPassword("OccasioOwner123!");
            setMessage("");
          }}
          className="rounded-md border border-[#e0d4c7] bg-[#fffaf4] px-3 py-2 text-left font-semibold text-[#5a4028] transition hover:bg-[#efe5d8]"
        >
          Pakai Owner
        </button>
        <button
          type="button"
          onClick={() => {
            setEmail("client@occasio.app");
            setPassword("OccasioClient123!");
            setMessage("");
          }}
          className="rounded-md border border-[#e0d4c7] bg-[#fffaf4] px-3 py-2 text-left font-semibold text-[#5a4028] transition hover:bg-[#efe5d8]"
        >
          Pakai Client
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#756a60]">Email</span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-[#e0d4c7] bg-[#fffaf4] px-3 text-sm outline-none transition focus:border-[#9a6a3a]"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#756a60]">Password</span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-[#e0d4c7] bg-[#fffaf4] px-3 text-sm outline-none transition focus:border-[#9a6a3a]"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="Isi password demo"
            required
          />
        </label>
      </div>

      {message ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white transition hover:bg-[#3a3129] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Memproses..." : "Login"}
      </button>
    </form>
  );
}
